import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Users, Phone, Kanban, DollarSign, UsersRound, Terminal, Zap } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { EmptyState } from '../components/ui';
import { formatDateTime } from '../utils/formatters';

const TYPE_CONFIG = {
  lead: { color: 'var(--blue)', icon: Users, label: 'Leads' },
  outreach: { color: 'var(--red)', icon: Zap, label: 'Outreach' },
  call: { color: 'var(--yellow)', icon: Phone, label: 'Calls' },
  pipeline: { color: 'var(--purple)', icon: Kanban, label: 'Pipeline' },
  payment: { color: 'var(--green)', icon: DollarSign, label: 'Payments' },
  team: { color: 'var(--orange)', icon: UsersRound, label: 'Team' },
  system: { color: 'var(--muted)', icon: Terminal, label: 'System' },
};

const FILTERS = ['All', 'Outreach', 'Calls', 'Pipeline', 'Payments', 'Team', 'System'];

export default function ActivityLog() {
  const activityLog = useAppStore(s => s.activityLog);
  const users = useAppStore(s => s.users);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog.length]);

  const filterMap = {
    Outreach: 'outreach',
    Calls: 'call',
    Pipeline: 'pipeline',
    Payments: 'payment',
    Team: 'team',
    System: 'system',
  };

  const filtered = useMemo(() => {
    let items = [...activityLog].reverse();
    if (filter !== 'All') {
      const type = filterMap[filter];
      if (type) items = items.filter(a => a.type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(a => a.description.toLowerCase().includes(q));
    }
    return items;
  }, [activityLog, filter, search]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activity..." style={{ paddingLeft: '36px', height: '38px' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={f === filter ? 'btn-red' : 'btn-ghost'}
              onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      {filtered.length === 0 ? (
        <EmptyState icon={Terminal} message="No activity entries found." />
      ) : (
        <div className="card" style={{ padding: '16px' }}>
          {filtered.map((entry) => {
            const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.system;
            const Icon = config.icon;
            const user = users.find(u => u.id === entry.userId);
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: config.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} style={{ color: config.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', marginBottom: '4px' }}>{entry.description}</p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatDateTime(entry.timestamp)}
                    </span>
                    {user && <span>{user.name}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
