import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Check, Users, Shield } from 'lucide-react';
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
  const joinAgency = useAppStore(s => s.joinAgency);
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // null = choose, 'rep' = join agency, 'admin' = create agency
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRepSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('Enter the invite code your admin gave you.');
      return;
    }
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
      await joinAgency(name, email, password, inviteCode);
      navigate('/');
    } catch (err) {
      if (err.code === 'invalid-invite') {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
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

  const handleAdminSignup = async (e) => {
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
          {mode === 'rep' ? 'Join Your Team' : mode === 'admin' ? 'Create Your Agency' : 'Principe Consults'}
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', maxWidth: '500px' }}>
          {mode === 'rep'
            ? 'Enter your invite code to join your agency and start selling.'
            : mode === 'admin'
            ? 'Set up your agency account and invite your team.'
            : 'AI-powered sales tools to close more deals.'}
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.4s ease-out' }}>

        {/* Mode Selection */}
        {mode === null && (
          <>
            {/* Package Overview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginBottom: '40px',
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

            {/* Two signup paths */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <button
                onClick={() => setMode('rep')}
                className="card"
                style={{
                  padding: '28px', cursor: 'pointer', textAlign: 'center',
                  border: '2px solid var(--border)', transition: 'all 0.2s',
                  background: 'var(--surface)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Users size={32} style={{ color: 'var(--red)', marginBottom: '12px' }} />
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: '6px' }}>
                  I Have an Invite Code
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                  Join your agency team and start selling
                </div>
              </button>

              <button
                onClick={() => { setMode('admin'); setStep(1); }}
                className="card"
                style={{
                  padding: '28px', cursor: 'pointer', textAlign: 'center',
                  border: '2px solid var(--border)', transition: 'all 0.2s',
                  background: 'var(--surface)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Shield size={32} style={{ color: 'var(--blue)', marginBottom: '12px' }} />
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: '6px' }}>
                  Create an Agency
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                  Set up your own agency and invite reps
                </div>
              </button>
            </div>

            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
            </p>
          </>
        )}

        {/* REP SIGNUP — Join with invite code */}
        {mode === 'rep' && (
          <div style={{ maxWidth: '440px', margin: '0 auto' }}>
            <form onSubmit={handleRepSignup} className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
                Join Your Team
              </h2>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Invite Code</label>
                <input
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Paste the code from your admin"
                  required
                  autoFocus
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}
                />
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  Get this from your agency admin
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Your Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  required
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
                {loading ? 'Joining team...' : <>Join Team <ArrowRight size={16} /></>}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setMode(null); setError(''); }}
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

        {/* ADMIN SIGNUP — Create agency */}
        {mode === 'admin' && (
          <div style={{ maxWidth: '440px', margin: '0 auto' }}>
            <form onSubmit={handleAdminSignup} className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
                Create Your Agency
              </h2>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Your Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ryan Principe"
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Agency Name</label>
                <input
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  placeholder="Principe Consults"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ryan@principeconsults.com"
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
                {loading ? 'Creating agency...' : <>Create Agency <ArrowRight size={16} /></>}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setMode(null); setError(''); }}
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
