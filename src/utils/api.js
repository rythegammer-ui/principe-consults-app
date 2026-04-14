export const OUTREACH_SYSTEM_PROMPT = `You are a cold outreach copywriter for Principe Consults, a web design and digital growth agency in DFW run by Ryan Principe. Ryan is a hands-on operator who builds websites, Google Ads, and CRM systems for local service businesses. He is direct, confident, and results-focused. No fluff, no guru speak. His agency offers three tiers: Launchpad ($997 one-time), Growth Engine ($2,500 + $500/mo), and Full Stack ($5,000 + $1,000/mo). Outreach never mentions price. Always pitches a free 15-min demo.`;

export function buildOutreachPrompt(lead) {
  const websiteInfo = lead.hasWebsite ? `yes — ${lead.websiteUrl}` : 'no';
  return `Write a 5-touch SMS outreach sequence for this business:
Name: ${lead.businessName}
Type: ${lead.type}
City: ${lead.city}
Has website: ${websiteInfo}
Google rating: ${lead.rating}/5

Rules:
- Each message under 160 characters
- Sounds like a real human texting, not a bot or marketer
- References something specific about their business
- Never use: leverage, synergy, game-changer, revolutionize
- Never start with Hey [Name]!
- Day 1: spark curiosity only
- Day 3-7: build toward a 15-min demo
- Day 10: soft respectful exit, leave door open
- Sign off: - Ryan
- Never mention price

Return ONLY valid JSON array, no markdown, no backticks:
[{"day":1,"type":"Opener","text":"..."},{"day":3,"type":"Follow-up","text":"..."},{"day":5,"type":"Value Drop","text":"..."},{"day":7,"type":"Objection Handle","text":"..."},{"day":10,"type":"Break-up","text":"..."}]`;
}

export const PROPOSAL_SYSTEM_PROMPT = `You are a proposal writer for Principe Consults, a web design and digital growth agency in DFW run by Ryan Principe. You write professional, clean, persuasive proposals for local service businesses. The tone is confident and direct — no fluff, no jargon, no filler. Every proposal should feel custom-built for that specific business. Use specific details about their industry, their city, and their current online presence to make it feel personal. The goal is to make the prospect feel like Ryan already understands their business and has a clear plan to get them results.`;

