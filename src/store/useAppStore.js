import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  saveToFirebase,
  saveToFirebaseStrict,
  loadFromFirebase,
  subscribeToFirebase,
  createAccount,
  signIn,
  signOut,
  onAuthChanged,
  encodeEmail,
  isFirebaseConfigured,
  deleteCurrentAuthUser,
} from '../utils/firebase';

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

// ── Default settings for new accounts ───────────────────────
const DEFAULT_SETTINGS = {
  // Agency
  agencyName: 'Principe Consults',
  ownerName: '',
  defaultCity: 'DFW',
  agencyPhone: '',
  agencyEmail: '',
  // Packages & Deals
  avgDealLaunchpad: 997,
  avgDealGrowth: 2500,
  avgDealFullStack: 5000,
  retainerGrowth: 500,
  retainerFullStack: 1000,
  // Stripe Payment Links
  stripeLaunchpadUrl: '',
  stripeGrowthUrl: '',
  stripeFullStackUrl: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  // Communications
  bookingLink: '',
  calendarName: '',
  clientIntakeFormUrl: '',
  digestEmailRecipients: '',
  sendgridApiKey: '',
  // Integrations
  anthropicApiKey: '',
  ghlApiKey: '',
  ghlLocationId: '',
  ghlWorkflows: '',
  // Commissions
  commissionDemo: 50,
  commissionLaunchpad: 150,
  commissionGrowth: 300,
  commissionFullStack: 500,
  commissionRetainerPct: 15,
  // Automation Thresholds
  staleDays: 7,
  coldDays: 14,
  overdueHours: 72,
  hotScoreCutoff: 70,
  warmScoreCutoff: 40,
};

let idCounter = Date.now();
const genId = (prefix = '') => prefix + (++idCounter).toString(36);

// Invite code = the account's Firebase UID (guaranteed unique, no index needed)

// Debounce Firebase writes
let syncTimers = {};
function debouncedSync(key, data, delay = 500) {
  if (syncTimers[key]) clearTimeout(syncTimers[key]);
  syncTimers[key] = setTimeout(() => {
    const accountId = useAppStore.getState().accountId;
    if (accountId) {
      saveToFirebase(`accounts/${accountId}/${key}`, data);
    }
  }, delay);
}

// Keys that sync to Firebase under each account
const SYNC_KEYS = ['users', 'leads', 'callLogs', 'payments', 'payoutRequests', 'activityLog', 'settings'];

// Helper: convert Firebase objects back to arrays
function normalizeData(data) {
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null && !data.agencyName) return Object.values(data);
  return data;
}

