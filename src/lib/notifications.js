// ── In-App Notification System ──────────────────────────────
// Writes notifications to the store. Each notification has:
// { id, type, title, message, leadId, leadName, read, createdAt }

import useAppStore from '../store/useAppStore';

const TYPES = {
  lead_assigned: { icon: 'UserPlus', color: 'var(--blue)' },
  lead_replied: { icon: 'MessageSquare', color: 'var(--green)' },
  demo_booked: { icon: 'Calendar', color: 'var(--purple)' },
  deal_closed: { icon: 'CheckCircle2', color: 'var(--green)' },
  payment_sent: { icon: 'CreditCard', color: 'var(--yellow)' },
  payment_received: { icon: 'DollarSign', color: 'var(--green)' },
  sequence_complete: { icon: 'Zap', color: 'var(--blue)' },
  lead_stale: { icon: 'AlertTriangle', color: 'var(--yellow)' },
  reengagement_reply: { icon: 'MessageSquare', color: 'var(--green)' },
  proposal_opened: { icon: 'FileText', color: 'var(--purple)' },
};

export function getNotificationType(type) {
  return TYPES[type] || { icon: 'Bell', color: 'var(--text2)' };
}

let idCounter = Date.now();

export function pushNotification({ type, title, message, leadId, leadName, userId }) {
  const store = useAppStore.getState();
  const currentUser = store.currentUser;

  // If userId specified, only notify that user. Otherwise notify current user.
  if (userId && currentUser?.id !== userId) return;

  const notification = {
    id: 'NOTIF-' + (++idCounter).toString(36),
    type,
    title,
    message,
    leadId: leadId || null,
    leadName: leadName || null,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const existing = store.appNotifications || [];
  const updated = [notification, ...existing].slice(0, 100); // Keep last 100
  useAppStore.setState({ appNotifications: updated });

  // Also show a toast for high-priority notifications
  if (type === 'payment_received' || type === 'deal_closed') {
    store.addNotification(title, 'success');
  }
}

export function markNotificationRead(id) {
  const store = useAppStore.getState();
  const updated = (store.appNotifications || []).map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  useAppStore.setState({ appNotifications: updated });
}

export function markAllNotificationsRead() {
  const store = useAppStore.getState();
  const updated = (store.appNotifications || []).map(n => ({ ...n, read: true }));
  useAppStore.setState({ appNotifications: updated });
}

export function getUnreadCount() {
  const store = useAppStore.getState();
  return (store.appNotifications || []).filter(n => !n.read).length;
}
