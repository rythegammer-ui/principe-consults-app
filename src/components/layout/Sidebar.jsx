import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Zap, Kanban, Phone, DollarSign,
  FileText, BookOpen, UsersRound, Terminal, Settings,
  ChevronLeft, ChevronRight, LogOut, Banknote, Sparkles,
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { canAccess } from '../../utils/permissions';
import { Avatar, RoleBadge } from '../ui';

const NAV_ITEMS = [
  { section: 'MAIN', items: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', page: 'Dashboard' },
    { label: 'Leads', icon: Users, path: '/leads', page: 'Leads' },
    { label: 'Lead Generator', icon: Sparkles, path: '/lead-gen', page: 'Lead Generator' },
    { label: 'AI Outreach', icon: Zap, path: '/outreach', page: 'AI Outreach' },
    { label: 'Pipeline', icon: Kanban, path: '/pipeline', page: 'Pipeline' },
    { label: 'Call Tracker', icon: Phone, path: '/calls', page: 'Call Tracker' },
    { label: 'Revenue', icon: DollarSign, path: '/revenue', page: 'Revenue' },
    { label: 'Payouts', icon: Banknote, path: '/payouts', page: 'Payouts' },
  ]},
  { section: 'SALES TEAM', items: [
    { label: 'My Scripts', icon: FileText, path: '/scripts', page: 'My Scripts' },
    { label: 'Playbook', icon: BookOpen, path: '/playbook', page: 'Playbook' },
    { label: 'Team', icon: UsersRound, path: '/team', page: 'Team' },
  ]},
  { section: 'SYSTEM', items: [
    { label: 'Activity Log', icon: Terminal, path: '/activity', page: 'Activity Log' },
    { label: 'Settings', icon: Settings, path: '/settings', page: 'Settings' },
  ]},
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore(s => s.currentUser);
  const collapsed = useAppStore(s => s.sidebarCollapsed);
  const toggle = useAppStore(s => s.toggleSidebar);
  const logout = useAppStore(s => s.logout);
  const role = currentUser?.role;

  return (
    <div
      style={{
        width: collapsed ? 60 : 240,
        height: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: collapsed ? '20px 12px' : '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 32, height: 32, background: 'var(--red)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '14px', color: 'white', flexShrink: 0,
        }}>
          PC
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: "'Syne', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Principe Consults
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Operations Console
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {NAV_ITEMS.map(section => {
          const visibleItems = section.items.filter(item => canAccess(role, item.page));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.section} style={{ marginBottom: '16px' }}>
              {!collapsed && (
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 12px 4px' }}>
                  {section.section}
                </div>
              )}
              {visibleItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: collapsed ? '10px 0' : '10px 12px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      background: isActive ? 'var(--red-glow)' : 'transparent',
                      color: isActive ? 'var(--red)' : 'var(--text2)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; } }}
                  >
                    <item.icon size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && item.label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px' }}>
        {/* Collapse toggle */}
        <button
          onClick={toggle}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none',
            color: 'var(--text2)', cursor: 'pointer', borderRadius: '6px', fontSize: '13px',
            fontFamily: "'Manrope', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Collapse</>}
        </button>

        {/* User info */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', marginTop: '4px' }}>
            <Avatar name={currentUser.name} size={28} />
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </div>
                <RoleBadge role={currentUser.role} />
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => { logout(); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none',
            color: 'var(--muted)', cursor: 'pointer', borderRadius: '6px', fontSize: '13px',
            fontFamily: "'Manrope', sans-serif", marginTop: '4px',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
        >
          <LogOut size={16} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );
}
