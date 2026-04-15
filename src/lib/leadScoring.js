// ── Lead Scoring Engine (0–100) ─────────────────────────────
// Pure function — no side effects. Call with a lead object, get a score.

const HIGH_VALUE_TYPES = ['Auto Shop', 'HVAC', 'Roofing', 'Plumber', 'Electrician', 'Landscaping'];

export function calculateLeadScore(lead) {
  let score = 0;

  // Contact info signals
  if (lead.phone) score += 10;
  if (lead.email) score += 5;

  // Web presence signals
  if (!lead.hasWebsite) score += 25;       // No website = high opportunity
  else if (lead.hasWebsite) score += 10;   // Has website = some baseline value

  // Google rating signals
  if (lead.rating > 0 && lead.rating < 4.0) score += 20;  // Low rating = needs help

  // Business type signals
  if (HIGH_VALUE_TYPES.includes(lead.type)) score += 15;

  // Engagement signals
  if (lead.outreachStage === 'Sequence Active') score += 5;
  if (lead.status === 'Replied') score += 20;
  if (lead.status === 'Demo Scheduled' || lead.status === 'Demo Completed') score += 30;
  if (lead.status === 'Proposal Sent') score += 25;

  // Deal value signal
  if (lead.dealValue >= 5000) score += 10;
  else if (lead.dealValue >= 2500) score += 5;

  // Recency penalty
  if (lead.createdAt) {
    const daysSinceCreated = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated > 14) score -= 15;
    else if (daysSinceCreated > 7) score -= 10;
  }

  // Follow-up penalty
  if (lead.followUpDate) {
    const followUp = new Date(lead.followUpDate);
    if (followUp < new Date()) score -= 5; // Overdue follow-up
  }

  // Closed or dead leads
  if (lead.status === 'Closed Won') score = 100;
  if (lead.status === 'Dead') score = 0;

  return Math.max(0, Math.min(100, score));
}

export function getScoreColor(score) {
  if (score >= 81) return { bg: 'rgba(230,50,40,0.15)', text: '#ef4444', border: 'rgba(230,50,40,0.3)', label: 'Hot' };
  if (score >= 61) return { bg: 'rgba(251,146,60,0.15)', text: '#fb923c', border: 'rgba(251,146,60,0.3)', label: 'Warm' };
  if (score >= 31) return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'Medium' };
  return { bg: 'rgba(100,100,100,0.15)', text: '#6b7280', border: 'rgba(100,100,100,0.3)', label: 'Cold' };
}

export function getScoreLabel(score) {
  return getScoreColor(score).label;
}
