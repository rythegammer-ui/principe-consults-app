import { useState, useRef, useEffect } from 'react';
import { Search, Bell, UserPlus, MessageSquare, Calendar, CheckCircle2, CreditCard, DollarSign, Zap, AlertTriangle, FileText, X } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { Avatar } from '../ui';
import { useIsMobile } from '../../utils/hooks';
import { markNotificationRead, markAllNotificationsRead, getNotificationType } from '../../lib/notifications';
import { relativeTime } from '../../utils/formatters';

const ICON_MAP = {
  UserPlus, MessageSquare, Calendar, CheckCircle2, CreditCard,
  DollarSign, Zap, AlertTriangle, FileText, Bell,
};

export default function TopBar({ title }) {
  const currentUser = useAppStore(s => s.currentUser);
  const appNotifications = useAppStore(s => s.appNotifications) || [];
  const [search, setSearch] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);
  const isMobile = useIsMobile();

  const unreadCount = appNotifications.filter(n => !n.read).length;

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPanel]);

  return (
    <div
      style={{
        height: isMobile ? '52px' : '60px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 24px',
        background: 'var(--surface)',
        flexShrink: 0,
      }}
    >
      <h2 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 700 }}>{title}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
        {!isMobile && (
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ paddingLeft: '36px', height: '36px', fontSize: '13px', background: 'var(--surface2)' }}
            />
          </div>
        )}

        {/* Notification bell */}
        <div style={{ position: 'relative' }} ref={panelRef}>
          <button
            onClick={() => setShowPanel(!showPanel)}
            style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', position: 'relative', padding: '4px' }}
          >
            <Bell size={isMobile ? 18 : 20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-4px',
                background: 'var(--red)', color: 'white',
                fontSize: '10px', fontWeight: 700,
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--surface)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showPanel && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: '8px',
              width: isMobile ? '300px' : '380px', maxHeight: '480px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              zIndex: 50, overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Notifications</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '11px', fontFamily: "'Manrope', sans-serif" }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: '2px' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
                {appNotifications.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    No notifications yet
                  </div>
                ) : (
                  appNotifications.slice(0, 30).map(n => {
                    const typeInfo = getNotificationType(n.type);
                    const IconComponent = ICON_MAP[typeInfo.icon] || Bell;
                    return (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        style={{
                          display: 'flex', gap: '10px', padding: '12px 16px',
                          borderBottom: '1px solid var(--border)',
                          background: n.read ? 'transparent' : 'rgba(230,50,40,0.04)',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '8px',
                          background: `${typeInfo.color}15`, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <IconComponent size={16} style={{ color: typeInfo.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: n.read ? 400 : 600, marginBottom: '2px' }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                            {relativeTime(n.createdAt)}
                          </div>
                        </div>
                        {!n.read && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: '4px' }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {currentUser && <Avatar name={currentUser.name} size={isMobile ? 28 : 32} />}
      </div>
    </div>
  );
}
