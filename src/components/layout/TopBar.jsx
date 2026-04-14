import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { Avatar } from '../ui';
import { useIsMobile } from '../../utils/hooks';

export default function TopBar({ title }) {
  const currentUser = useAppStore(s => s.currentUser);
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

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
        {/* Search - hide on very small screens */}
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
        <button style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', position: 'relative', padding: '4px' }}>
          <Bell size={isMobile ? 18 : 20} />
        </button>

        {/* User avatar */}
        {currentUser && <Avatar name={currentUser.name} size={isMobile ? 28 : 32} />}
      </div>
    </div>
  );
}
