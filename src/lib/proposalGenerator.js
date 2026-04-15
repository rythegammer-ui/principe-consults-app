// ── AI Proposal Generator ───────────────────────────────────
// Uses Claude Sonnet to generate branded HTML proposals
// Sent via GHL email, stored on lead record

import useAppStore from '../store/useAppStore';
import { pushNotification } from './notifications';

const TIER_DETAILS = {
  launchpad: {
    name: 'Launchpad', price: '$997', monthly: null,
    deliverables: ['Custom 5-page website (mobile optimized)', 'Google Business Profile setup & optimization', 'Basic SEO setup (meta tags, sitemap, schema)', 'Contact form + click-to-call button', '30-day post-launch support'],
    timeline: '2-3 weeks',
  },
  growth: {
    name: 'Growth Engine', price: '$2,500', monthly: '$500/mo',
    deliverables: ['Everything in Launchpad', 'Custom sales/landing page', 'Google Ads setup + ongoing management', 'Call tracking with recorded lines', 'Monthly performance report'],
    timeline: '3-4 weeks',
  },
  fullstack: {
    name: 'Full Stack', price: '$5,000', monthly: '$1,000/mo',
    deliverables: ['Everything in Growth Engine', 'GoHighLevel CRM setup', 'Automated SMS & email follow-up sequences', 'Reputation management (review requests)', 'Short-form video strategy + 4 scripts/month', 'Bi-weekly strategy calls'],
    timeline: '4-6 weeks',
  },
};

export function getRecommendedTier(lead) {
  if (!lead.hasWebsite && (!lead.rating || lead.rating < 4.0)) return 'launchpad';
  if (lead.dealValue >= 5000) return 'fullstack';
  if (lead.dealValue >= 2500) return 'growth';
  if (!lead.hasWebsite) return 'launchpad';
  return 'growth';
}

export async function generateProposal(lead, tierKey) {
  const store = useAppStore.getState();
  const settings = store.settings;
  const apiKey = settings.anthropicApiKey;

  if (!apiKey) {
    store.addNotification('Set your Anthropic API key in Settings > Integrations', 'error');
    return null;
  }

  const tier = TIER_DETAILS[tierKey] || TIER_DETAILS.growth;

  const prompt = `Generate a professional sales proposal for a web design agency. Return ONLY valid JSON, no markdown.

Business: ${lead.businessName}
Type: ${lead.type || 'Local Service Business'}
Location: ${lead.city || 'DFW, Texas'}
Has Website: ${lead.hasWebsite ? 'Yes (' + (lead.websiteUrl || 'unknown URL') + ')' : 'No'}
Google Rating: ${lead.rating || 'Unknown'}
Owner: ${lead.ownerName || 'Business Owner'}

Package: ${tier.name} (${tier.price}${tier.monthly ? ' + ' + tier.monthly + ' retainer' : ''})

Return JSON with these fields:
{
  "headline": "One compelling headline specific to their business",
  "problemStatement": "2-3 sentences about their specific problems based on their business type and online presence",
  "solution": "2-3 sentences about how this package solves their problems",
  "deliverables": ["list of specific deliverables"],
  "timeline": "Realistic timeline",
  "investment": "Price breakdown",
  "nextSteps": "What happens after they pay"
}

Tone: Direct, results-focused, confident. No buzzwords. Reference their specific business type and pain points.`;

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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await resp.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const proposal = JSON.parse(jsonMatch[0]);

    // Build HTML
    const html = buildProposalHTML(lead, tierKey, proposal, settings);

    // Store on lead
    const proposals = lead.proposals || [];
    proposals.push({
      tier: tierKey,
      tierName: tier.name,
      html,
      data: proposal,
      createdAt: new Date().toISOString(),
    });
    store.updateLead(lead.id, { proposals, proposal: proposal });

    store.addActivity(`AI proposal generated for ${lead.businessName} (${tier.name})`, 'lead', store.currentUser?.id, lead.id);
    pushNotification({ type: 'proposal_opened', title: 'Proposal generated', message: `${tier.name} proposal for ${lead.businessName}`, leadId: lead.id, leadName: lead.businessName });

    return { html, data: proposal };
  } catch (err) {
    console.error('Proposal generation failed:', err);
    store.addNotification(`Proposal generation failed: ${err.message}`, 'error');
    return null;
  }
}

