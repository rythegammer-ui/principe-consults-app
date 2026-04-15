// ── Pipeline Stage Automation Triggers ───────────────────────
// Fires actions when a lead moves between pipeline stages.
// Called from moveLeadStatus in the store.

import useAppStore from '../store/useAppStore';
import { pushNotification } from './notifications';

export function onStageChange(lead, oldStatus, newStatus) {
  const store = useAppStore.getState();
  const settings = store.settings;

  // Log automation
  const logEntry = {
    action: `Stage change: ${oldStatus} → ${newStatus}`,
    triggeredAt: new Date().toISOString(),
    automated: true,
  };
  const automationLog = lead.automationLog || [];
  automationLog.push(logEntry);
  store.updateLead(lead.id, { automationLog });

  // ── New → Contacted ──
  if (newStatus === 'Contacted' && oldStatus === 'New') {
    pushNotification({
      type: 'lead_assigned',
      title: 'Outreach started',
      message: `${lead.businessName} moved to Contacted`,
      leadId: lead.id,
      leadName: lead.businessName,
    });
  }

  // ── Any → Demo Scheduled ──
  if (newStatus === 'Demo Scheduled') {
    pushNotification({
      type: 'demo_booked',
      title: 'Demo booked!',
      message: `${lead.businessName} has a demo scheduled`,
      leadId: lead.id,
      leadName: lead.businessName,
    });

    // Auto-send booking confirmation if we have a booking link and GHL
    if (settings.bookingLink && lead.phone) {
      store.addActivity(`Booking link ready to send to ${lead.businessName}`, 'pipeline', store.currentUser?.id, lead.id);
    }
  }

  // ── Any → Closed Won ──
  if (newStatus === 'Closed Won') {
    pushNotification({
      type: 'deal_closed',
      title: 'Deal closed!',
      message: `${lead.businessName} — ${lead.tierFit || 'Deal'} closed!`,
      leadId: lead.id,
      leadName: lead.businessName,
    });

    store.addActivity(`Deal closed: ${lead.businessName}`, 'payment', store.currentUser?.id, lead.id);
  }

  // ── Any → Dead ──
  if (newStatus === 'Dead') {
    store.addActivity(`${lead.businessName} marked as Dead`, 'pipeline', store.currentUser?.id, lead.id);
  }

  // ── Replied ──
  if (newStatus === 'Replied') {
    pushNotification({
      type: 'lead_replied',
      title: 'Lead replied!',
      message: `${lead.businessName} replied to outreach`,
      leadId: lead.id,
      leadName: lead.businessName,
    });
  }
}

// Check for stale leads (called on app load or periodically)
export function checkStaleLeads() {
  const store = useAppStore.getState();
  const settings = store.settings;
  const staleDays = settings.staleDays || 7;
  const now = Date.now();
  const staleThreshold = staleDays * 24 * 60 * 60 * 1000;

  const activeStatuses = ['New', 'Contacted', 'Replied', 'Demo Scheduled', 'Demo Completed', 'Proposal Sent'];

  store.leads.forEach(lead => {
    if (!activeStatuses.includes(lead.status)) return;
    if (lead.isStale) return; // Already flagged

    const lastActivity = lead.lastActivityAt || lead.createdAt;
    if (!lastActivity) return;

    const timeSince = now - new Date(lastActivity).getTime();
    if (timeSince > staleThreshold) {
      store.updateLead(lead.id, { isStale: true });
      pushNotification({
        type: 'lead_stale',
        title: 'Lead going stale',
        message: `${lead.businessName} — no activity in ${staleDays}+ days`,
        leadId: lead.id,
        leadName: lead.businessName,
        userId: lead.assignedTo,
      });
    }
  });
}

// Check for overdue payment links
export function checkOverduePayments() {
  const store = useAppStore.getState();
  const settings = store.settings;
  const overdueMs = (settings.overdueHours || 72) * 60 * 60 * 1000;
  const now = Date.now();

  store.leads.forEach(lead => {
    if (!lead.paymentLinks || lead.paymentLinks.length === 0) return;
    if (lead.paymentStatus === 'paid') return;

    const latest = lead.paymentLinks[lead.paymentLinks.length - 1];
    if (latest.status === 'overdue') return; // Already flagged

    const sentAt = new Date(latest.sentAt).getTime();
    if (now - sentAt > overdueMs) {
      const updatedLinks = [...lead.paymentLinks];
      updatedLinks[updatedLinks.length - 1] = { ...latest, status: 'overdue' };
      store.updateLead(lead.id, { paymentLinks: updatedLinks, paymentStatus: 'overdue' });
    }
  });
}
