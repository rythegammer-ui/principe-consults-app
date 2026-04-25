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
  isFirebaseConfigured,
  deleteCurrentAuthUser,
} from '../utils/firebase';

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

// ── Default settings for new accounts ───────────────────────
// Settings are readable by every account member (and editable by admins).
// Sensitive credentials live in `secrets` (see DEFAULT_SECRETS) and are
// gated by stricter rules so reps can't change them.
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
  // Stripe Payment Links (these are public payment URLs, not secrets)
  stripeLaunchpadUrl: '',
  stripeGrowthUrl: '',
  stripeFullStackUrl: '',
  // Communications
  bookingLink: '',
  calendarName: '',
  clientIntakeFormUrl: '',
  // Integrations (non-sensitive identifiers)
  ghlLocationId: '',
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

// Credentials and other sensitive values. Stored under `accounts/$id/secrets`
// (admin-only writes). We still expose a member read so the integrations the
// reps use day-to-day (GHL messaging, AI proposals) keep working without a
// server-side relay. Anything genuinely fatal-on-leak (Stripe secret key) is
// admin-only via the role check the Settings page already enforces.
const DEFAULT_SECRETS = {
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  anthropicApiKey: '',
  ghlApiKey: '',
  ghlWorkflows: '',
  sendgridApiKey: '',
  digestEmailRecipients: '',
};

const SECRET_KEYS = Object.keys(DEFAULT_SECRETS);

let idCounter = Date.now();
const genId = (prefix = '') => prefix + (++idCounter).toString(36);

// Invite code = the account's Firebase UID. UIDs are 28-char unguessable
// strings, so they function as bearer tokens once shared. Cross-tenant leak
// vectors (emailIndex, world-readable profile/users) were closed in this
// commit, so the only way to discover an account ID is through the admin
// sharing it.

// Debounce Firebase writes
const syncTimers = {};
function debouncedSync(key, data, delay = 500) {
  if (syncTimers[key]) clearTimeout(syncTimers[key]);
  syncTimers[key] = setTimeout(() => {
    const accountId = useAppStore.getState().accountId;
    if (!accountId) return;
    saveToFirebase(`accounts/${accountId}/${key}`, data).catch((err) => {
      const code = err?.code || err?.message || 'unknown';
      useAppStore.getState().addNotification(
        `Couldn't sync ${key} to cloud (${code}). Your changes are local only.`,
        'error',
      );
    });
  }, delay);
}

// Keys that sync to Firebase under each account
const SYNC_KEYS = ['users', 'leads', 'callLogs', 'payments', 'payoutRequests', 'activityLog', 'settings', 'secrets'];

// Helper: convert Firebase objects back to arrays
function normalizeData(data, key) {
  if (data == null) return data;
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    if (key === 'settings' || key === 'secrets') return data;
    return Object.values(data);
  }
  return data;
}