function buildProposalHTML(lead, tierKey, proposal, settings) {
  const tier = TIER_DETAILS[tierKey];
  const paymentUrl = settings[`stripe${tierKey === 'launchpad' ? 'Launchpad' : tierKey === 'growth' ? 'Growth' : 'FullStack'}Url`] || '#';

  return `
<div style="max-width:640px;margin:0 auto;background:#111;color:#f0f0f0;font-family:Arial,sans-serif;border-radius:12px;overflow:hidden;">
  <div style="background:#DC2626;padding:28px;text-align:center;">
    <h1 style="margin:0;font-size:26px;color:white;font-weight:800;">${settings.agencyName || 'Principe Consults'}</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Proposal for ${lead.businessName}</p>
  </div>
  <div style="padding:36px;">
    <h2 style="font-size:22px;color:#f0f0f0;margin:0 0 16px;">${proposal.headline}</h2>

    <h3 style="font-size:14px;color:#DC2626;text-transform:uppercase;letter-spacing:0.1em;margin:24px 0 8px;">The Problem</h3>
    <p style="color:#a0a0a0;line-height:1.7;margin:0 0 20px;">${proposal.problemStatement}</p>

    <h3 style="font-size:14px;color:#DC2626;text-transform:uppercase;letter-spacing:0.1em;margin:24px 0 8px;">Our Solution: ${tier.name}</h3>
    <p style="color:#a0a0a0;line-height:1.7;margin:0 0 20px;">${proposal.solution}</p>

    <h3 style="font-size:14px;color:#DC2626;text-transform:uppercase;letter-spacing:0.1em;margin:24px 0 8px;">What's Included</h3>
    <ul style="color:#a0a0a0;line-height:2;padding-left:20px;margin:0 0 20px;">
      ${(proposal.deliverables || tier.deliverables).map(d => `<li>${d}</li>`).join('')}
    </ul>

    <h3 style="font-size:14px;color:#DC2626;text-transform:uppercase;letter-spacing:0.1em;margin:24px 0 8px;">Timeline</h3>
    <p style="color:#a0a0a0;margin:0 0 20px;">${proposal.timeline || tier.timeline}</p>

    <h3 style="font-size:14px;color:#DC2626;text-transform:uppercase;letter-spacing:0.1em;margin:24px 0 8px;">Investment</h3>
    <p style="font-size:28px;font-weight:bold;color:#22c55e;margin:0 0 4px;">${tier.price}</p>
    ${tier.monthly ? `<p style="color:#a0a0a0;margin:0 0 20px;">+ ${tier.monthly} monthly retainer</p>` : ''}

    <div style="text-align:center;margin:32px 0;">
      <a href="${paymentUrl}" style="display:inline-block;background:#DC2626;color:white;padding:18px 48px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:17px;">
        Get Started Now
      </a>
    </div>

    <h3 style="font-size:14px;color:#DC2626;text-transform:uppercase;letter-spacing:0.1em;margin:24px 0 8px;">Next Steps</h3>
    <p style="color:#a0a0a0;line-height:1.7;margin:0 0 24px;">${proposal.nextSteps}</p>

    ${settings.bookingLink ? `
    <div style="text-align:center;margin:24px 0;">
      <a href="${settings.bookingLink}" style="display:inline-block;background:#222;color:#f0f0f0;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;border:1px solid #333;">
        Book a Call to Discuss
      </a>
    </div>` : ''}

    <hr style="border:none;border-top:1px solid #333;margin:32px 0;">
    <p style="color:#555;font-size:13px;text-align:center;">
      ${settings.ownerName || 'Ryan Principe'} — ${settings.agencyName || 'Principe Consults'}<br>
      ${settings.agencyPhone ? settings.agencyPhone + ' | ' : ''}${settings.agencyEmail || ''}
    </p>
  </div>
</div>`;
}

export { TIER_DETAILS };
