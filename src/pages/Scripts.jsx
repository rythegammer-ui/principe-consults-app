import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const TABS = ['Cold Call Scripts', 'Objection Handlers', 'Voicemail Scripts', 'Text Templates', 'Email Templates'];

function ScriptCard({ title, content }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--red)' }}>{title}</h4>
        <button className="btn-ghost" onClick={copy} style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <div style={{ fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
        {content}
      </div>
    </div>
  );
}

const COLD_CALL_SCRIPTS = [
  {
    title: 'Standard Opener',
    content: `OPENER:
"Hey, is this [Owner Name]?"

[YES] → "Hey, this is Brandon calling from Principe Consults — we're a web design and digital growth agency out of DFW. Quick question — are you the one who handles the marketing or web presence side of [Business Name]?"

[YES I AM / WHAT IS THIS ABOUT] → "Perfect. I'll keep this real short — I was looking at [your Google listing / your website / noticed you don't have a website yet] and I think we could realistically get you more inbound calls within 30 days. We do a free 15-minute demo where our founder Ryan walks you through exactly what that looks like for your specific business. Would that be worth 15 minutes this week?"

[MAYBE / TELL ME MORE] → "Totally. Basically Ryan will pull up your business live — your Google listing, your site if you have one, and show you specifically where you're leaving money on the table. It's free and takes 15 minutes. What's a good day — Tuesday or Thursday?"

[NO / NOT INTERESTED] → "No worries at all. Can I ask — is it just bad timing, or is this not something on your radar right now?" [Listen, log, and exit gracefully.]`
  },
  {
    title: 'No Website Variation',
    content: `"Hey [Owner Name], Brandon with Principe Consults. Quick one — I noticed [Business Name] doesn't have a website up right now, and honestly that jumped out because you've got a solid Google rating. You're doing great with word of mouth, but there's a ton of people searching '[Business Type] near me' in [City] every day that are just going to your competitors instead. We've helped businesses like yours start getting 10-20 new inbound calls a month just by getting set up properly online. Our founder Ryan does a free 15-minute demo where he shows you exactly what that looks like. Worth 15 minutes?"`
  },
  {
    title: 'Has Bad Website Variation',
    content: `"Hey [Owner Name], Brandon from Principe Consults. I was looking at [Business Name]'s website and — no offense — it might actually be hurting more than helping right now. I see a few things that would make me bounce if I were a potential customer looking for a [Business Type]. Our founder Ryan does a free 15-minute audit where he pulls up your site live, shows you what's costing you leads, and walks through what a fix looks like. Would that be worth a quick call this week?"`
  },
  {
    title: 'High Rating Business Variation',
    content: `"Hey [Owner Name], Brandon with Principe Consults. I came across [Business Name] — [rating] stars on Google, that's legit. You're clearly doing great work. My question is — are you getting as many new customers from the internet as you should be with a reputation like that? Because a lot of businesses with ratings like yours are leaving money on the table online. Our founder Ryan does a free 15-minute demo to show you what that gap looks like for your specific business. Worth a quick chat?"`
  },
  {
    title: 'Auto Shop Specific',
    content: `"Hey [Owner Name], Brandon from Principe Consults. I work with auto shops across DFW and noticed [Business Name] in [City]. Quick question — when someone in your area Googles 'oil change near me' or 'mechanic in [City]', are you showing up? Because if not, those calls are going straight to your competition. We've helped shops like yours go from invisible online to 15-20 new calls a month. Ryan does a free 15-minute demo — shows you exactly where you stand and what the fix looks like. Worth a quick call this week?"`
  },
  {
    title: 'HVAC / Trades Specific',
    content: `"Hey [Owner Name], Brandon with Principe Consults. I reach out to [Business Type] companies in DFW because honestly, most trades businesses are getting crushed online by guys running Google Ads and having real websites — even if they do worse work than you. We help level that playing field. Our founder Ryan does a free 15-minute demo where he pulls up your market, shows you who's winning the online game in [City], and what it would take for [Business Name] to show up instead. Worth a quick look?"`
  },
];

const OBJECTION_HANDLERS = [
  { objection: '"What does it cost?"', response: 'Totally fair — Ryan covers that on the call because it depends on what you actually need. Some clients are under $1,000, some are more. The demo\'s free and there\'s no obligation. Worst case you get a free audit.', notes: 'Redirect to value, not price.' },
  { objection: '"Send me info first"', response: 'I can do that — what\'s the best email? [get email] I\'ll send that now. Honestly the demo is way more useful than anything I\'d email you — Ryan actually pulls up your business live on the call. Would [day] or [day] work better?', notes: 'Get email, then pivot to booking.' },
  { objection: '"I already have a website"', response: 'That\'s great — Ryan actually works with a lot of businesses that already have sites. He looks at what\'s working and what might be costing you leads. The audit is free either way. Worth 15 minutes?', notes: 'Position as audit, not replacement.' },
  { objection: '"I\'m not interested"', response: 'Totally understand. Can I ask — is it the timing, or just not a priority for the web side right now? [Listen] Got it. Mind if I check back in 30 days?', notes: 'Soft close to future follow-up.' },
  { objection: '"I don\'t have the budget"', response: 'Appreciate the honesty. Our entry package starts at under $1,000 and most clients see ROI in the first month from new inbound calls. No pressure though — want me to follow up when timing is better?', notes: 'Reframe as investment, offer future follow-up.' },
  { objection: '"We use someone else"', response: 'Good to know — are they doing anything for your Google presence or ads, or mainly just maintaining the site? [Listen] Got it. I\'ll leave it alone — can I check back in if anything changes?', notes: 'Probe for gaps, exit respectfully.' },
  { objection: '"I\'m too busy"', response: 'Totally respect that — that\'s exactly why the demo is only 15 minutes and Ryan does all the work. He just needs your eyes for a half hour. What\'s a slow day this week?', notes: 'Emphasize low commitment.' },
];