const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Auth & Account State ────────────────────────────────
      accountId: null,
      currentUser: null,
      authLoading: true,
      onboardingComplete: true,
      firebaseConnected: false,
      firebaseUnsubscribers: [],

      // ── Data (starts empty, loaded from Firebase) ───────────
      appNotifications: [],
      users: [],
      leads: [],
      callLogs: [],
      payments: [],
      payoutRequests: [],
      activityLog: [],
      settings: DEFAULT_SETTINGS,

      // ── Auth: Initialize auth state listener ────────────────
      initAuth: () => {
        if (!isFirebaseConfigured()) {
          set({ authLoading: false });
          return;
        }

        onAuthChanged(async (firebaseUser) => {
          if (firebaseUser) {
            const uid = firebaseUser.uid;

            // Primary lookup: userAccounts/{uid} (secured per-user).
            // Fallback to emailIndex for pre-existing accounts.
            let userAccount = await loadFromFirebase(`userAccounts/${uid}`);
            if (!userAccount && firebaseUser.email) {
              const emailData = await loadFromFirebase(`emailIndex/${encodeEmail(firebaseUser.email)}`);
              if (emailData) {
                userAccount = emailData;
                // Backfill userAccounts so future reads are fast and rules pass.
                await saveToFirebase(`userAccounts/${uid}`, emailData);
              }
            }
            const accountId = userAccount?.accountId || uid;
            const userId = userAccount?.userId || 'owner';

            set({ accountId });

            // Load account profile
            const profile = await loadFromFirebase(`accounts/${accountId}/profile`);
            if (profile) {
              // Load users list to find this user's info
              const usersData = await loadFromFirebase(`accounts/${accountId}/users`);
              const userList = normalizeData(usersData) || [];
              const matchedUser = userList.find(u => u.id === userId) || userList[0];

              if (matchedUser) {
                set({
                  currentUser: { ...matchedUser, password: undefined },
                  onboardingComplete: profile.onboardingComplete !== false,
                  authLoading: false,
                });
              } else {
                set({ authLoading: false });
              }
              get()._connectToAccount(accountId);
            } else {
              // Account record doesn't exist yet (mid-signup)
              set({ authLoading: false });
            }
          } else {
            // Signed out — clear everything in memory AND localStorage
            get()._disconnectAccount();
            try { localStorage.removeItem('principe-console-storage'); } catch { /* ignore */ }
            set({
              accountId: null,
              currentUser: null,
              authLoading: false,
              firebaseConnected: false,
              users: [],
              leads: [],
              callLogs: [],
              payments: [],
              payoutRequests: [],
              activityLog: [],
              appNotifications: [],
              settings: DEFAULT_SETTINGS,
              onboardingComplete: true,
            });
          }
        });

        // Cross-tab logout sync
        try {
          window.addEventListener('storage', (e) => {
            if (e.key === 'principe-console-logout' && e.newValue) {
              get().logout();
            }
          });
        } catch { /* SSR */ }
      },

      // ── Auth: Signup as ADMIN (creates a new agency account) ──
      signup: async (name, email, password, agencyName) => {
        const normalizedEmail = normalizeEmail(email);
        const firebaseUser = await createAccount(normalizedEmail, password);
        const accountId = firebaseUser.uid;

        const ownerUser = {
          id: 'owner',
          name,
          email: normalizedEmail,
          role: 'admin',
          avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          active: true,
        };

        const initialSettings = {
          ...DEFAULT_SETTINGS,
          agencyName: agencyName || 'Principe Consults',
          ownerName: name,
          agencyEmail: normalizedEmail,
        };

        // Create account profile
        const profile = {
          ownerName: name,
          email: normalizedEmail,
          agencyName: agencyName || 'Principe Consults',
          createdAt: new Date().toISOString(),
          onboardingComplete: false,
        };

        // Write userAccounts FIRST so security rules let us write the rest.
        const userAccountEntry = { accountId, userId: 'owner', role: 'admin' };
        await saveToFirebaseStrict(`userAccounts/${accountId}`, userAccountEntry);

        // Critical: these must actually land or the account is unusable.
        await saveToFirebaseStrict(`accounts/${accountId}/profile`, profile);
        await saveToFirebaseStrict(`accounts/${accountId}/users`, [ownerUser]);
        await saveToFirebaseStrict(`accounts/${accountId}/settings`, initialSettings);
        // Non-critical initialisations — empty arrays can be auto-created later.
        await saveToFirebase(`accounts/${accountId}/leads`, []);
        await saveToFirebase(`accounts/${accountId}/callLogs`, []);
        await saveToFirebase(`accounts/${accountId}/payments`, []);
        await saveToFirebase(`accounts/${accountId}/payoutRequests`, []);
        await saveToFirebase(`accounts/${accountId}/activityLog`, []);

        // Create email index (readable by all authed users, for invite lookup + login)
        await saveToFirebaseStrict(`emailIndex/${encodeEmail(normalizedEmail)}`, userAccountEntry);

        set({
          accountId,
          currentUser: ownerUser,
          users: [ownerUser],
          leads: [],
          callLogs: [],
          payments: [],
          payoutRequests: [],
          activityLog: [],
          settings: initialSettings,
          onboardingComplete: false,
        });

        get()._connectToAccount(accountId);
        return true;
      },

      // ── Auth: Signup as REP (join existing agency with invite code) ──
      joinAgency: async (name, email, password, inviteCode) => {
        const accountId = (inviteCode || '').trim();
        const normalizedEmail = normalizeEmail(email);

        if (!accountId) {
          throw { code: 'invalid-invite', message: 'Invite code is required.' };
        }

        // Create Firebase Auth account FIRST so we're authenticated
        // (Firebase rules require auth for reads)
        const firebaseUser = await createAccount(normalizedEmail, password);

        // Now verify the invite code (account ID) is valid
        const profile = await loadFromFirebase(`accounts/${accountId}/profile`);
        if (!profile) {
          // Invalid code — clean up the newly created auth account so the email isn't orphaned
          try { await deleteCurrentAuthUser(); } catch { /* ignore */ }
          try { await signOut(); } catch { /* ignore */ }
          throw { code: 'invalid-invite', message: 'Invalid invite code. Ask your admin for the correct code.' };
        }

        // If admin pre-created a seat for this email, reuse the existing userId
        const usersData = await loadFromFirebase(`accounts/${accountId}/users`);
        const userList = normalizeData(usersData) || [];
        const existingSeat = userList.find(u => normalizeEmail(u.email) === normalizedEmail);
        const userId = existingSeat?.id || genId('U');

        const newUser = {
          id: userId,
          name,
          email: normalizedEmail,
          role: existingSeat?.role || 'rep',
          avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          active: true,
          pendingSignup: false,
        };

        // Write userAccounts FIRST — security rules need this to allow the
        // subsequent write to accounts/{accountId}/users.
        const userAccountEntry = { accountId, userId: newUser.id, role: newUser.role };
        await saveToFirebaseStrict(`userAccounts/${firebaseUser.uid}`, userAccountEntry);

        // Replace seat if present, else append
        const nextUsers = existingSeat
          ? userList.map(u => u.id === userId ? { ...u, ...newUser } : u)
          : [...userList, newUser];
        await saveToFirebaseStrict(`accounts/${accountId}/users`, nextUsers);

        // Create email index pointing to this account
        await saveToFirebaseStrict(`emailIndex/${encodeEmail(normalizedEmail)}`, userAccountEntry);

        set({
          accountId,
          currentUser: newUser,
          onboardingComplete: false, // reps go through training onboarding
        });

        get()._connectToAccount(accountId);
        return true;
      },

      // ── Auth: Login ─────────────────────────────────────────
      login: async (email, password) => {
        try {
          const normalizedEmail = normalizeEmail(email);
          // Firebase Auth sign-in (works for both owners and reps)
          const firebaseUser = await signIn(normalizedEmail, password);

          // Primary lookup: userAccounts/{uid} (scoped by rules). Fallback: emailIndex.
          let userAccount = await loadFromFirebase(`userAccounts/${firebaseUser.uid}`);
          if (!userAccount) {
            userAccount = await loadFromFirebase(`emailIndex/${encodeEmail(normalizedEmail)}`);
            if (userAccount) {
              // Backfill for future rule-based reads
              await saveToFirebase(`userAccounts/${firebaseUser.uid}`, userAccount);
            }
          }
          if (!userAccount) return false;

          const { accountId, userId } = userAccount;

          // Load the user's info from the account
          const usersData = await loadFromFirebase(`accounts/${accountId}/users`);
          const userList = normalizeData(usersData) || [];
          const user = userList.find(u => u.id === userId);
          if (!user) return false;

          const profile = await loadFromFirebase(`accounts/${accountId}/profile`);

          set({
            accountId,
            currentUser: { ...user, password: undefined },
            onboardingComplete: profile?.onboardingComplete !== false,
          });
          get()._connectToAccount(accountId);
          return true;
        } catch (authErr) {
          console.error('Login failed:', authErr);
          return false;
        }
      },

      // ── Auth: Logout ────────────────────────────────────────
      logout: async () => {
        get()._disconnectAccount();
        try { await signOut(); } catch { /* ignore */ }
        set({
          accountId: null,
          currentUser: null,
          firebaseConnected: false,
          firebaseUnsubscribers: [],
          users: [],
          leads: [],
          callLogs: [],
          payments: [],
          payoutRequests: [],
          activityLog: [],
          appNotifications: [],
          settings: DEFAULT_SETTINGS,
          onboardingComplete: true,
        });
        // Wipe persisted cache so cross-user sessions can't see stale data.
        try { localStorage.removeItem('principe-console-storage'); } catch { /* ignore */ }
        // Signal other tabs to log out too.
        try { localStorage.setItem('principe-console-logout', String(Date.now())); } catch { /* ignore */ }
      },

      // ── Internal: Connect to account's real-time data ──────
      _connectToAccount: (accountId) => {
        get()._disconnectAccount();

        const unsubs = SYNC_KEYS.map(key => {
          return subscribeToFirebase(`accounts/${accountId}/${key}`, (data) => {
            if (data != null) {
              const value = key === 'settings' ? data : normalizeData(data);
              set({ [key]: value });
            }
          });
        });

        set({ firebaseConnected: true, firebaseUnsubscribers: unsubs });
      },

      // ── Internal: Disconnect subscriptions ─────────────────
      _disconnectAccount: () => {
        const unsubs = get().firebaseUnsubscribers;
        unsubs.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
        set({ firebaseUnsubscribers: [] });
      },

      // ── Internal: Sync a key to Firebase ───────────────────
      _syncKey: (key) => {
        if (!get().accountId) return;
        debouncedSync(key, get()[key]);
      },

      // ── Get invite code (admin only) — the invite code IS the accountId ──
      getInviteCode: async () => {
        return get().accountId || null;
      },

      // ── Password reset (sends email via Firebase Auth) ──
      requestPasswordReset: async (email) => {
        const { sendPasswordResetEmail } = await import('../utils/firebase');
        await sendPasswordResetEmail(normalizeEmail(email));
      },

      // ── Onboarding (admin only) ────────────────────────────
      completeOnboarding: async (settingsPatch) => {
        const accountId = get().accountId;
        if (!accountId) return;

        const newSettings = { ...get().settings, ...settingsPatch };
        set({ settings: newSettings, onboardingComplete: true });

        await saveToFirebase(`accounts/${accountId}/settings`, newSettings);
        await saveToFirebase(`accounts/${accountId}/profile/onboardingComplete`, true);
        if (settingsPatch.agencyName) {
          await saveToFirebase(`accounts/${accountId}/profile/agencyName`, settingsPatch.agencyName);
        }
        get().addActivity('Account onboarding completed', 'system', 'owner');
      },

      // ── Leads ──────────────────────────────────────────────
      addLead: (lead) => {
        const newLead = { ...lead, id: genId('L'), createdAt: new Date().toISOString(), outreachMessages: [], outreachStage: null };
        set(s => ({ leads: [...s.leads, newLead] }));
        get().addActivity(`Lead "${lead.businessName}" created`, 'lead', get().currentUser?.id);
        get()._syncKey('leads');
        return newLead;
      },
      updateLead: (id, patch) => {
        set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, ...patch } : l) }));
        get()._syncKey('leads');
      },
      deleteLead: (id) => {
        const lead = get().leads.find(l => l.id === id);
        set(s => ({ leads: s.leads.filter(l => l.id !== id) }));
        if (lead) get().addActivity(`Lead "${lead.businessName}" deleted`, 'lead', get().currentUser?.id);
        get()._syncKey('leads');
      },
      importLeads: (newLeads) => {
        const mapped = newLeads.map(l => ({ ...l, id: genId('L'), createdAt: new Date().toISOString(), outreachMessages: [], outreachStage: null, status: l.status || 'New' }));
        set(s => ({ leads: [...s.leads, ...mapped] }));
        get().addActivity(`Imported ${mapped.length} leads`, 'lead', get().currentUser?.id);
        get()._syncKey('leads');
      },

      // ── Calls ──────────────────────────────────────────────
      logCall: (callLog) => {
        const newLog = { ...callLog, id: genId('CL'), timestamp: new Date().toISOString() };
        set(s => ({ callLogs: [...s.callLogs, newLog] }));
        const lead = get().leads.find(l => l.id === callLog.leadId);
        get().addActivity(`Call logged for "${lead?.businessName || 'Unknown'}" — ${callLog.outcome}`, 'call', get().currentUser?.id, callLog.leadId);
        if (callLog.followUpDate) {
          get().updateLead(callLog.leadId, { followUpDate: callLog.followUpDate });
        }
        get()._syncKey('callLogs');
        return newLog;
      },

      // ── Pipeline ───────────────────────────────────────────
      moveLeadStatus: (leadId, newStatus) => {
        const lead = get().leads.find(l => l.id === leadId);
        const oldStatus = lead?.status;
        set(s => ({ leads: s.leads.map(l => l.id === leadId ? { ...l, status: newStatus, lastActivityAt: new Date().toISOString(), isStale: false } : l) }));
        if (lead) {
          get().addActivity(`"${lead.businessName}" moved from ${oldStatus} to ${newStatus}`, 'pipeline', get().currentUser?.id, leadId);
          // Fire pipeline automation triggers
          try {
            import('../lib/pipelineTriggers').then(({ onStageChange }) => {
              onStageChange({ ...lead, status: newStatus }, oldStatus, newStatus);
            });
          } catch { /* non-blocking */ }
        }
        get()._syncKey('leads');
      },

      // ── Payments ───────────────────────────────────────────
      addPayment: (payment) => {
        const newPayment = { ...payment, id: genId('PAY') };
        set(s => ({ payments: [...s.payments, newPayment] }));
        get().addActivity(`Payment of $${payment.amount.toLocaleString()} recorded for ${payment.businessName}`, 'payment', get().currentUser?.id, payment.leadId);
        get()._syncKey('payments');
        return newPayment;
      },
      updatePayment: (id, patch) => {
        set(s => ({ payments: s.payments.map(p => p.id === id ? { ...p, ...patch } : p) }));
        get()._syncKey('payments');
      },
      deletePayment: (id) => {
        set(s => ({ payments: s.payments.filter(p => p.id !== id) }));
        get()._syncKey('payments');
      },

      // ── Payout Requests ────────────────────────────────────
      requestPayout: (amount, method, notes) => {
        const user = get().currentUser;
        const request = {
          id: genId('PO'), userId: user.id, userName: user.name,
          amount, method, notes, status: 'pending',
          requestedAt: new Date().toISOString(),
          reviewedBy: null, reviewedAt: null, paidAt: null, stripePayoutId: null,
        };
        set(s => ({ payoutRequests: [...s.payoutRequests, request] }));
        get().addActivity(`${user.name} requested a payout of $${amount.toLocaleString()}`, 'payout', user.id);
        get().addNotification('Payout request submitted!', 'success');
        get()._syncKey('payoutRequests');
        return request;
      },
      approvePayout: (id) => {
        const admin = get().currentUser;
        set(s => ({
          payoutRequests: s.payoutRequests.map(r => r.id === id ? {
            ...r, status: 'approved', reviewedBy: admin.id, reviewedAt: new Date().toISOString(),
          } : r),
        }));
        const req = get().payoutRequests.find(r => r.id === id);
        get().addActivity(`Payout of $${req?.amount.toLocaleString()} for ${req?.userName} approved by ${admin.name}`, 'payout', admin.id);
        get().addNotification('Payout approved', 'success');
        get()._syncKey('payoutRequests');
      },
      rejectPayout: (id, reason) => {
        const admin = get().currentUser;
        set(s => ({
          payoutRequests: s.payoutRequests.map(r => r.id === id ? {
            ...r, status: 'rejected', reviewedBy: admin.id, reviewedAt: new Date().toISOString(), notes: r.notes + (reason ? ` | Rejected: ${reason}` : ''),
          } : r),
        }));
        get().addActivity(`Payout request rejected by ${admin.name}`, 'payout', admin.id);
        get().addNotification('Payout rejected', 'info');
        get()._syncKey('payoutRequests');
      },
      markPayoutPaid: (id, stripePayoutId) => {
        const admin = get().currentUser;
        set(s => ({
          payoutRequests: s.payoutRequests.map(r => r.id === id ? {
            ...r, status: 'paid', paidAt: new Date().toISOString(), stripePayoutId: stripePayoutId || null,
          } : r),
        }));
        const req = get().payoutRequests.find(r => r.id === id);
        get().addActivity(`Payout of $${req?.amount.toLocaleString()} sent to ${req?.userName}`, 'payout', admin.id);
        get().addNotification('Payout marked as paid', 'success');
        get()._syncKey('payoutRequests');
      },

      // ── Activity Log ───────────────────────────────────────
      addActivity: (description, type, userId, leadId = null) => {
        set(s => {
          const newLog = [...s.activityLog, { id: genId('ACT'), description, type, userId, leadId, timestamp: new Date().toISOString() }];
          return { activityLog: newLog.slice(-500) };
        });
        get()._syncKey('activityLog');
      },

      // ── Notifications (local only) ─────────────────────────
      notifications: [],
      addNotification: (message, type = 'info') => {
        const id = genId('N');
        set(s => ({ notifications: [...s.notifications, { id, message, type }] }));
        setTimeout(() => {
          set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
        }, 4000);
      },
      dismissNotification: (id) => {
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
      },

      // ── Settings ───────────────────────────────────────────
      updateSettings: (patch) => {
        set(s => ({ settings: { ...s.settings, ...patch } }));
        get().addNotification('Settings saved.', 'success');
        get()._syncKey('settings');
      },
      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
        get().addNotification('Settings reset to defaults.', 'info');
      },

      // ── Team ───────────────────────────────────────────────
      // Pre-creates a seat for a rep. The rep completes signup themselves using
      // the agency invite code — their Firebase Auth account is created at that
      // point, and joinAgency will merge into this pre-created seat.
      addUser: async (user) => {
        const normalizedEmail = normalizeEmail(user.email);
        // Prevent duplicate seats for the same email within this account.
        const existing = get().users.find(u => normalizeEmail(u.email) === normalizedEmail);
        if (existing) {
          get().addNotification('A team member with that email already exists.', 'error');
          return existing;
        }
        // Don't persist any password — reps set their own at signup.
        const rest = { ...user };
        delete rest.password;
        const newUser = { ...rest, email: normalizedEmail, id: genId('U'), active: true, pendingSignup: true };
        set(s => ({ users: [...s.users, newUser] }));
        get().addActivity(`Team seat created for "${user.name}" — share the invite code`, 'team', get().currentUser?.id);
        get()._syncKey('users');
        return newUser;
      },
      updateUser: (id, patch) => {
        set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...patch } : u) }));
        get()._syncKey('users');
      },

      // ── UI ─────────────────────────────────────────────────
      sidebarCollapsed: false,
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // ── Reset (clears account data in Firebase too) ────────
      clearAllData: async () => {
        const accountId = get().accountId;
        if (accountId) {
          await saveToFirebase(`accounts/${accountId}/leads`, []);
          await saveToFirebase(`accounts/${accountId}/callLogs`, []);
          await saveToFirebase(`accounts/${accountId}/payments`, []);
          await saveToFirebase(`accounts/${accountId}/payoutRequests`, []);
          await saveToFirebase(`accounts/${accountId}/activityLog`, []);
        }
        set({
          leads: [],
          callLogs: [],
          payments: [],
          payoutRequests: [],
          activityLog: [],
          notifications: [],
          sidebarCollapsed: false,
        });
      },

      // Legacy compat
      connectFirebase: () => {
        const accountId = get().accountId;
        if (accountId && !get().firebaseConnected) {
          get()._connectToAccount(accountId);
        }
        return get().firebaseConnected;
      },
      seedFirebase: async () => {
        const accountId = get().accountId;
        if (!accountId) return;
        const state = get();
        for (const key of SYNC_KEYS) {
          await saveToFirebase(`accounts/${accountId}/${key}`, state[key]);
        }
        get().addNotification('Data synced to cloud!', 'success');
      },
      pullFromFirebase: async () => {
        const accountId = get().accountId;
        if (!accountId) return;
        for (const key of SYNC_KEYS) {
          const data = await loadFromFirebase(`accounts/${accountId}/${key}`);
          if (data != null) {
            const value = key === 'settings' ? data : normalizeData(data);
            set({ [key]: value });
          }
        }
        get().addNotification('Data loaded from cloud!', 'success');
      },
    }),
    {
      name: 'principe-console-storage',
      partialize: (state) => ({
        accountId: state.accountId,
        currentUser: state.currentUser,
        onboardingComplete: state.onboardingComplete,
        users: state.users,
        leads: state.leads,
        callLogs: state.callLogs,
        payments: state.payments,
        payoutRequests: state.payoutRequests,
        activityLog: state.activityLog,
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

export default useAppStore;
