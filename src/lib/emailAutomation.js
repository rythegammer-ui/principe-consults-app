// ── Email/SMS Sequence Engine ────────────────────────────────
// 5-touch sequences per package tier.
// Sequences are stored on the lead record and checked/advanced
// when the app is active (client-side scheduling).

import useAppStore from '../store/useAppStore';
import { pushNotification } from './notifications';

// Sequence steps: day offsets from enrollment
const SEQUENCE_STEPS = [
  { day: 0, type: 'sms', label: 'Day 0 — Introduction' },
  { day: 1, type: 'email', label: 'Day 1 — Follow Up' },
  { day: 3, type: 'sms', label: 'Day 3 — Value Prop' },
  { day: 5, type: 'email', label: 'Day 5 — Social Proof' },
  { day: 10, type: 'sms', label: 'Day 10 — Final Touch' },
];

export function getSequenceStatus(lead) {
  const seq = lead.emailSequence;
  if (!seq) return null;
  return {
    status: seq.status, // 'active' | 'paused' | 'completed' | 'cancelled'
    currentStep: seq.currentStep || 0,
    totalSteps: SEQUENCE_STEPS.length,
    tier: seq.packageTier,
    nextSendAt: seq.nextSendAt,
    startedAt: seq.startedAt,
  };
}

export function enrollInSequence(leadId, packageTier) {
  const store = useAppStore.getState();
  const lead = store.leads.find(l => l.id === leadId);
  if (!lead) return;

  // Don't re-enroll if already active
  if (lead.emailSequence?.status === 'active') return;

  const now = new Date();
  store.updateLead(leadId, {
    emailSequence: {
      status: 'active',
      currentStep: 0,
      packageTier: packageTier || 'growth',
      startedAt: now.toISOString(),
      nextSendAt: now.toISOString(), // First message sends immediately
      pausedAt: null,
    },
  });

  store.addActivity(`Email sequence started for ${lead.businessName} (${packageTier || 'Growth Engine'})`, 'outreach', store.currentUser?.id, leadId);
}

export function pauseSequence(leadId) {
  const store = useAppStore.getState();
  const lead = store.leads.find(l => l.id === leadId);
  if (!lead?.emailSequence) return;

  store.updateLead(leadId, {
    emailSequence: {
      ...lead.emailSequence,
      status: 'paused',
      pausedAt: new Date().toISOString(),
    },
  });

  store.addActivity(`Email sequence paused for ${lead.businessName}`, 'outreach', store.currentUser?.id, leadId);
}

export function resumeSequence(leadId) {
  const store = useAppStore.getState();
  const lead = store.leads.find(l => l.id === leadId);
  if (!lead?.emailSequence || lead.emailSequence.status !== 'paused') return;

  store.updateLead(leadId, {
    emailSequence: {
      ...lead.emailSequence,
      status: 'active',
      pausedAt: null,
      nextSendAt: new Date().toISOString(),
    },
  });

  store.addActivity(`Email sequence resumed for ${lead.businessName}`, 'outreach', store.currentUser?.id, leadId);
}

export function cancelSequence(leadId) {
  const store = useAppStore.getState();
  const lead = store.leads.find(l => l.id === leadId);
  if (!lead?.emailSequence) return;

  store.updateLead(leadId, {
    emailSequence: {
      ...lead.emailSequence,
      status: 'cancelled',
    },
  });

  store.addActivity(`Email sequence cancelled for ${lead.businessName}`, 'outreach', store.currentUser?.id, leadId);
}

// Auto-pause sequences when lead replies, books demo, or closes
export function autoCheckSequences() {
  const store = useAppStore.getState();
  const pauseStatuses = ['Replied', 'Demo Scheduled', 'Demo Completed', 'Proposal Sent', 'Closed Won', 'Dead'];

  store.leads.forEach(lead => {
    if (lead.emailSequence?.status !== 'active') return;

    // Auto-pause if lead moved to a stage that should pause
    if (pauseStatuses.includes(lead.status)) {
      store.updateLead(lead.id, {
        emailSequence: {
          ...lead.emailSequence,
          status: lead.status === 'Closed Won' || lead.status === 'Dead' ? 'completed' : 'paused',
          pausedAt: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if sequence should advance
    const seq = lead.emailSequence;
    if (seq.currentStep >= SEQUENCE_STEPS.length) {
      store.updateLead(lead.id, {
        emailSequence: { ...seq, status: 'completed' },
      });
      pushNotification({
        type: 'sequence_complete',
        title: 'Sequence completed',
        message: `${lead.businessName} — all ${SEQUENCE_STEPS.length} touches sent`,
        leadId: lead.id,
        leadName: lead.businessName,
      });
    }
  });
}

export async function generateSequenceCopy(lead, packageTier) {
  const store = useAppStore.getState();
  const apiKey = store.settings.anthropicApiKey;
  if (!apiKey) return null;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 768,
        messages: [{
          role: 'user',
          content: `Generate a 5-touch outreach sequence for a ${lead.type || 'local service'} business called "${lead.businessName}" in ${lead.city || 'DFW'}. Package: ${packageTier}.

Return ONLY valid JSON array:
[
  {"day": 0, "type": "sms", "text": "SMS intro <160 chars"},
  {"day": 1, "type": "email", "subject": "email subject", "text": "email body 2-3 sentences"},
  {"day": 3, "type": "sms", "text": "SMS value prop <160 chars"},
  {"day": 5, "type": "email", "subject": "email subject", "text": "email body with social proof"},
  {"day": 10, "type": "sms", "text": "SMS final touch <160 chars"}
]

Tone: direct, casual, results-focused. Mention their business type. Include soft CTAs.`
        }],
      }),
    });

    const data = await resp.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Sequence copy generation failed:', err);
    return null;
  }
}

export { SEQUENCE_STEPS };
