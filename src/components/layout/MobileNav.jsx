import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Kanban, Phone, DollarSign,
  Zap, Sparkles, Banknote, FileText, BookOpen, UsersRound,
  Terminal, Settings, Menu, X, LogOut,
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { canAccess } from '../../utils/permissions';
import { Avatar, RoleBadge } from '../ui';

const PRIMARY_TABS = [
  { label: 'Home', icon: LayoutDashboard, path: '/', page: 'Dashboard' },
  { label: 'Leads', icon: Users, path: '/leads', page: 'Leads' },
  { label: 'Pipeline', icon: Kanban, path: '/pipeline', page: 'Pipeline' },
  { label: 'Calls', icon: Phone, path: '/calls', page: 'Call Tracker' },
];

const ALL_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', page: 'Dashboard' },
  { label: 'Leads', icon: Users, path: '/leads', page: 'Leads' },
  { label: 'Lead Generator', icon: Sparkles, path: '/lead-gen', page: 'Lead Generator' },
  { label: 'AI Outreach', icon: Zap, path: '/outreach', page: 'AI Outreach' },
  { label: 'Pipeline', icon: Kanban, path: '/pipeline', page: 'Pipeline' },
  { label: 'Call Tracker', icon: Phone, path: '/calls', page: 'Call Tracker' },
  { label: 'Revenue', icon: DollarSign, path: '/revenue', page: 'Revenue' },
  { label: 'Payouts', icon: Banknote, path: '/payouts', page: 'Payouts' },
  { label: 'My Scripts', icon: FileText, path: '/scripts', page: 'My Scripts' },
  { label: 'Playbook', icon: BookOpen, path: '/playbook', page: 'Playbook' },
  { label: 'Team', icon: UsersRound, path: '/team', page: 'Team' },
  { label: 'Activity Log', icon: Terminal, path: '/activity', page: 'Activity Log' },
  { label: 'Settings', icon: Settings, path: '/settings', page: 'Settings' },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const role = currentUser?.role;

  const handleNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Full menu overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)', zIndex: 90,
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar name={currentUser?.name} size={32} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{currentUser?.name}</div>
                <RoleBadge role={currentUser?.role} />
              </div>
            </div>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '8px' }}>
              <X size={24} />
            </button>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {ALL_NAV.filter(item => canAccess(role, item.page)).map(item => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    width: '100%', padding: '14px 16px',
                    background: isActive ? 'var(--red-glow)' : 'transparent',
                    color: isActive ? 'var(--red)' : 'var(--text)',
                    border: 'none', borderRadius: '10px', fontSize: '15px',
                    fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                    fontFamily: "'Manrope', sans-serif", marginBottom: '2px',
                  }}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '14px 16px',
                background: 'none', border: 'none', color: 'var(--red)',
                fontSize: '15px', cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
                borderRadius: '10px',
              }}
            >
              <LogOut size={20} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          height: '64px', zIndex: 80,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {PRIMARY_TABS.filter(t => canAccess(role, t.page)).map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                background: 'none', border: 'none',
                color: isActive ? 'var(--red)' : 'var(--muted)',
                cursor: 'pointer', padding: '6px 12px', minWidth: '56px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              <tab.icon size={20} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
            </button>
          );
        })}

        {/* More menu button */}
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            background: 'none', border: 'none',
            color: menuOpen ? 'var(--red)' : 'var(--muted)',
            cursor: 'pointer', padding: '6px 12px', minWidth: '56px',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          <Menu size={20} />
          <span style={{ fontSize: '10px', fontWeight: 400 }}>More</span>
        </button>
      </div>
    </>
  );
}
