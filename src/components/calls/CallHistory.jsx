import { useMemo } from 'react';
import { OutcomeBadge } from '../ui';
import useAppStore from '../../store/useAppStore';
import { formatDate, relativeTime } from '../../utils/formatters';

export default function CallHistory({ leadId }) {
  const allCallLogs = useAppStore(s => s.callLogs);
  const calls = useMemo(() => allCallLogs.filter(c => c.leadId === leadId), [allCallLogs, leadId]);
  const users = useAppStore(s => s.users);

  if (calls.length === 0) return null;

  return (
    <div style={{ padding: '8px 0' }}>
      {calls.slice().reverse().map(call => {
        const rep = users.find(u => u.name === call.calledBy);
        return (
          <div key={call.id} style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatDate(call.timestamp)} {call.time}
              </span>
              <OutcomeBadge outcome={call.outcome} />
              {call.duration && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{call.duration} min</span>}
              <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{call.calledBy}</span>
            </div>
            {call.notes && <p style={{ fontSize: '13px', color: 'var(--text2)' }}>{call.notes}</p>}
            {call.followUpNote && (
              <p style={{ fontSize: '12px', color: 'var(--yellow)', marginTop: '4px' }}>
                Follow-up: {call.followUpNote}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