export function buildProposalPrompt(lead, settings, tier) {
  const websiteInfo = lead.hasWebsite ? `Yes — ${lead.websiteUrl}` : 'No website currently';
  const tierDetails = {
    'Launchpad': {
      price: settings.avgDealLaunchpad || 997,
      monthly: null,
      name: 'Launchpad',
      deliverables: [
        'Custom 5-page website (Home, About, Services, Gallery, Contact)',
        'Mobile-optimized responsive design',
        'Google Business Profile setup & optimization',
        'Basic on-page SEO (title tags, meta descriptions, schema markup)',
        'Contact form + click-to-call button',
        'Google Maps embed',
        '30-day post-launch support',
      ],
    },
    'Growth Engine': {
      price: settings.avgDealGrowth || 2500,
      monthly: settings.retainerGrowth || 500,
      name: 'Growth Engine',
      deliverables: [
        'Everything in Launchpad',
        'Custom high-converting landing page for ads',
        'Google Ads campaign setup + ongoing management',
        'Dedicated call tracking number with recording',
        'Monthly performance report with call data + lead metrics',
        'Conversion rate optimization',
      ],
    },
    'Full Stack': {
      price: settings.avgDealFullStack || 5000,
      monthly: settings.retainerFullStack || 1000,
      name: 'Full Stack',
      deliverables: [
        'Everything in Growth Engine',
        'GoHighLevel CRM setup + automation',
        'Automated SMS & email follow-up sequences',
        'Reputation management (automated review requests)',
        'Short-form video strategy + 4 scripts/month',
        'Bi-weekly strategy calls with Ryan',
        'Priority support',
      ],
    },
  };

  const selected = tierDetails[tier] || tierDetails['Growth Engine'];

  return `Write a professional proposal for this business. Return ONLY valid JSON, no markdown, no backticks.

CLIENT INFO:
- Business Name: ${lead.businessName}
- Business Type: ${lead.type}
- Owner: ${lead.ownerName || 'Business Owner'}
- City: ${lead.city}
- Website: ${websiteInfo}
- Google Rating: ${lead.rating}/5
- Notes from calls/outreach: ${lead.notes || 'None'}

PACKAGE: ${selected.name}
- One-time investment: $${selected.price.toLocaleString()}
${selected.monthly ? `- Monthly retainer: $${selected.monthly.toLocaleString()}/mo` : ''}
- Deliverables: ${selected.deliverables.join('; ')}

Return this exact JSON structure:
{
  "headline": "A bold, specific one-line headline for the proposal (reference their business name and what they'll get)",
  "summary": "2-3 sentence executive summary. Reference their specific business, city, industry. Explain what we'll do and the expected outcome. Be specific — mention things like 'inbound calls', 'Google visibility in ${lead.city}', their industry.",
  "problems": ["3-4 specific problems this business likely has based on their type, rating, and web presence. Each 1-2 sentences. Be concrete — reference their industry and competitors."],
  "solutions": ["3-4 solutions mapped to the problems above. Each explains how we fix it. Reference specific deliverables from the package."],
  "deliverables": [${JSON.stringify(selected.deliverables.map(d => `"${d}"`))}],
  "timeline": "A realistic 2-3 sentence project timeline. Week 1: discovery + wireframes. Week 2-3: build. Week 4: launch + optimization. Adjust based on the package.",
  "investment": {
    "oneTime": ${selected.price},
    "monthly": ${selected.monthly || 'null'},
    "packageName": "${selected.name}"
  },
  "whyUs": "2-3 sentences on why Principe Consults specifically. Mention Ryan's hands-on approach, DFW focus, results for similar businesses. Keep it direct.",
  "nextSteps": "2-3 sentences. Clear call to action — book a call, sign the agreement, get started. Include urgency without being pushy.",
  "validUntil": "${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}"
}`;
}

export const LEAD_GEN_SYSTEM_PROMPT = `You are a lead research assistant for Principe Consults, a DFW web design and digital growth agency run by Ryan Principe. Your job is to generate realistic leads — local service businesses that would be ideal clients. Focus on businesses that are likely to need web design, Google Ads, or CRM automation. Prioritize businesses that have poor online presence, no website, few Google reviews, or outdated websites. These are the businesses most likely to convert. Always provide realistic phone numbers, emails, and details. Base your suggestions on the DFW metroplex area unless told otherwise.`;

export function buildLeadGenPrompt(businessType, city, count = 10, notes = '') {
  return `Generate ${count} realistic leads for the following criteria:

Business Type: ${businessType}
City/Area: ${city}
${notes ? `Additional Notes: ${notes}` : ''}

For each lead, provide realistic details for a local business that likely needs web design / digital marketing help. Think about businesses with:
- No website or an outdated one
- Few Google reviews (2-4 star range)
- No Google Ads presence
- Service businesses that rely on local customers

Return ONLY valid JSON array, no markdown, no backticks:
[{
  "businessName": "Example Business Name",
  "type": "${businessType}",
  "ownerName": "First Last",
  "city": "${city}",
  "phone": "9725550101",
  "email": "owner@example.com",
  "hasWebsite": false,
  "websiteUrl": "",
  "rating": 3.8,
  "notes": "Brief note about why they're a good lead — e.g. no website, outdated site, few reviews",
  "tierFit": "Growth Engine $2,500"
}]

Make every lead unique and realistic. Vary the tier fit between Launchpad $997, Growth Engine $2,500, and Full Stack $5,000 based on how much they'd benefit.`;
}

export async function callClaude(apiKey, systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${res.status}`);
  }

  const data = await res.json();
  let text = data.content?.[0]?.text || '';
  // Strip markdown fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return text;
}
