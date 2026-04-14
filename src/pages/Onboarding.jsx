import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Building2, MapPin, Phone, Calendar, Rocket,
  ExternalLink, Check, DollarSign, Target, PhoneCall, BarChart3,
  Zap, BookOpen, MessageSquare, Users, TrendingUp, Clock,
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { ONBOARDING_BOOKING_LINK } from '../config/firebase.config';

// ── Admin Onboarding Steps ──────────────────────────────────
function AdminOnboarding() {
  const navigate = useNavigate();
  const settings = useAppStore(s => s.settings);
  const currentUser = useAppStore(s => s.currentUser);
  const completeOnboarding = useAppStore(s => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [agencyName, setAgencyName] = useState(settings.agencyName || '');
  const [city, setCity] = useState(settings.defaultCity || '');
  const [agencyPhone, setAgencyPhone] = useState(settings.agencyPhone || '');
  const [bookingLink, setBookingLink] = useState(settings.bookingLink || '');
  const [loading, setLoading] = useState(false);
  const [callBooked, setCallBooked] = useState(false);

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'var(--text2)', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const handleFinish = async () => {
    setLoading(true);
    await completeOnboarding({ agencyName, defaultCity: city, agencyPhone, bookingLink });
    setLoading(false);
    navigate('/');
  };

  const steps = [
    // Step 1: Agency Setup
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Building2 size={20} style={{ color: 'var(--red)' }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700 }}>Your Agency Info</h2>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Agency / Company Name</label>
        <input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Your Agency Name" autoFocus />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div>
          <label style={labelStyle}><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />City / Region</label>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Dallas, TX" />
        </div>
        <div>
          <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />Phone</label>
          <input value={agencyPhone} onChange={e => setAgencyPhone(e.target.value)} placeholder="(972) 555-0100" />
        </div>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Your Booking Link (optional)</label>
        <input value={bookingLink} onChange={e => setBookingLink(e.target.value)} placeholder="https://calendly.com/you" />
      </div>
      <button className="btn-red" onClick={() => setStep(1)} style={{ width: '100%', padding: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        Continue <ArrowRight size={16} />
      </button>
    </div>,

    // Step 2: Book Onboarding Call
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Calendar size={20} style={{ color: 'var(--red)' }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700 }}>Book Your Onboarding Call</h2>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
        Schedule a quick call with the Principe Consults team to get your integrations set up.
      </p>
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
        <Calendar size={40} style={{ color: 'var(--red)', marginBottom: '12px' }} />
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>15-Minute Setup Call</div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>Free — no commitment required</div>
        <a href={ONBOARDING_BOOKING_LINK} target="_blank" rel="noopener noreferrer" className="btn-red"
          onClick={() => setCallBooked(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '15px', textDecoration: 'none' }}>
          Book Your Call <ExternalLink size={16} />
        </a>
      </div>
      {callBooked && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: 'var(--green)', marginBottom: '16px', textAlign: 'center' }}>
          Call booked! You're all set.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn-ghost" onClick={() => setStep(0)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowLeft size={14} /> Back</button>
        <button className={callBooked ? 'btn-red' : 'btn-ghost'} onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {callBooked ? 'Continue' : 'Skip for now'} <ArrowRight size={14} />
        </button>
      </div>
    </div>,

    // Step 3: Ready
    <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, background: 'var(--red-glow)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <Rocket size={32} style={{ color: 'var(--red)' }} />
      </div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>You're Ready!</h2>
      <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', maxWidth: '380px', margin: '0 auto 24px' }}>
        Your agency console is set up. Go to Settings to find your invite code and share it with your reps.
      </p>
      <button className="btn-red" onClick={handleFinish} disabled={loading}
        style={{ padding: '14px 48px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        {loading ? 'Setting up...' : <>Launch Dashboard <ArrowRight size={18} /></>}
      </button>
      <button onClick={() => setStep(1)} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' }}>Back</button>
    </div>,
  ];

  return (
    <>
      {/* Step Indicator */}
      <StepIndicator total={3} current={step} labels={['Agency Setup', 'Book Call', 'Launch']} />
      <div style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.3s ease-out' }}>
        {steps[step]}
      </div>
    </>
  );
}

// ── Rep Onboarding Steps ────────────────────────────────────
function RepOnboarding() {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore(s => s.completeOnboarding);
  const settings = useAppStore(s => s.settings);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [callBooked, setCallBooked] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    await completeOnboarding({});
    setLoading(false);
    navigate('/');
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const navButtons = (hideBack) => (
    <div style={{ display: 'flex', justifyContent: hideBack ? 'flex-end' : 'space-between', marginTop: '24px' }}>
      {!hideBack && (
        <button className="btn-ghost" onClick={back} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <button className="btn-red" onClick={next} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );

  const steps = [
    // ── Step 1: Welcome ──
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: 56, height: 56, background: 'var(--red)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', color: 'white', marginBottom: '16px' }}>
          PC
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
          Welcome to {settings.agencyName || 'Principe Consults'}
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6' }}>
          Let's walk you through everything you need to start closing deals.
        </p>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text2)' }}>
          We are a <strong style={{ color: 'var(--text)' }}>web design and digital growth agency</strong> in DFW.
          We build websites, run Google Ads, and set up CRM systems for local service businesses.
        </p>
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text2)', marginTop: '12px' }}>
          <strong style={{ color: 'var(--text)' }}>Your job:</strong> Find businesses that need help, get them on a demo call, and help close the deal. This console gives you everything you need.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { icon: Target, label: 'Find Leads', color: 'var(--blue)' },
          { icon: PhoneCall, label: 'Book Demos', color: 'var(--purple)' },
          { icon: DollarSign, label: 'Get Paid', color: 'var(--green)' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--surface2)', borderRadius: '8px' }}>
            <Icon size={24} style={{ color, marginBottom: '6px' }} />
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)' }}>{label}</div>
          </div>
        ))}
      </div>

      {navButtons(true)}
    </div>,

    // ── Step 2: What We Sell ──
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <DollarSign size={20} style={{ color: 'var(--green)' }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700 }}>What You'll Be Selling</h2>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
        Three packages — each one solves a different problem for local businesses.
      </p>

      {[
        { name: 'Launchpad', price: '$997', color: 'var(--blue)', who: 'No website, under 4.0 Google rating, just getting started online',
          features: ['5-page website', 'Google Business Profile', 'SEO setup', 'Contact form', '30-day support'] },
        { name: 'Growth Engine', price: '$2,500', monthly: '+$500/mo', color: 'var(--purple)', who: 'Has a bad site, zero ads, wants the phone to ring',
          features: ['Everything in Launchpad', 'Landing page', 'Google Ads', 'Call tracking', 'Monthly reports'] },
        { name: 'Full Stack', price: '$5,000', monthly: '+$1,000/mo', color: 'var(--red)', who: 'Multi-location, has a team, needs a full system',
          features: ['Everything in Growth Engine', 'GoHighLevel CRM', 'SMS/email automation', 'Reputation mgmt', 'Bi-weekly strategy calls'] },
      ].map(pkg => (
        <div key={pkg.name} style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '16px', marginBottom: '10px', borderLeft: `3px solid ${pkg.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>{pkg.name}</span>
            <span>
              <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--green)' }}>{pkg.price}</span>
              {pkg.monthly && <span style={{ fontSize: '12px', color: 'var(--text2)' }}> {pkg.monthly}</span>}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {pkg.features.map(f => (
              <span key={f} style={{ fontSize: '11px', background: 'var(--surface3)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text2)' }}>{f}</span>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--text2)' }}>Who to pitch:</strong> {pkg.who}
          </div>
        </div>
      ))}

      {navButtons()}
    </div>,

    // ── Step 3: Your Tools ──
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Zap size={20} style={{ color: 'var(--red)' }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700 }}>Your Sales Console</h2>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
        Here's what you have access to. Each tool is designed to help you close more deals.
      </p>

      <div style={{ display: 'grid', gap: '10px' }}>
        {[
          { icon: Users, name: 'Leads', desc: 'Your lead database. Add, track, and manage every prospect.', color: 'var(--blue)' },
          { icon: BarChart3, name: 'Pipeline', desc: 'Drag-and-drop Kanban board. Move leads through stages visually.', color: 'var(--purple)' },
          { icon: PhoneCall, name: 'Call Tracker', desc: 'Log every call with outcomes and notes. Never lose track of a conversation.', color: 'var(--yellow)' },
          { icon: Zap, name: 'AI Lead Gen', desc: 'AI generates local business leads for you. Review and import with one click.', color: 'var(--red)' },
          { icon: MessageSquare, name: 'AI Outreach', desc: 'AI writes personalized SMS sequences. Launch campaigns to multiple leads at once.', color: 'var(--orange)' },
          { icon: BookOpen, name: 'Scripts & Playbook', desc: 'Cold call scripts, objection handlers, email templates — everything you need.', color: 'var(--green)' },
        ].map(tool => (
          <div key={tool.name} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${tool.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <tool.icon size={18} style={{ color: tool.color }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{tool.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.4' }}>{tool.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {navButtons()}
    </div>,

    // ── Step 4: Daily Workflow ──
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Clock size={20} style={{ color: 'var(--blue)' }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700 }}>Your Daily Workflow</h2>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
        Follow this routine every day and you'll consistently close deals.
      </p>

      {[
        { time: '9:00 AM', task: 'Check your dashboard', detail: 'Review follow-ups, new assignments, and your pipeline.' },
        { time: '9:30 AM', task: 'Work your hot leads first', detail: 'Callbacks, replied leads, and scheduled follow-ups get priority.' },
        { time: '10:00 AM', task: 'Start dialing', detail: 'Aim for 30-50 calls per day. Log every single call with notes.' },
        { time: '12:00 PM', task: 'Send follow-up texts', detail: 'After voicemails or no-answers, send a text using the scripts.' },
        { time: '1:00 PM', task: 'Book demos', detail: 'Qualified leads get the booking link. Confirm with a text.' },
        { time: '3:00 PM', task: 'AI outreach', detail: 'Launch AI SMS sequences to new leads. Let the AI warm them up.' },
        { time: '4:30 PM', task: 'Update your pipeline', detail: 'Move leads through stages. Add notes on every interaction.' },
        { time: '5:00 PM', task: 'Plan tomorrow', detail: 'Set follow-ups. Review what worked. End clean.' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--muted)', width: '65px', flexShrink: 0, paddingTop: '2px' }}>
            {item.time}
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)', marginTop: '6px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.task}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{item.detail}</div>
          </div>
        </div>
      ))}

      {navButtons()}
    </div>,

    // ── Step 5: Compensation ──
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <TrendingUp size={20} style={{ color: 'var(--green)' }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700 }}>How You Get Paid</h2>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
        You earn commission on every demo and every close. Retainer clients pay you every month they stay.
      </p>

      <div style={{ background: 'var(--surface2)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', fontSize: '12px' }}>Action</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', textAlign: 'right' }}>You Earn</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Demo booked & shown', `$${settings.commissionDemo || 50}`],
              ['Launchpad close ($997)', `$${settings.commissionLaunchpad || 150}`],
              ['Growth Engine close ($2,500)', `$${settings.commissionGrowth || 300}`],
              ['Full Stack close ($5,000)', `$${settings.commissionFullStack || 500}`],
              ['Monthly retainer', `${settings.commissionRetainerPct || 15}% recurring`],
            ].map(([action, pay]) => (
              <tr key={action}>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>{action}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>{pay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: '8px', padding: '16px', borderLeft: '3px solid var(--green)' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: 'var(--green)' }}>Example Month</div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6' }}>
          10 demos ($50 each) + 2 Growth Engine closes ($300 each) + 1 Full Stack ($500) = <strong style={{ color: 'var(--green)' }}>$1,600 in one month</strong> — plus recurring retainer income every month after.
        </div>
      </div>

      {navButtons()}
    </div>,

    // ── Step 6: Quick Tips + Book Call ──
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Check size={20} style={{ color: 'var(--green)' }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700 }}>Quick Tips Before You Start</h2>
      </div>

      <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
        {[
          { do: true, text: 'Be direct and confident on calls — sound like a real person, not a script reader' },
          { do: true, text: 'Always redirect the conversation to booking a demo' },
          { do: true, text: 'Log every call and interaction — if it\'s not logged, it didn\'t happen' },
          { do: true, text: 'Follow up at least 3 times before marking a lead dead' },
          { do: false, text: 'Never mention price on a cold call — get them to the demo first' },
          { do: false, text: 'Never bash competitors — focus on what we do, not what they don\'t' },
          { do: false, text: 'Never make promises we can\'t keep — be honest about timelines' },
        ].map((tip, i) => (
          <div key={i} style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px',
            background: tip.do ? 'rgba(34,197,94,0.06)' : 'rgba(230,50,40,0.06)',
            borderRadius: '8px', borderLeft: `3px solid ${tip.do ? 'var(--green)' : 'var(--red)'}`,
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: tip.do ? 'var(--green)' : 'var(--red)', flexShrink: 0, marginTop: '1px' }}>
              {tip.do ? 'DO' : "DON'T"}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{tip.text}</span>
          </div>
        ))}
      </div>

      {/* Book onboarding call */}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
        <Calendar size={28} style={{ color: 'var(--red)', marginBottom: '8px' }} />
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Book Your Training Call</div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '16px' }}>
          15 minutes — we'll walk you through the console live and answer any questions
        </div>
        <a href={ONBOARDING_BOOKING_LINK} target="_blank" rel="noopener noreferrer" className="btn-red"
          onClick={() => setCallBooked(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', textDecoration: 'none' }}>
          Book Call <ExternalLink size={14} />
        </a>
      </div>

      {callBooked && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: 'var(--green)', marginBottom: '16px', textAlign: 'center' }}>
          Training call booked!
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn-ghost" onClick={back} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <button className="btn-red" onClick={next} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {callBooked ? "Let's Go" : 'Skip & Start Selling'} <ArrowRight size={16} />
        </button>
      </div>
    </div>,

    // ── Step 7: Launch ──
    <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, background: 'var(--red-glow)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <Rocket size={32} style={{ color: 'var(--red)' }} />
      </div>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
        You're Ready to Sell!
      </h2>
      <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 24px' }}>
        Your console is loaded with AI lead generation, outreach tools, scripts, and everything you need. Go make it happen.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left', marginBottom: '28px', background: 'var(--surface2)', borderRadius: '10px', padding: '20px' }}>
        {[
          'Check your Dashboard daily',
          'Use AI Lead Gen to find prospects',
          'Log every call you make',
          'Read the Scripts & Playbook',
          'Book demos — that\'s where deals close',
          'Request payouts when you earn them',
        ].map(tip => (
          <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)' }}>
            <Check size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
            {tip}
          </div>
        ))}
      </div>

      <button className="btn-red" onClick={handleFinish} disabled={loading}
        style={{ padding: '14px 48px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        {loading ? 'Setting up...' : <>Launch My Dashboard <ArrowRight size={18} /></>}
      </button>
      <button onClick={back} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' }}>Back</button>
    </div>,
  ];

  const stepLabels = ['Welcome', 'Packages', 'Your Tools', 'Daily Flow', 'Pay', 'Tips', 'Start'];

  return (
    <>
      <StepIndicator total={steps.length} current={step} labels={stepLabels} />
      <div style={{ width: '100%', maxWidth: '560px', animation: 'fadeIn 0.3s ease-out' }}>
        {steps[step]}
      </div>
    </>
  );
}

// ── Shared Step Indicator ───────────────────────────────────
function StepIndicator({ total, current, labels }) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i <= current ? 'var(--red)' : 'var(--surface2)',
            border: `2px solid ${i <= current ? 'var(--red)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: i <= current ? 'white' : 'var(--muted)',
            transition: 'all 0.3s',
          }}>
            {i < current ? <Check size={12} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div style={{ width: '16px', height: '2px', background: i < current ? 'var(--red)' : 'var(--border)', transition: 'all 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Onboarding Page ────────────────────────────────────
export default function Onboarding() {
  const currentUser = useAppStore(s => s.currentUser);
  const isRep = currentUser?.role === 'rep';

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: 48, height: 48, background: 'var(--red)', borderRadius: '10px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', color: 'white',
          marginBottom: '12px',
        }}>
          PC
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '22px', marginBottom: '4px' }}>
          Welcome, {currentUser?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
          {isRep ? "Let's get you ready to start selling" : "Let's get you set up"}
        </p>
      </div>

      {isRep ? <RepOnboarding /> : <AdminOnboarding />}
    </div>
  );
}