const VM_SCRIPTS = [
  { title: 'Standard Voicemail', content: 'Hey [Name], Brandon here with Principe Consults in DFW. Was calling about your business\'s web presence — think there\'s a quick win for you. I\'ll shoot you a text. Talk soon.' },
  { title: 'Follow-up Voicemail', content: 'Hey [Name], Brandon again from Principe Consults. Just following up — totally understand if timing\'s off. Shooting you one more text. No pressure.' },
];

const TEXT_TEMPLATES = [
  { title: 'After Voicemail', content: 'Hey [Name], Brandon from Principe Consults. Just left you a VM — saw [Business Name] online and think we can help you get more inbound calls. Our founder does a free 15-min demo. Worth a look? - Ryan' },
  { title: 'After No Answer (no VM)', content: 'Hey [Name], tried reaching you about [Business Name]. We help local businesses in [City] get more calls through their website + Google. Free 15-min demo if you\'re open to it. - Ryan' },
  { title: 'Callback Confirmed', content: 'Hey [Name], Brandon from Principe Consults — thanks for being open to chatting. Here\'s the link to book a quick 15-min demo with Ryan: [BOOKING_LINK]. Talk soon!' },
  { title: 'Day Before Demo Reminder', content: 'Hey [Name], just a heads up — your demo with Ryan is tomorrow at [TIME]. He\'ll walk through everything live for [Business Name]. Looking forward to it! - Brandon' },
];

const EMAIL_TEMPLATES = [
  {
    title: 'Cold Outreach Email',
    content: `Subject: Quick question about [Business Name]'s web presence

Hi [Name],

I came across [Business Name] while researching [Business Type] businesses in [City]. You've got a solid reputation — [rating] stars on Google — but I noticed a few things online that might be costing you new customers.

We work with local service businesses across DFW to help them get more inbound calls through better web presence, Google Ads, and automated follow-up systems.

Our founder Ryan does a free 15-minute demo where he pulls up your business live and shows you exactly where the opportunities are. No pitch, no pressure — worst case you walk away with a free audit.

Would you be open to a quick call this week?

Best,
Brandon
Principe Consults
principeconsults.com`
  },
  {
    title: 'Follow-up Email',
    content: `Subject: Re: Quick question about [Business Name]

Hi [Name],

Just circling back — wanted to make sure my last email didn't get buried.

We've helped businesses like [Business Name] go from little to no online presence to 15-20+ new inbound calls per month. The demo takes 15 minutes and it's completely free.

Here's a link if you want to book directly: [BOOKING_LINK]

Either way, no pressure. Just wanted to make sure you had the option.

Best,
Brandon
Principe Consults`
  },
];

export default function Scripts() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '4px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: '10px 16px',
              background: tab === i ? 'var(--red-glow)' : 'transparent',
              color: tab === i ? 'var(--red)' : 'var(--text2)',
              border: 'none',
              borderBottom: tab === i ? '2px solid var(--red)' : '2px solid transparent',
              fontSize: '13px',
              fontWeight: tab === i ? 600 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Cold Call Scripts */}
      {tab === 0 && COLD_CALL_SCRIPTS.map((s, i) => <ScriptCard key={i} title={s.title} content={s.content} />)}

      {/* Tab 1: Objection Handlers */}
      {tab === 1 && (
        <div className="card" style={{ padding: '20px' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Objection</th>
                <th style={{ width: '55%' }}>Response</th>
                <th style={{ width: '25%' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {OBJECTION_HANDLERS.map((o, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--red)' }}>{o.objection}</td>
                  <td style={{ fontSize: '13px', lineHeight: '1.6' }}>{o.response}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text2)', fontStyle: 'italic' }}>{o.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Voicemail Scripts */}
      {tab === 2 && VM_SCRIPTS.map((s, i) => <ScriptCard key={i} title={s.title} content={s.content} />)}

      {/* Tab 3: Text Templates */}
      {tab === 3 && TEXT_TEMPLATES.map((s, i) => <ScriptCard key={i} title={s.title} content={s.content.replace('[BOOKING_LINK]', 'https://link.leadconnectorhq.com/widget/booking/pj3w686q7SL091ZY30NH')} />)}

      {/* Tab 4: Email Templates */}
      {tab === 4 && EMAIL_TEMPLATES.map((s, i) => <ScriptCard key={i} title={s.title} content={s.content.replace('[BOOKING_LINK]', 'https://link.leadconnectorhq.com/widget/booking/pj3w686q7SL091ZY30NH')} />)}
    </div>
  );
}
