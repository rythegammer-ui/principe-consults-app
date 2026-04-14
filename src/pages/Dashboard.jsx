import { useMemo } from 'react';
import { Users, Zap, Calendar, CheckCircle2, DollarSign } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import useAppStore from '../store/useAppStore';
import { StatCard, StatusBadge, Avatar } from '../components/ui';
import { getGreeting, formatDate, formatCurrency, relativeTime, STATUS_COLORS, LEAD_STATUSES } from '../utils/formatters';
import { canAccess } from '../utils/permissions';
import { useIsMobile } from '../utils/hooks';
import { isToday } from 'date-fns';

const TYPE_COLORS = ['#e63228', '#60a5fa', '#a78bfa', '#22c55e', '#f59e0b', '#fb923c', '#2dd4bf', '#818cf8', '#f472b6', '#84cc16', '#94a3b8'];

export default function Dashboard() {
  const currentUser = useAppStore(s => s.currentUser);
  const leads = useAppStore(s => s.leads);
  const callLogs = useAppStore(s => s.callLogs);
  const payments = useAppStore(s => s.payments);
  const activityLog = useAppStore(s => s.activityLog);
  const users = useAppStore(s => s.users);
  const updateLead = useAppStore(s => s.updateLead);
  const addActivity = useAppStore(s => s.addActivity);

  const stats = useMemo(() => {
    const sequencesActive = leads.filter(l => l.outreachStage === 'Sequence Active').length;
    const demosBooked = leads.filter(l => l.status === 'Demo Scheduled').length;
    const closedWon = leads.filter(l => l.status === 'Closed Won').length;
    const paidPayments = payments.filter(p => p.status === 'paid');
    const closedRevenue = leads.filter(l => l.status === 'Closed Won').reduce((s, l) => s + (l.dealValue || 0), 0);
    const paymentRevenue = paidPayments.reduce((s, p) => s + p.amount, 0);
    return { totalLeads: leads.length, sequencesActive, demosBooked, closedWon, estRevenue: Math.max(closedRevenue, paymentRevenue) };
  }, [leads, payments]);

  const pipelineData = useMemo(() => {
    return LEAD_STATUSES.map(status => ({
      name: status,
      count: leads.filter(l => l.status === status).length,
      fill: STATUS_COLORS[status]?.text || 'var(--text2)',
    }));
  }, [leads]);

  const typeData = useMemo(() => {
    const counts = {};
    leads.forEach(l => { counts[l.type] = (counts[l.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: TYPE_COLORS[i % TYPE_COLORS.length],
    }));
  }, [leads]);

  const todayTasks = useMemo(() => {
    return leads.filter(l => l.followUpDate && isToday(new Date(l.followUpDate)));
  }, [leads]);

  const recentActivity = useMemo(() => {
    return activityLog.slice(-15).reverse();
  }, [activityLog]);

  const leaderboard = useMemo(() => {
    if (!canAccess(currentUser?.role, 'Team')) return [];
    return users.filter(u => u.role !== 'admin').map(u => {
      const userCalls = callLogs.filter(c => c.calledBy === u.name);
      const userLeads = leads.filter(l => l.assignedTo === u.id);
      const demos = userLeads.filter(l => ['Demo Scheduled', 'Demo Completed', 'Proposal Sent', 'Closed Won'].includes(l.status)).length;
      const closed = userLeads.filter(l => l.status === 'Closed Won').length;
      return { ...u, calls: userCalls.length, demos, closed, commission: demos * 50 + closed * 200 };
    }).sort((a, b) => b.demos - a.demos);
  }, [users, callLogs, leads, currentUser]);

  const handleTaskComplete = (lead) => {
    updateLead(lead.id, { status: lead.status === 'New' ? 'Contacted' : lead.status, followUpDate: null });
    addActivity(`Follow-up completed for "${lead.businessName}"`, 'lead', currentUser?.id, lead.id);
  };

  const activityTypeColors = {
    lead: 'var(--blue)',
    call: 'var(--yellow)',
    pipeline: 'var(--purple)',
    payment: 'var(--green)',
    team: 'var(--orange)',
    outreach: 'var(--red)',
    system: 'var(--muted)',
  };

  const isMobile = useIsMobile();

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Greeting */}
      <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700 }}>
          {getGreeting()}, {currentUser?.name?.split(' ')[0]}.
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px' }}>{formatDate(new Date())}</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '16px' : '24px' }}>
        <StatCard label="Total Leads" value={stats.totalLeads} color="var(--blue)" icon={Users} />
        <StatCard label="Sequences Active" value={stats.sequencesActive} color="var(--red)" icon={Zap} pulsing={stats.sequencesActive > 0} />
        <StatCard label="Demos Booked" value={stats.demosBooked} color="var(--purple)" icon={Calendar} />
        <StatCard label="Closed Won" value={stats.closedWon} color="var(--green)" icon={CheckCircle2} />
        <StatCard label="Est. Revenue" value={stats.estRevenue} color="var(--green)" icon={DollarSign} prefix="$" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: '16px', marginBottom: isMobile ? '16px' : '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Leads by Stage</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Leads by Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text2)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard + Tasks + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Leaderboard</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Calls</th>
                  <th>Demos</th>
                  <th>Closed</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar name={u.name} size={24} />
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.calls}</td>
                    <td style={{ fontWeight: 600 }}>{u.demos}</td>
                    <td>{u.closed}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatCurrency(u.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Today's Tasks + Activity */}
        <div>
          {/* Today's Tasks */}
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Today's Follow-ups</h3>
            {todayTasks.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No follow-ups scheduled for today.</p>
            ) : (
              todayTasks.map(lead => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    onChange={() => handleTaskComplete(lead)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--red)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{lead.businessName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text2)', marginLeft: '8px' }}>{lead.type}</span>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
              ))
            )}
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No activity yet.</p>
            ) : (
              recentActivity.slice(0, 8).map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px' }}>
                  <span style={{ width: '4px', borderRadius: '2px', background: activityTypeColors[a.type] || 'var(--muted)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: 'var(--text)' }}>{a.description}</span>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                      {relativeTime(a.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
