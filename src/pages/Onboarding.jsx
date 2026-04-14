import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Building2, MapPin, Phone, Calendar, Rocket, ExternalLink } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { ONBOARDING_BOOKING_LINK } from '../config/firebase.config';

const STEPS = [
  { title: 'Set Up Your Agency', icon: Building2 },
  { title: 'Book Your Onboarding Call', icon: Calendar },
  { title: 'You\'re Ready', icon: Rocket },
];

export default function Onboarding() {
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
    await completeOnboarding({
      agencyName,
      defaultCity: city,
      agencyPhone,
      bookingLink,
    });
    setLoading(false);
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
          Let's get you set up in 2 minutes
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', alignItems: 'center' }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i <= step ? 'var(--red)' : 'var(--surface2)',
              border: `2px solid ${i <= step ? 'var(--red)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: i <= step ? 'white' : 'var(--muted)',
              transition: 'all 0.3s',
            }}>
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: '40px', height: '2px',
                background: i < step ? 'var(--red)' : 'var(--border)',
                transition: 'all 0.3s',
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.3s ease-out' }}>
        {/* Step 1: Agency Setup */}
        {step === 0 && (
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Building2 size={20} style={{ color: 'var(--red)' }} />
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                Your Agency Info
              </h2>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Agency / Company Name</label>
              <input
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                placeholder="Your Agency Name"
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  City / Region
                </label>
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Dallas, TX"
                />
              </div>
              <div>
                <label style={labelStyle}>
                  <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Phone
                </label>
                <input
                  value={agencyPhone}
                  onChange={e => setAgencyPhone(e.target.value)}
                  placeholder="(972) 555-0100"
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Your Booking Link (optional)</label>
              <input
                value={bookingLink}
                onChange={e => setBookingLink(e.target.value)}
                placeholder="https://calendly.com/you or GHL booking link"
              />
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                This is where your prospects book demos with you
              </p>
            </div>

            <button
              className="btn-red"
              onClick={() => setStep(1)}
              style={{ width: '100%', padding: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Book Onboarding Call */}
        {step === 1 && (
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Calendar size={20} style={{ color: 'var(--red)' }} />
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                Book Your Onboarding Call
              </h2>
            </div>

            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Schedule a quick call with the Principe Consults team. We'll walk you through the platform,
              set up your integrations, and make sure you're ready to start closing deals.
            </p>

            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              <Calendar size={40} style={{ color: 'var(--red)', marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                15-Minute Setup Call
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
                Free — no commitment required
              </div>
              <a
                href={ONBOARDING_BOOKING_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-red"
                onClick={() => setCallBooked(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 32px', fontSize: '15px', textDecoration: 'none',
                }}
              >
                Book Your Call <ExternalLink size={16} />
              </a>
            </div>

            {callBooked && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--green)',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                Call booked! You're all set.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button
                className="btn-ghost"
                onClick={() => setStep(0)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                className={callBooked ? 'btn-red' : 'btn-ghost'}
                onClick={() => setStep(2)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {callBooked ? 'Continue' : 'Skip for now'} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ready to Go */}
        {step === 2 && (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, background: 'var(--red-glow)', borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <Rocket size={32} style={{ color: 'var(--red)' }} />
            </div>

            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
              You're Ready to Sell!
            </h2>

            <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px' }}>
              Your console is set up with AI-powered lead generation,
              outreach tools, pipeline management, and everything you need
              to close deals.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              textAlign: 'left',
              marginBottom: '32px',
              background: 'var(--surface2)',
              borderRadius: '10px',
              padding: '20px',
            }}>
              {[
                'AI Lead Generation',
                'SMS Outreach Tools',
                'Sales Pipeline',
                'Call Tracker',
                'Revenue Dashboard',
                'Scripts & Playbook',
              ].map(feature => (
                <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                  {feature}
                </div>
              ))}
            </div>

            <button
              className="btn-red"
              onClick={handleFinish}
              disabled={loading}
              style={{ padding: '14px 48px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {loading ? 'Setting up...' : <>Launch Dashboard <ArrowRight size={18} /></>}
            </button>

            <button
              onClick={() => setStep(1)}
              style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
