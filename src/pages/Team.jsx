import { useState, useMemo } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAppStore from '../store/useAppStore';
import { Modal, Avatar, RoleBadge, EmptyState, StatusBadge } from '../components/ui';
import { formatCurrency } from '../utils/formatters';
import { startOfWeek, addDays, isWithinInterval, format } from 'date-fns';

export default function Team() {
  const users = useAppStore(s => s.users);
  const leads = useAppStore(s => s.leads);
  const callLogs = useAppStore(s => s.callLogs);
  const addUser = useAppStore(s => s.addUser);
  const updateUser = useAppStore(s => s.updateUser);
  const settings = useAppStore(s => s.settings);
  const activityLog = useAppStore(s => s.activityLog);
  const addNotification = useAppStore(s => s.addNotification);
  const [showAdd, setShowAdd] = useState(false);
  const [showPerf, setShowPerf] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'rep', password: '', notes: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;
    addUser({ ...newUser, avatar: newUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() });
    addNotification(`Team member "${newUser.name}" added`, 'success');
    setNewUser({ name: '', email: '', role: 'rep', password: '', notes: '' });
    setShowAdd(false);
  };

  const teamData = useMemo(() => {
    return users.filter(u => u.active).map(u => {
      const userLeads = leads.filter(l => l.assignedTo === u.id);
      const userCalls = callLogs.filter(c => c.calledBy === u.name);
      const demos = userLeads.filter(l => ['Demo Scheduled', 'Demo Completed', 'Proposal Sent', 'Closed Won'].includes(l.status)).length;
      return { user: u, leadsCount: userLeads.length, callsThisWeek: userCalls.length, demos };
    });
  }, [users, leads, callLogs]);

  const perfUser = users.find(u => u.id === showPerf);

  const perfData = useMemo(() => {
    if (!perfUser) return null;
    const userLeads = leads.filter(l => l.assignedTo === perfUser.id);
    const userCalls = callLogs.filter(c => c.calledBy === perfUser.name);
    const demos = userLeads.filter(l => ['Demo Scheduled', 'Demo Completed', 'Proposal Sent', 'Closed Won'].includes(l.status)).length;
    const closes = userLeads.filter(l => l.status === 'Closed Won').length;
    const conversionRate = userCalls.length > 0 ? Math.round((demos / userCalls.length) * 100) : 0;
    const commission = demos * (settings.commissionDemo || 50) + closes * 200;

    // Calls per day this week
    const weekStart = startOfWeek(new Date());
    const dailyCalls = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const dayEnd = addDays(day, 1);
      const count = userCalls.filter(c => c.timestamp && isWithinInterval(new Date(c.timestamp), { start: day, end: dayEnd })).length;
      return { name: format(day, 'EEE'), calls: count };
    });

    const recentActivity = activityLog.filter(a => a.userId === perfUser.id).slice(-10).reverse();

    return { userLeads, totalCalls: userCalls.length, demos, closes, conversionRate, commission, dailyCalls, recentActivity };
  }, [perfUser, leads, callLogs, activityLog, settings]);

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const fieldStyle = { marginBottom: '14px' };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn-red" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={14} /> Add Team Member
        </button>
      </div>

      {/* Team Table */}
      <div className="card" style={{ padding: '4px', marginBottom: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Role</th>
              <th>Leads</th>
              <th>Calls</th>
              <th>Demos</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map(({ user: u, leadsCount, callsThisWeek, demos }) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar name={u.name} size={32} />
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{u.email}</td>
                <td><RoleBadge role={u.role} /></td>
                <td>{leadsCount}</td>
                <td>{callsThisWeek}</td>
                <td style={{ fontWeight: 600 }}>{demos}</td>
                <td>
                  <span style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    background: u.active ? 'rgba(34,197,94,0.15)' : 'rgba(85,85,85,0.15)',
                    color: u.active ? 'var(--green)' : 'var(--muted)',
                  }}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setShowPerf(u.id)}>
                      <BarChart3 size={12} style={{ marginRight: '4px', display: 'inline' }} />Performance
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => { updateUser(u.id, { active: !u.active }); addNotification(`${u.name} ${u.active ? 'deactivated' : 'activated'}`, 'info'); }}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Team Member">
        <form onSubmit={handleAdd}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Full Name *</label>
            <input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} required placeholder="Jane Smith" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required placeholder="jane@principeconsults.com" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Role</label>
            <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
              <option value="rep">Rep</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Temporary Password *</label>
            <input type="text" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required placeholder="temp1234" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Notes</label>
            <textarea rows={2} value={newUser.notes} onChange={e => setNewUser(u => ({ ...u, notes: e.target.value }))} placeholder="Any notes..." />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn-red">Add Member</button>
          </div>
        </form>
      </Modal>

      {/* Performance Modal */}
      <Modal open={!!showPerf} onClose={() => setShowPerf(null)} title={`Performance — ${perfUser?.name || ''}`} width={650}>
        {perfData && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Total Calls', value: perfData.totalCalls, color: 'var(--blue)' },
                { label: 'Demos', value: perfData.demos, color: 'var(--purple)' },
                { label: 'Closes', value: perfData.closes, color: 'var(--green)' },
                { label: 'Commission', value: formatCurrency(perfData.commission), color: 'var(--green)' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: item.color, fontFamily: "'Syne', sans-serif" }}>{item.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '10px' }}>Calls This Week</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={perfData.dailyCalls}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                <Bar dataKey="calls" fill="var(--red)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {perfData.userLeads.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '10px' }}>Assigned Leads ({perfData.userLeads.length})</h4>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {perfData.userLeads.map(l => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px' }}>{l.businessName}</span>
                      <StatusBadge status={l.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
