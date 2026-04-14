import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const PACKAGES = [
  {
    name: 'Launchpad',
    price: '$997',
    tagline: 'Get online & get found',
    features: ['5-page website', 'Google Business Profile', 'SEO setup', 'Contact form', '30-day support'],
  },
  {
    name: 'Growth Engine',
    price: '$2,500',
    monthly: '$500/mo',
    tagline: 'Drive leads with ads',
    features: ['Everything in Launchpad', 'Landing page', 'Google Ads setup', 'Call tracking', 'Monthly reports'],
  },
  {
    name: 'Full Stack',
    price: '$5,000',
    monthly: '$1,000/mo',
    tagline: 'Complete digital growth',
    features: ['Everything in Growth Engine', 'GoHighLevel CRM', 'SMS/email automation', 'Reputation management', 'Bi-weekly strategy calls'],
  },
];

export default function Signup() {
  const signup = useAppStore(s => s.signup);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, agencyName);
      navigate('/onboarding');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'var(--text2)', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          width: 56, height: 56, background: 'var(--red)', borderRadius: '12px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', color: 'white',
          marginBottom: '16px',
        }}>
          PC
        </div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '24px',
          marginBottom: '8px',
        }}>
          Start Selling with Principe Consults
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', maxWidth: '500px' }}>
          Get your own CRM, AI-powered outreach, and everything you need to close deals. Set up in 2 minutes.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.4s ease-out' }}>
        {step === 1 && (
          <>
            {/* Package Overview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}>
              {PACKAGES.map(pkg => (
                <div key={pkg.name} className="card" style={{
                  padding: '24px',
                  borderColor: pkg.name === 'Growth Engine' ? 'var(--red)' : 'var(--border)',
                  position: 'relative',
                }}>
                  {pkg.name === 'Growth Engine' && (
                    <div style={{
                      position: 'absolute', top: '-10px', right: '16px',
                      background: 'var(--red)', color: 'white',
                      padding: '3px 12px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                    {pkg.name}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: '2px' }}>
                    {pkg.price}
                  </div>
                  {pkg.monthly && (
                    <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                      + {pkg.monthly} retainer
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>{pkg.tagline}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pkg.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                        <Check size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <button
                className="btn-red"
                onClick={() => setStep(2)}
                style={{ padding: '14px 40px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                Create Your Account <ArrowRight size={18} />
              </button>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '16px' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <div style={{ maxWidth: '440px', margin: '0 auto' }}>
            <form onSubmit={handleSubmit} className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
                Create Your Account
              </h2>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Your Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Agency / Company Name (optional)</label>
                <input
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  placeholder="Smith Digital Marketing"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                />
              </div>

              {error && (
                <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-red"
                disabled={loading}
                style={{ width: '100%', padding: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? 'Creating account...' : <>Get Started <ArrowRight size={16} /></>}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '13px' }}
                >
                  Back
                </button>
                <Link to="/login" style={{ color: 'var(--text2)', fontSize: '13px', textDecoration: 'none' }}>
                  Already have an account?
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
