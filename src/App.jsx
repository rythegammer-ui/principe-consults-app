import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './store/useAppStore';
import { canAccess } from './utils/permissions';
import { isFirebaseConfigured } from './utils/firebase';
import { ToastContainer } from './components/ui';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import AIOutreach from './pages/AIOutreach';
import Pipeline from './pages/Pipeline';
import CallTracker from './pages/CallTracker';
import Revenue from './pages/Revenue';
import Scripts from './pages/Scripts';
import Playbook from './pages/Playbook';
import Team from './pages/Team';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';
import Payouts from './pages/Payouts';
import LeadGenerator from './pages/LeadGenerator';

function ProtectedRoute({ children, page }) {
  const currentUser = useAppStore(s => s.currentUser);
  const onboardingComplete = useAppStore(s => s.onboardingComplete);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  if (page && !canAccess(currentUser.role, page)) return <Navigate to="/" replace />;
  return children;
}

function AuthRedirect({ children }) {
  const currentUser = useAppStore(s => s.currentUser);
  const onboardingComplete = useAppStore(s => s.onboardingComplete);
  if (currentUser && !onboardingComplete) return <Navigate to="/onboarding" replace />;
  if (currentUser && onboardingComplete) return <Navigate to="/" replace />;
  return children;
}

function OnboardingGuard({ children }) {
  const currentUser = useAppStore(s => s.currentUser);
  const onboardingComplete = useAppStore(s => s.onboardingComplete);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (onboardingComplete) return <Navigate to="/" replace />;
  return children;
}

function FirebaseCheck() {
  if (!isFirebaseConfigured()) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '20px',
      }}>
        <div className="card" style={{ padding: '40px', maxWidth: '500px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, background: 'var(--red)', borderRadius: '12px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', color: 'white',
            marginBottom: '20px',
          }}>
            PC
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', marginBottom: '12px' }}>
            Firebase Setup Required
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            To launch the platform, you need to configure Firebase. Create a Firebase project and add your config to:
          </p>
          <code style={{
            display: 'block',
            background: 'var(--surface2)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--red)',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: '20px',
          }}>
            src/config/firebase.config.js
          </code>
          <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: '1.5' }}>
            Or set environment variables:<br />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--muted)' }}>
              VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_DATABASE_URL
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, background: 'var(--red)', borderRadius: '10px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', color: 'white',
          marginBottom: '16px', animation: 'pulse 1.5s infinite',
        }}>
          PC
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading...
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const authLoading = useAppStore(s => s.authLoading);
  const initAuth = useAppStore(s => s.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  // Show Firebase setup screen if not configured
  const firebaseCheckEl = FirebaseCheck();
  if (firebaseCheckEl) return firebaseCheckEl;

  // Show loading while auth initializes
  if (authLoading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
        <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
        <Route path="/onboarding" element={<OnboardingGuard><Onboarding /></OnboardingGuard>} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<ProtectedRoute page="Leads"><Leads /></ProtectedRoute>} />
          <Route path="/lead-gen" element={<ProtectedRoute page="Lead Generator"><LeadGenerator /></ProtectedRoute>} />
          <Route path="/outreach" element={<ProtectedRoute page="AI Outreach"><AIOutreach /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute page="Pipeline"><Pipeline /></ProtectedRoute>} />
          <Route path="/calls" element={<ProtectedRoute page="Call Tracker"><CallTracker /></ProtectedRoute>} />
          <Route path="/revenue" element={<ProtectedRoute page="Revenue"><Revenue /></ProtectedRoute>} />
          <Route path="/payouts" element={<ProtectedRoute page="Payouts"><Payouts /></ProtectedRoute>} />
          <Route path="/scripts" element={<ProtectedRoute page="My Scripts"><Scripts /></ProtectedRoute>} />
          <Route path="/playbook" element={<ProtectedRoute page="Playbook"><Playbook /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute page="Team"><Team /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute page="Activity Log"><ActivityLog /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute page="Settings"><Settings /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