// Strip secret-shaped keys out of a settings object — used during migration
// from the legacy "everything in settings" shape.
function partitionSettings(input) {
  const settings = {};
  const secrets = {};
  for (const [k, v] of Object.entries(input || {})) {
    if (SECRET_KEYS.includes(k)) secrets[k] = v;
    else settings[k] = v;
  }
  return { settings, secrets };
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
      secrets: DEFAULT_SECRETS,

      // ── Auth: Initialize auth state listener ────────────────
      initAuth: () => {
        if (!isFirebaseConfigured()) {
          set({ authLoading: false });
          return;
        }

        onAuthChanged(async (firebaseUser) => {
          if (firebaseUser) {
            const uid = firebaseUser.uid;

            // Single source of truth: userAccounts/{uid}. The legacy
            // emailIndex fallback was dropped because it was world-readable
            // and world-writable.
            const userAccount = await loadFromFirebase(`userAccounts/${uid}`);
            if (!userAccount) {
              // Auth account exists but no membership record — treat as
              // unfinished signup and clear in-memory state.
              set({ accountId: null, currentUser: null, authLoading: false });
              return;
            }

            const { accountId, userId } = userAccount;
            set({ accountId });

            // Load account profile
            const profile = await loadFromFirebase(`accounts/${accountId}/profile`);
            if (profile) {
              const usersData = await loadFromFirebase(`accounts/${accountId}/users`);
              const userList = normalizeData(usersData, 'users') || [];
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
              // Best-effort migration of legacy secrets stored in settings.
              if (matchedUser?.role === 'admin') {
                get()._migrateLegacySecrets(accountId).catch(() => { /* non-fatal */ });
              }
            } else {
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
              secrets: DEFAULT_SECRETS,
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
        const cleanAgencyName = (agencyName || '').trim() || 'Principe Consults';
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
          agencyName: cleanAgencyName,
          ownerName: name,
          agencyEmail: normalizedEmail,
        };

        const profile = {
          ownerName: name,
          email: normalizedEmail,
          agencyName: cleanAgencyName,
          createdAt: new Date().toISOString(),
          onboardingComplete: false,
        };

        // Write userAccounts FIRST so the account-member rules let us write
        // the rest of the tree.
        const userAccountEntry = { accountId, userId: 'owner', role: 'admin' };
        await saveToFirebaseStrict(`userAccounts/${accountId}`, userAccountEntry);

        await saveToFirebaseStrict(`accounts/${accountId}/profile`, profile);
        await saveToFirebaseStrict(`accounts/${accountId}/users`, [ownerUser]);
        await saveToFirebaseStrict(`accounts/${accountId}/settings`, initialSettings);
        await saveToFirebaseStrict(`accounts/${accountId}/secrets`, DEFAULT_SECRETS);
        await saveToFirebase(`accounts/${accountId}/leads`, []);
        await saveToFirebase(`accounts/${accountId}/callLogs`, []);
        await saveToFirebase(`accounts/${accountId}/payments`, []);
        await saveToFirebase(`accounts/${accountId}/payoutRequests`, []);
        await saveToFirebase(`accounts/${accountId}/activityLog`, []);

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
          secrets: DEFAULT_SECRETS,
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

        // Public read of the agency name verifies the invite without
        // exposing other tenant data.
        const agencyName = await loadFromFirebase(`accounts/${accountId}/profile/agencyName`);
        if (!agencyName) {
          throw { code: 'invalid-invite', message: 'Invalid invite code. Ask your admin for the correct code.' };
        }

        // Create the auth account only after the invite is confirmed valid.
        const firebaseUser = await createAccount(normalizedEmail, password);

        try {
          // Pull users to find any pre-created seat for this email.
          const usersData = await loadFromFirebase(`accounts/${accountId}/users`);
          const userList = normalizeData(usersData, 'users') || [];
          const existingSeat = userList.find(u => normalizeEmail(u.email) === normalizedEmail);
          // Default any joiner to 'rep' — admins can never be self-claimed.
          // Pre-created 'manager' seats keep their role.
          const safeRole = existingSeat?.role === 'manager' ? 'manager' : 'rep';
          const userId = existingSeat?.id || genId('U');

          const newUser = {
            id: userId,
            name,
            email: normalizedEmail,
            role: safeRole,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            active: true,
            pendingSignup: false,
          };

          // userAccounts must be written first; rules require it for the
          // subsequent users-array write.
          const userAccountEntry = { accountId, userId: newUser.id, role: safeRole };
          await saveToFirebaseStrict(`userAccounts/${firebaseUser.uid}`, userAccountEntry);

          const nextUsers = existingSeat
            ? userList.map(u => u.id === userId ? { ...u, ...newUser } : u)
            : [...userList, newUser];
          await saveToFirebaseStrict(`accounts/${accountId}/users`, nextUsers);

          set({
            accountId,
            currentUser: newUser,
            onboardingComplete: false,
          });

          get()._connectToAccount(accountId);
          return true;
        } catch (err) {
          // If anything after auth-creation failed, roll back the auth user
          // so the email isn't squatted with no membership record.
          try { await deleteCurrentAuthUser(); } catch { /* ignore */ }
          try { await signOut(); } catch { /* ignore */ }
          throw err;
        }
      },

      // ── Auth: Login ─────────────────────────────────────────
      login: async (email, password) => {
        try {
          const normalizedEmail = normalizeEmail(email);
          const firebaseUser = await signIn(normalizedEmail, password);

          const userAccount = await loadFromFirebase(`userAccounts/${firebaseUser.uid}`);
          if (!userAccount) return false;

          const { accountId, userId } = userAccount;

          const usersData = await loadFromFirebase(`accounts/${accountId}/users`);
          const userList = normalizeData(usersData, 'users') || [];
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
          secrets: DEFAULT_SECRETS,
          onboardingComplete: true,
        });
        try { localStorage.removeItem('principe-console-storage'); } catch { /* ignore */ }
        try { localStorage.setItem('principe-console-logout', String(Date.now())); } catch { /* ignore */ }
      },

      // ── Internal: Connect to account's real-time data ──────
      _connectToAccount: (accountId) => {
        get()._disconnectAccount();

        const unsubs = SYNC_KEYS.map(key => {
          return subscribeToFirebase(`accounts/${accountId}/${key}`, (data) => {
            const value = normalizeData(data, key);
            if (key === 'settings') {
              set({ settings: value || DEFAULT_SETTINGS });
            } else if (key === 'secrets') {
              set({ secrets: value || DEFAULT_SECRETS });
            } else {
              set({ [key]: value || [] });
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

      // ── Internal: One-time migration of legacy secrets in settings ──
      _migrateLegacySecrets: async (accountId) => {
        const settings = await loadFromFirebase(`accounts/${accountId}/settings`);
        if (!settings || typeof settings !== 'object') return;
        const hasLegacy = SECRET_KEYS.some(k => settings[k] != null && settings[k] !== '');
        if (!hasLegacy) return;
        const existingSecrets = (await loadFromFirebase(`accounts/${accountId}/secrets`)) || {};
        const { settings: cleanSettings, secrets: extracted } = partitionSettings(settings);
        const mergedSecrets = { ...DEFAULT_SECRETS, ...existingSecrets, ...extracted };
        try {
          await saveToFirebaseStrict(`accounts/${accountId}/secrets`, mergedSecrets);
          await saveToFirebaseStrict(`accounts/${accountId}/settings`, cleanSettings);
          get().addNotification('Migrated legacy API credentials to secured storage.', 'success');
        } catch (err) {
          console.warn('Secret migration deferred:', err);
        }
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

        const { settings: settingsOnly, secrets: secretsFromPatch } = partitionSettings(settingsPatch || {});
        const newSettings = { ...get().settings, ...settingsOnly };
        const newSecrets = Object.keys(secretsFromPatch).length
          ? { ...get().secrets, ...secretsFromPatch }
          : get().secrets;

        set({ settings: newSettings, secrets: newSecrets, onboardingComplete: true });

        await saveToFirebase(`accounts/${accountId}/settings`, newSettings);
        if (Object.keys(secretsFromPatch).length) {
          await saveToFirebase(`accounts/${accountId}/secrets`, newSecrets);
        }
        await saveToFirebase(`accounts/${accountId}/profile/onboardingComplete`, true);
        if (settingsOnly.agencyName) {
          await saveToFirebase(`accounts/${accountId}/profile/agencyName`, settingsOnly.agencyName);
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
        if (admin?.role !== 'admin' && admin?.role !== 'manager') {
          get().addNotification('Only admins or managers can approve payouts.', 'error');
          return;
        }
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
        if (admin?.role !== 'admin' && admin?.role !== 'manager') {
          get().addNotification('Only admins or managers can reject payouts.', 'error');
          return;
        }
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
        if (admin?.role !== 'admin' && admin?.role !== 'manager') {
          get().addNotification('Only admins or managers can mark payouts paid.', 'error');
          return;
        }
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

      // ── Settings (admin-only writes via rules) ─────────────
      updateSettings: (patch) => {
        // If the caller passed mixed setting/secret keys (legacy callers),
        // route the secret keys through updateSecrets.
        const { settings: settingsOnly, secrets: secretsFromPatch } = partitionSettings(patch);
        if (Object.keys(settingsOnly).length) {
          set(s => ({ settings: { ...s.settings, ...settingsOnly } }));
          get()._syncKey('settings');
        }
        if (Object.keys(secretsFromPatch).length) {
          get().updateSecrets(secretsFromPatch);
        }
        get().addNotification('Settings saved.', 'success');
      },
      updateSecrets: (patch) => {
        if (get().currentUser?.role !== 'admin') {
          get().addNotification('Only admins can update API credentials.', 'error');
          return;
        }
        set(s => ({ secrets: { ...s.secrets, ...patch } }));
        get()._syncKey('secrets');
      },
      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
        get().addNotification('Settings reset to defaults.', 'info');
      },

      // ── Team ───────────────────────────────────────────────
      addUser: async (user) => {
        const normalizedEmail = normalizeEmail(user.email);
        const existing = get().users.find(u => normalizeEmail(u.email) === normalizedEmail);
        if (existing) {
          get().addNotification('A team member with that email already exists.', 'error');
          return existing;
        }
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
            set({ [key]: normalizeData(data, key) });
          }
        }
        get().addNotification('Data loaded from cloud!', 'success');
      },
    }),
    {
      name: 'principe-console-storage',
      // Persist only auth/UI shell. Tenant data (leads/payments/etc.) is
      // hydrated from Firebase on connect, so persisting it locally just
      // creates a cross-session staleness window.
      partialize: (state) => ({
        accountId: state.accountId,
        currentUser: state.currentUser,
        onboardingComplete: state.onboardingComplete,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

export default useAppStore;
