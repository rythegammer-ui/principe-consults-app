// ── Payment Links System ────────────────────────────────────
// Send Stripe payment links via GHL SMS/email
// Track payment link status on leads

import useAppStore from '../store/useAppStore';
import { searchContact, createContact, sendSMS, sendEmail } from '../utils/ghl';
import { pushNotification } from './notifications';

const TIERS = {
  launchpad: { name: 'Launchpad', settingsKey: 'stripeLaunchpadUrl', price: '$997' },
  growth: { name: 'Growth Engine', settingsKey: 'stripeGrowthUrl', price: '$2,500 + $500/mo' },
  fullstack: { name: 'Full Stack', settingsKey: 'stripeFullStackUrl', price: '$5,000 + $1,000/mo' },
};

export function getTierInfo(tierKey) {
  return TIERS[tierKey] || TIERS.launchpad;
}

export function getPaymentUrl(tierKey) {
  const settings = useAppStore.getState().settings;
  const tier = TIERS[tierKey];
  if (!tier) return null;
  return settings[tier.settingsKey] || null;
}

export function buildSMSMessage(lead, tierKey) {
  const tier = getTierInfo(tierKey);
  const url = getPaymentUrl(tierKey);
  const firstName = (lead.ownerName || lead.businessName || '').split(' ')[0];
  return `Hey ${firstName}, here's your secure payment link for ${tier.name} with Principe Consults — ${url} — Any questions? Reply here.`;
}

export function buildEmailHTML(lead, tierKey) {
  const tier = getTierInfo(tierKey);
  const url = getPaymentUrl(tierKey);
  const settings = useAppStore.getState().settings;
  const features = {
    launchpad: ['Custom 5-page website', 'Google Business Profile setup', 'SEO optimization', 'Contact form + click-to-call', '30-day support'],
    growth: ['Everything in Launchpad', 'Custom landing page', 'Google Ads management', 'Call tracking', 'Monthly performance reports'],
    fullstack: ['Everything in Growth Engine', 'GoHighLevel CRM setup', 'SMS & email automation', 'Reputation management', 'Bi-weekly strategy calls'],
  };

  return `
<div style="max-width:600px;margin:0 auto;background:#111;color:#f0f0f0;font-family:Arial,sans-serif;border-radius:12px;overflow:hidden;">
  <div style="background:#DC2626;padding:24px;text-align:center;">
    <h1 style="margin:0;font-size:24px;color:white;">${settings.agencyName || 'Principe Consults'}</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;margin:0 0 8px 0;color:#f0f0f0;">${tier.name} Package</h2>
    <p style="font-size:28px;font-weight:bold;color:#22c55e;margin:0 0 24px 0;">${tier.price}</p>
    <p style="color:#a0a0a0;line-height:1.6;margin-bottom:24px;">
      Hi ${(lead.ownerName || lead.businessName || '').split(' ')[0]},<br><br>
      Here's your personalized package for ${lead.businessName}. Everything you need to grow your business online.
    </p>
    <h3 style="font-size:16px;color:#f0f0f0;margin-bottom:12px;">What's Included:</h3>
    <ul style="color:#a0a0a0;line-height:2;padding-left:20px;margin-bottom:32px;">
      ${(features[tierKey] || []).map(f => `<li>${f}</li>`).join('')}
    </ul>
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${url}" style="display:inline-block;background:#DC2626;color:white;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
        Complete Payment
      </a>
    </div>
    <p style="color:#555;font-size:13px;text-align:center;">
      Questions? Reply to this email or call ${settings.agencyPhone || 'us'} directly.<br>
      ${settings.ownerName || 'Ryan'} — ${settings.agencyName || 'Principe Consults'}
    </p>
  </div>
</div>`;
}

export async function sendPaymentLink(lead, tierKey, method) {
  const store = useAppStore.getState();
  const settings = store.settings;
  const url = getPaymentUrl(tierKey);
  const tier = getTierInfo(tierKey);

  if (!url) {
    store.addNotification(`No payment link configured for ${tier.name}. Set it in Settings > Integrations.`, 'error');
    return false;
  }

  const results = { sms: false, email: false };

  try {
    // Find or create contact in GHL
    let contactId = lead.ghlContactId;
    if (!contactId && settings.ghlApiKey && settings.ghlLocationId) {
      const existing = lead.phone ? await searchContact(settings.ghlApiKey, settings.ghlLocationId, lead.phone) : null;
      if (existing) {
        contactId = existing.id;
      } else {
        const created = await createContact(settings.ghlApiKey, settings.ghlLocationId, lead);
        contactId = created?.id;
      }
      if (contactId) store.updateLead(lead.id, { ghlContactId: contactId });
    }

    if ((method === 'sms' || method === 'both') && contactId) {
      const smsText = buildSMSMessage(lead, tierKey);
      await sendSMS(settings.ghlApiKey, contactId, smsText);
      results.sms = true;
    }

    if ((method === 'email' || method === 'both') && contactId) {
      const html = buildEmailHTML(lead, tierKey);
      await sendEmail(settings.ghlApiKey, contactId, `Your ${tier.name} Package — ${settings.agencyName || 'Principe Consults'}`, html);
      results.email = true;
    }

    // Log the payment link on the lead
    const paymentLinks = lead.paymentLinks || [];
    paymentLinks.push({
      tier: tierKey,
      tierName: tier.name,
      url,
      sentAt: new Date().toISOString(),
      sentVia: method,
      status: 'sent',
    });
    store.updateLead(lead.id, { paymentLinks, paymentStatus: 'sent', paymentTier: tierKey });

    // Activity log
    store.addActivity(`Payment link (${tier.name}) sent to ${lead.businessName} via ${method}`, 'payment', store.currentUser?.id, lead.id);

    // Notification
    pushNotification({
      type: 'payment_sent',
      title: `Payment link sent`,
      message: `${tier.name} link sent to ${lead.businessName} via ${method}`,
      leadId: lead.id,
      leadName: lead.businessName,
    });

    store.addNotification(`Payment link sent to ${lead.businessName}!`, 'success');
    return true;
  } catch (err) {
    console.error('Failed to send payment link:', err);
    store.addNotification(`Failed to send payment link: ${err.message || 'Unknown error'}`, 'error');
    return false;
  }
}

export function getPaymentStatus(lead) {
  if (!lead.paymentLinks || lead.paymentLinks.length === 0) return null;
  const latest = lead.paymentLinks[lead.paymentLinks.length - 1];
  if (lead.paymentStatus === 'paid') return { status: 'paid', tier: latest.tierName, color: 'var(--green)' };

  // Check if overdue
  const settings = useAppStore.getState().settings;
  const overdueMs = (settings.overdueHours || 72) * 60 * 60 * 1000;
  const sentAt = new Date(latest.sentAt).getTime();
  if (Date.now() - sentAt > overdueMs) return { status: 'overdue', tier: latest.tierName, color: 'var(--red)' };

  return { status: 'sent', tier: latest.tierName, color: 'var(--yellow)' };
}
