import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  saveToFirebase,
  loadFromFirebase,
  subscribeToFirebase,
  createAccount,
  signIn,
  signOut,
  onAuthChanged,
  encodeEmail,
  isFirebaseConfigured,
} from '../utils/firebase';

// ── Default settings for new accounts ───────────────────────
const DEFAULT_SETTINGS = {
  agencyName: 'Principe Consults',
  ownerName: '',
  defaultCity: 'DFW',
  agencyPhone: '',
  agencyEmail: '',
  avgDealLaunchpad: 997,
  avgDealGrowth: 2500,
  avgDealFullStack: 5000,
  retainerGrowth: 500,
  retainerFullStack: 1000,
  bookingLink: '',
  calendarName: '',
  anthropicApiKey: '',
  stripeSecretKey: '',
  stripePaymentLinkBase: '',
  ghlApiKey: '',
  ghlLocationId: '',
  ghlWorkflows: '',
  commissionDemo: 50,
  commissionLaunchpad: 150,
  commissionGrowth: 300,
  commissionFullStack: 500,
  commissionRetainerPct: 15,
};

let idCounter = Date.now();
const genId = (prefix = '') => prefix + (++idCounter).toString(36);

// Generate a short invite code like "PC-7X2K"
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return 'PC-' + code;
}

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

            // Look up which account this user belongs to
            const emailData = await loadFromFirebase(`emailIndex/${encodeEmail(firebaseUser.email)}`);
            const accountId = emailData?.accountId || uid;
            const userId = emailData?.userId || 'owner';

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
            // Signed out — clear everything
            get()._disconnectAccount();
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
              settings: DEFAULT_SETTINGS,
              onboardingComplete: true,
            });
          }
        });
      },

      // ── Auth: Signup as ADMIN (creates a new agency account) ──
      signup: async (name, email, password, agencyName) => {
        const firebaseUser = await createAccount(email, password);
        const accountId = firebaseUser.uid;
        const inviteCode = generateInviteCode();

        const ownerUser = {
          id: 'owner',
          name,
          email,
          role: 'admin',
          avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          active: true,
        };

        const initialSettings = {
          ...DEFAULT_SETTINGS,
          agencyName: agencyName || 'Principe Consults',
          ownerName: name,
          agencyEmail: email,
        };

        // Create account profile
        const profile = {
          ownerName: name,
          email,
          agencyName: agencyName || 'Principe Consults',
          inviteCode,
          createdAt: new Date().toISOString(),
          onboardingComplete: false,
        };

        // Write all initial data to Firebase
        await saveToFirebase(`accounts/${accountId}/profile`, profile);
        await saveToFirebase(`accounts/${accountId}/users`, [ownerUser]);
        await saveToFirebase(`accounts/${accountId}/leads`, []);
        await saveToFirebase(`accounts/${accountId}/callLogs`, []);
        await saveToFirebase(`accounts/${accountId}/payments`, []);
        await saveToFirebase(`accounts/${accountId}/payoutRequests`, []);
        await saveToFirebase(`accounts/${accountId}/activityLog`, []);
        await saveToFirebase(`accounts/${accountId}/settings`, initialSettings);

        // Create invite code index for rep signups
        await saveToFirebase(`inviteCodes/${inviteCode}`, accountId);

        // Create email index
        await saveToFirebase(`emailIndex/${encodeEmail(email)}`, {
          accountId,
          userId: 'owner',
          role: 'admin',
        });

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
        // Look up the invite code to find the account
        const accountId = await loadFromFirebase(`inviteCodes/${inviteCode.toUpperCase().trim()}`);
        if (!accountId) {
          throw { code: 'invalid-invite', message: 'Invalid invite code. Ask your admin for the correct code.' };
        }

        // Create Firebase Auth account for the rep
        const firebaseUser = await createAccount(email, password);

        const newUser = {
          id: genId('U'),
          name,
          email,
          role: 'rep',
          avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          active: true,
        };

        // Add rep to the account's users list
        const usersData = await loadFromFirebase(`accounts/${accountId}/users`);
        const userList = normalizeData(usersData) || [];
        userList.push(newUser);
        await saveToFirebase(`accounts/${accountId}/users`, userList);

        // Create email index pointing to this account
        await saveToFirebase(`emailIndex/${encodeEmail(email)}`, {
          accountId,
          userId: newUser.id,
          role: 'rep',
        });

        // Load account data
        const profile = await loadFromFirebase(`accounts/${accountId}/profile`);

        set({
          accountId,
          currentUser: newUser,
          onboardingComplete: true, // reps skip onboarding — admin already set it up
        });

        get()._connectToAccount(accountId);
        return true;
      },

      // ── Auth: Login ─────────────────────────────────────────
      login: async (email, password) => {
        try {
          // Firebase Auth sign-in (works for both owners and reps)
          const firebaseUser = await signIn(email, password);

          // Look up which account this user belongs to
          const emailData = await loadFromFirebase(`emailIndex/${encodeEmail(email)}`);
          if (!emailData) return false;

          const { accountId, userId } = emailData;

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
        try { await signOut(); } catch (e) { /* ignore */ }
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
          settings: DEFAULT_SETTINGS,
          onboardingComplete: true,
        });
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

      // ── Get invite code (admin only) ───────────────────────
      getInviteCode: async () => {
        const accountId = get().accountId;
        if (!accountId) return null;
        const profile = await loadFromFirebase(`accounts/${accountId}/profile`);
        return profile?.inviteCode || null;
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
      leads: [],
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
      callLogs: [],
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
        set(s => ({ leads: s.leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l) }));
        if (lead) {
          get().addActivity(`"${lead.businessName}" moved from ${oldStatus} to ${newStatus}`, 'pipeline', get().currentUser?.id, leadId);
        }
        get()._syncKey('leads');
      },

      // ── Payments ───────────────────────────────────────────
      payments: [],
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
      payoutRequests: [],
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
      activityLog: [],
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
      settings: DEFAULT_SETTINGS,
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
      addUser: async (user) => {
        const newUser = { ...user, id: genId('U'), active: true };
        set(s => ({ users: [...s.users, newUser] }));
        get().addActivity(`Team member "${user.name}" added`, 'team', get().currentUser?.id);
        get()._syncKey('users');

        // Add to email index so they can log in
        if (user.email) {
          const accountId = get().accountId;
          await saveToFirebase(`emailIndex/${encodeEmail(user.email)}`, {
            accountId,
            userId: newUser.id,
            role: newUser.role || 'rep',
          });
        }

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
