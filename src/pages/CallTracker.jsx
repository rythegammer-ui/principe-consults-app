import { useState, useMemo, Fragment } from 'react';
import { Phone, Plus, Download } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { StatCard, OutcomeBadge, EmptyState } from '../components/ui';
import LogCallModal from '../components/calls/LogCallModal';
import CallHistory from '../components/calls/CallHistory';
import { formatPhone, relativeTime, formatDate } from '../utils/formatters';
import { canSeeAllLeads } from '../utils/permissions';
import { exportCallsCSV, downloadCSV } from '../utils/csv';
import { isToday, startOfWeek, isAfter, isBefore } from 'date-fns';

export default function CallTracker() {
  const currentUser = useAppStore(s => s.currentUser);
  const allLeads = useAppStore(s => s.leads);
  const callLogs = useAppStore(s => s.callLogs);
  const [showLogCall, setShowLogCall] = useState(false);
  const [expandedLead, setExpandedLead] = useState(null);

  // Reps only see their own leads' calls
  const leads = useMemo(() => {
    return canSeeAllLeads(currentUser?.role) ? allLeads : allLeads.filter(l => l.assignedTo === currentUser?.id);
  }, [allLeads, currentUser]);

  const myLeadIds = useMemo(() => new Set(leads.map(l => l.id)), [leads]);
  const myCallLogs = useMemo(() => {
    return canSeeAllLeads(currentUser?.role) ? callLogs : callLogs.filter(c => myLeadIds.has(c.leadId));
  }, [callLogs, myLeadIds, currentUser]);

  const stats = useMemo(() => {
    const today = myCallLogs.filter(c => c.timestamp && isToday(new Date(c.timestamp)));
    const weekStart = startOfWeek(new Date());
    const thisWeek = myCallLogs.filter(c => c.timestamp && isAfter(new Date(c.timestamp), weekStart));
    const noAnswers = myCallLogs.filter(c => c.outcome === 'No Answer');
    const callbacks = myCallLogs.filter(c => c.outcome === 'Callback Requested');
    const booked = myCallLogs.filter(c => c.outcome === 'Booked');
    return {
      today: today.length,
      thisWeek: thisWeek.length,
      noAnswers: noAnswers.length,
      callbacks: callbacks.length,
      booked: booked.length,
    };
  }, [myCallLogs]);

  // Group calls by lead
  const leadsWithCalls = useMemo(() => {
    const leadCallMap = {};
    myCallLogs.forEach(c => {
      if (!leadCallMap[c.leadId]) leadCallMap[c.leadId] = [];
      leadCallMap[c.leadId].push(c);
    });

    return leads.map(lead => {
      const calls = leadCallMap[lead.id] || [];
      const lastCall = calls.length > 0 ? calls[calls.length - 1] : null;
      return { lead, calls, lastCall, callCount: calls.length };
    }).filter(item => item.callCount > 0 || item.lead.followUpDate)
      .sort((a, b) => {
        if (a.lastCall && b.lastCall) return new Date(b.lastCall.timestamp) - new Date(a.lastCall.timestamp);
        return 0;
      });
  }, [leads, callLogs]);

  const handleExport = () => {
    const csv = exportCallsCSV(callLogs, leads);
    downloadCSV(csv, 'call-logs-export.csv');
  };

  const isPastDue = (date) => {
    if (!date) return false;
    return isBefore(new Date(date), new Date()) && !isToday(new Date(date));
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Calls Today" value={stats.today} color="var(--blue)" />
        <StatCard label="This Week" value={stats.thisWeek} color="var(--purple)" />
        <StatCard label="No Answers" value={stats.noAnswers} color="var(--muted)" />
        <StatCard label="Callbacks Pending" value={stats.callbacks} color="var(--yellow)" />
        <StatCard label="Demos Booked" value={stats.booked} color="var(--green)" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button className="btn-ghost" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Table */}
      {leadsWithCalls.length === 0 ? (
        <EmptyState icon={Phone} message="No calls logged yet. Start tracking your calls." action="Log a Call" onAction={() => setShowLogCall(true)} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Phone</th>
                <th>Last Called</th>
                <th>Calls</th>
                <th>Last Outcome</th>
                <th>Next Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leadsWithCalls.map(({ lead, lastCall, callCount }) => (
                <Fragment key={lead.id}>
                  <tr>
                    <td style={{ fontWeight: 600 }}>{lead.businessName}</td>
                    <td>
                      <a href={`tel:${lead.phone}`} style={{ color: 'var(--blue)', textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                        {formatPhone(lead.phone)}
                      </a>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{lastCall ? relativeTime(lastCall.timestamp) : '—'}</td>
                    <td>
                      <span style={{ background: 'var(--surface3)', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                        {callCount}
                      </span>
                    </td>
                    <td>{lastCall ? <OutcomeBadge outcome={lastCall.outcome} /> : '—'}</td>
                    <td>
                      {lead.followUpDate ? (
                        <span style={{ color: isPastDue(lead.followUpDate) ? 'var(--red)' : 'var(--text2)', fontSize: '13px', fontWeight: isPastDue(lead.followUpDate) ? 600 : 400 }}>
                          {formatDate(lead.followUpDate)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedLead === lead.id && (
                    <tr>
                      <td colSpan="7" style={{ background: 'var(--surface)', padding: '12px 16px' }}>
                        <CallHistory leadId={lead.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Log Call button */}
      <button
        className="btn-red"
        onClick={() => setShowLogCall(true)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '56px', height: '56px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, boxShadow: '0 4px 20px rgba(230,50,40,0.4)',
          zIndex: 40,
        }}
      >
        <Plus size={24} />
      </button>

      {showLogCall && <LogCallModal open={showLogCall} onClose={() => setShowLogCall(false)} />}
    </div>
  );
}
