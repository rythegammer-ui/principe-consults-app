import { useState, useEffect, useRef } from 'react';

const SECTIONS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'what-we-sell', title: 'What We Sell' },
  { id: 'daily-workflow', title: 'Your Daily Workflow' },
  { id: 'qualify', title: 'How to Qualify a Lead' },
  { id: 'book-demo', title: 'How to Book a Demo' },
  { id: 'compensation', title: 'Compensation' },
  { id: 'brand-rules', title: 'Brand Rules' },
  { id: 'dos-donts', title: "Do's and Don'ts" },
  { id: 'ghl', title: 'GHL Setup Notes' },
];

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: '40px', scrollMarginTop: '20px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--red)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        {title}
      </h2>
      <div style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--text)' }}>
        {children}
      </div>
    </section>
  );
}

function Tier({ name, price, monthly, features, pitch }) {
  return (
    <div className="card" style={{ padding: '20px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--red)' }}>{name}</h4>
        <div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green)' }}>{price}</span>
          {monthly && <span style={{ fontSize: '13px', color: 'var(--text2)' }}> + {monthly}/mo</span>}
        </div>
      </div>
      <ul style={{ paddingLeft: '20px', marginBottom: '12px', color: 'var(--text2)' }}>
        {features.map((f, i) => <li key={i} style={{ marginBottom: '4px' }}>{f}</li>)}
      </ul>
      <div style={{ background: 'var(--surface2)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
        <strong style={{ color: 'var(--text)' }}>Who to pitch:</strong>{' '}
        <span style={{ color: 'var(--text2)' }}>{pitch}</span>
      </div>
    </div>
  );
}

export default function Playbook() {
  const [activeSection, setActiveSection] = useState('welcome');

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
      {/* TOC */}
      <div style={{ position: 'sticky', top: '0', alignSelf: 'start' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Contents
        </h4>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
              background: activeSection === s.id ? 'var(--red-glow)' : 'transparent',
              color: activeSection === s.id ? 'var(--red)' : 'var(--text2)',
              border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
              fontWeight: activeSection === s.id ? 600 : 400, marginBottom: '2px',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        <Section id="welcome" title="Welcome">
          <p>Welcome to Principe Consults. This playbook is everything you need to represent the brand, work your leads, and get paid.</p>
          <p style={{ marginTop: '12px', color: 'var(--text2)' }}>
            We are a web design and digital growth agency in DFW, run by Ryan Principe. We build websites, run Google Ads, and set up CRM systems for local service businesses. Our job is to get our clients more phone calls, more walk-ins, and more revenue.
          </p>
          <p style={{ marginTop: '12px', color: 'var(--text2)' }}>
            You are the front line. Your job is to find businesses that need help, get them on a 15-minute demo with Ryan, and help close the deal. Read this playbook front to back.
          </p>
        </Section>

        <Section id="what-we-sell" title="What We Sell">
          <Tier
            name="Launchpad"
            price="$997"
            features={[
              'Custom 5-page website, mobile optimized',
              'Google Business Profile setup & optimization',
              'Basic SEO setup',
              'Contact form + click-to-call button',
              '30-day post-launch support',
            ]}
            pitch="No website, under 4.0 Google rating, trades/service businesses just getting started online."
          />
          <Tier
            name="Growth Engine"
            price="$2,500"
            monthly="$500"
            features={[
              'Everything in Launchpad',
              'Custom sales/landing page',
              'Google Ads setup + ongoing management',
              'Call tracking with recorded lines',
              'Monthly performance report',
            ]}
            pitch="Has a bad site or no site, zero ads running, wants the phone to ring more."
          />
          <Tier
            name="Full Stack"
            price="$5,000"
            monthly="$1,000"
            features={[
              'Everything in Growth Engine',
              'GoHighLevel CRM setup',
              'Automated SMS & email follow-up sequences',
              'Reputation management (review requests)',
              'Short-form video strategy + 4 scripts/month',
              'Bi-weekly strategy calls with Ryan',
            ]}
            pitch="Multi-location, has a team, already spending on ads but has no system to capture and follow up with leads."
          />
        </Section>

        <Section id="daily-workflow" title="Your Daily Workflow">
          <ol style={{ paddingLeft: '20px', color: 'var(--text2)' }}>
            <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text)' }}>Log into the Console.</strong> Check your dashboard for today's follow-ups and new assignments.</li>
            <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text)' }}>Review your lead list.</strong> Sort by follow-up date. Prioritize callbacks and hot leads first.</li>
            <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text)' }}>Make your calls.</strong> Aim for 30-50 dials per day. Log every call with outcome and notes.</li>
            <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text)' }}>Send follow-up texts.</strong> After VMs or no-answers, use the text templates in My Scripts.</li>
            <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text)' }}>Book demos.</strong> Use the booking link. Confirm day-before with a text.</li>
            <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text)' }}>Update your pipeline.</strong> Move leads through stages. Add notes on every interaction.</li>
            <li style={{ marginBottom: '12px' }}><strong style={{ color: 'var(--text)' }}>End-of-day review.</strong> Log any remaining activity. Set follow-ups for tomorrow.</li>
          </ol>
        </Section>

        <Section id="qualify" title="How to Qualify a Lead">
          <p style={{ marginBottom: '12px' }}>Before booking a demo, verify these four things:</p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {[
              { q: 'Decision Maker?', desc: 'Are you speaking to the owner or someone who can make a buying decision?' },
              { q: 'Open to Investing?', desc: 'Are they open to spending money on their web presence / marketing?' },
              { q: 'Available for a Call?', desc: 'Can they commit to a 15-minute call within the next 7 days?' },
              { q: 'Local DFW Business?', desc: 'Are they a local service business in the DFW metro area?' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--red)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div>
                  <strong>{item.q}</strong>
                  <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '12px', color: 'var(--yellow)' }}>If "no" to any of these → tag as "Nurture" and set a 30-day follow-up.</p>
        </Section>

        <Section id="book-demo" title="How to Book a Demo">
          <ol style={{ paddingLeft: '20px', color: 'var(--text2)' }}>
            <li style={{ marginBottom: '8px' }}>Confirm the lead is qualified (see checklist above).</li>
            <li style={{ marginBottom: '8px' }}>Offer two time slots: "Would Tuesday or Thursday work better?"</li>
            <li style={{ marginBottom: '8px' }}>Send the booking link via text and/or email.</li>
            <li style={{ marginBottom: '8px' }}>Confirm the booking in the Console — move lead to "Demo Scheduled."</li>
            <li style={{ marginBottom: '8px' }}>Send a day-before reminder text.</li>
            <li style={{ marginBottom: '8px' }}>After the demo, update the lead status based on outcome.</li>
          </ol>
          <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '14px', marginTop: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Booking Link:</p>
            <a
              href="https://link.leadconnectorhq.com/widget/booking/pj3w686q7SL091ZY30NH"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--blue)', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}
            >
              https://link.leadconnectorhq.com/widget/booking/pj3w686q7SL091ZY30NH
            </a>
          </div>
        </Section>

        <Section id="compensation" title="Compensation">
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Action</th><th>Payout</th></tr>
              </thead>
              <tbody>
                <tr><td>Demo booked & shown</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>$50 flat</td></tr>
                <tr><td>Launchpad close ($997)</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>$150</td></tr>
                <tr><td>Growth Engine close ($2,500)</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>$300</td></tr>
                <tr><td>Full Stack close ($5,000)</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>$500</td></tr>
                <tr><td>Growth retainer ($500/mo)</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>$75/mo recurring</td></tr>
                <tr><td>Full Stack retainer ($1,000/mo)</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>$150/mo recurring</td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: '12px', color: 'var(--text2)', fontSize: '13px' }}>
            Commission is paid on the 1st and 15th. Retainer commissions are paid as long as the client stays active.
          </p>
        </Section>

        <Section id="brand-rules" title="Brand Rules">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h4 style={{ color: 'var(--green)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>DO</h4>
              <ul style={{ paddingLeft: '16px', color: 'var(--text2)', fontSize: '13px' }}>
                <li>Be direct and confident</li>
                <li>Sound like a real person, not a script reader</li>
                <li>Always redirect to the demo</li>
                <li>Respect people's time</li>
                <li>Log every interaction</li>
                <li>Use "we" not "I" when talking about the agency</li>
                <li>Follow up consistently</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'var(--red)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>DON'T</h4>
              <ul style={{ paddingLeft: '16px', color: 'var(--text2)', fontSize: '13px' }}>
                <li>Never mention price on a cold call</li>
                <li>Never bash competitors</li>
                <li>Never make promises we can't keep</li>
                <li>Never use buzzwords: leverage, synergy, game-changer</li>
                <li>Never be pushy — confident, not aggressive</li>
                <li>Never skip logging a call</li>
                <li>Never share internal pricing with unauthorized people</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section id="dos-donts" title="Do's and Don'ts">
          <div style={{ display: 'grid', gap: '8px' }}>
            {[
              { do: 'Do research the business before calling — check their Google listing, website, reviews.', dont: "Don't cold call without knowing anything about the business." },
              { do: 'Do listen more than you talk on calls.', dont: "Don't read scripts word-for-word — use them as guides." },
              { do: 'Do set a follow-up date on every lead that isn\'t dead.', dont: "Don't let leads go cold without at least 3 touch points." },
              { do: 'Do update the pipeline in real time.', dont: "Don't batch your updates at end of day — things get lost." },
              { do: 'Do celebrate wins with the team.', dont: "Don't trash talk other reps or compete in unhealthy ways." },
            ].map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: '8px', padding: '12px', fontSize: '13px', borderLeft: '3px solid var(--green)' }}>
                  {item.do}
                </div>
                <div style={{ background: 'rgba(230,50,40,0.08)', borderRadius: '8px', padding: '12px', fontSize: '13px', borderLeft: '3px solid var(--red)' }}>
                  {item.dont}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="ghl" title="GHL Setup Notes">
          <ul style={{ paddingLeft: '20px', color: 'var(--text2)', fontSize: '14px' }}>
            <li style={{ marginBottom: '8px' }}>Pipeline stages in GoHighLevel mirror the Console stages: New → Contacted → Replied → Demo Scheduled → Demo Completed → Proposal Sent → Closed Won → Dead.</li>
            <li style={{ marginBottom: '8px' }}>Call recordings are auto-stored in GHL for each contact. Review your recordings weekly.</li>
            <li style={{ marginBottom: '8px' }}>Text sequences auto-fire when a lead enters the "Contacted" stage. Make sure the lead's phone number is correct before moving them.</li>
            <li style={{ marginBottom: '8px' }}>All demo bookings sync to Ryan's calendar automatically. No manual entry needed.</li>
            <li style={{ marginBottom: '8px' }}>If a lead responds to an automated text, the automation pauses and you take over manually.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
