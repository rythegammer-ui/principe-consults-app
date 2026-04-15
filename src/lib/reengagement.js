// ── Re-Engagement Campaigns ─────────────────────────────────
// Generates AI SMS sequences for cold leads and sends via GHL

import useAppStore from '../store/useAppStore';
import { pushNotification } from './notifications';

export function getColdLeads() {
  const store = useAppStore.getState();
  const settings = store.settings;
  const coldDays = settings.coldDays || 14;
  const coldThreshold = coldDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const activeStatuses = ['New', 'Contacted', 'Replied'];

  return store.leads.filter(lead => {
    if (!activeStatuses.includes(lead.status)) return false;
    const lastActivity = lead.lastActivityAt || lead.createdAt;
    if (!lastActivity) return false;
    return (now - new Date(lastActivity).getTime()) > coldThreshold;
  });
}

export async function generateReengagementSequence(leads) {
  const store = useAppStore.getState();
  const settings = store.settings;
  const apiKey = settings.anthropicApiKey;

  if (!apiKey) {
    store.addNotification('Set your Anthropic API key in Settings > Integrations', 'error');
    return null;
  }

  const leadSummaries = leads.slice(0, 10).map(l =>
    `${l.businessName} (${l.type}, ${l.city})`
  ).join(', ');

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
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Generate a 3-message SMS re-engagement sequence for cold leads who haven't responded in 2+ weeks. These are local service businesses in DFW: ${leadSummaries}.

Return ONLY valid JSON array with 3 messages:
[
  {"day": 0, "text": "message 1 - pattern interrupt hook, <160 chars"},
  {"day": 2, "text": "message 2 - social proof, <160 chars"},
  {"day": 5, "text": "message 3 - final offer with urgency, <160 chars"}
]

Tone: casual, human, no corporate language. Reference their business type. Include a soft CTA.`
        }],
      }),
    });

    const data = await resp.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Re-engagement generation failed:', err);
    store.addNotification(`Re-engagement generation failed: ${err.message}`, 'error');
    return null;
  }
}

export function markLeadsReengaged(leadIds) {
  const store = useAppStore.getState();
  leadIds.forEach(id => {
    store.updateLead(id, {
      reengagementStartedAt: new Date().toISOString(),
      isStale: false,
      lastActivityAt: new Date().toISOString(),
    });
  });

  store.addActivity(`Re-engagement campaign launched for ${leadIds.length} cold leads`, 'outreach', store.currentUser?.id);

  pushNotification({
    type: 'sequence_complete',
    title: 'Re-engagement launched',
    message: `${leadIds.length} cold leads entered re-engagement sequence`,
  });

  store.addNotification(`Re-engagement launched for ${leadIds.length} leads`, 'success');
}
