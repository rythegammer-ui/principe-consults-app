import { useState, useMemo } from 'react';
import { Plus, DollarSign, TrendingUp, AlertCircle, CreditCard, Percent, BarChart3, Send, Download } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import useAppStore from '../store/useAppStore';
import { StatCard, EmptyState } from '../components/ui';
import PaymentsTable from '../components/payments/PaymentsTable';
import AddPaymentModal from '../components/payments/AddPaymentModal';
import StripeSync from '../components/payments/StripeSync';
import CommissionTracker from '../components/payments/CommissionTracker';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getPaymentStatus } from '../lib/paymentLinks';
import { calculateLeadScore } from '../lib/leadScoring';
import { useIsMobile } from '../utils/hooks';
import { downloadCSV } from '../utils/csv';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const TIER_COLORS = { Launchpad: '#e63228', 'Growth Engine': '#60a5fa', 'Full Stack': '#a78bfa', Custom: '#fb923c' };

export default function Revenue() {
  const payments = useAppStore(s => s.payments);
  const leads = useAppStore(s => s.leads);
  const settings = useAppStore(s => s.settings);
  const currentUser = useAppStore(s => s.currentUser);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [revenueTab, setRevenueTab] = useState('overview');
  const isMobile = useIsMobile();

  // Leads with payment links
  const paymentLinkLeads = useMemo(() => {
    return leads.filter(l => l.paymentLinks && l.paymentLinks.length > 0).map(l => {
      const ps = getPaymentStatus(l);
      const latest = l.paymentLinks[l.paymentLinks.length - 1];
      return { ...l, paymentStatusInfo: ps, latestPaymentLink: latest };
    });
  }, [leads]);

  // Pipeline value
  const pipelineValue = useMemo(() => {
    const active = leads.filter(l => !['Closed Won', 'Dead'].includes(l.status));
    return active.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  }, [leads]);

  const stats = useMemo(() => {
    const paid = payments.filter(p => p.status === 'paid');
    const totalRevenue = paid.reduce((s, p) => s + p.amount, 0);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthlyRecurring = paid
      .filter(p => p.type === 'recurring' && isWithinInterval(new Date(p.date), { start: monthStart, end: monthEnd }))
      .reduce((s, p) => s + p.amount, 0);

    const outstanding = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
    const oneTimePaid = paid.filter(p => p.type === 'one-time');
    const avgDeal = oneTimePaid.length > 0 ? Math.round(oneTimePaid.reduce((s, p) => s + p.amount, 0) / oneTimePaid.length) : 0;
    const monthPayments = paid.filter(p => isWithinInterval(new Date(p.date), { start: monthStart, end: monthEnd })).length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    const collectionRate = (paid.length + overdue) > 0 ? Math.round((paid.length / (paid.length + overdue)) * 100) : 100;

    return { totalRevenue, monthlyRecurring, outstanding, avgDeal, monthPayments, collectionRate };
  }, [payments]);

  const revenueChartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthPaid = payments.filter(p => p.status === 'paid' && isWithinInterval(new Date(p.date), { start, end }));
      const oneTime = monthPaid.filter(p => p.type === 'one-time').reduce((s, p) => s + p.amount, 0);
      const recurring = monthPaid.filter(p => p.type === 'recurring').reduce((s, p) => s + p.amount, 0);
      return { name: format(month, 'MMM'), oneTime, recurring };
    });
  }, [payments]);

  const tierData = useMemo(() => {
    const counts = {};
    payments.filter(p => p.status === 'paid').forEach(p => {
      counts[p.tier] = (counts[p.tier] || 0) + p.amount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: TIER_COLORS[name] || 'var(--muted)' }));
  }, [payments]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '16px' : '24px' }}>
        <StatCard label="Total Revenue" value={stats.totalRevenue} color="var(--green)" icon={DollarSign} prefix="$" />
        <StatCard label="Monthly Recurring" value={stats.monthlyRecurring} color="var(--blue)" icon={TrendingUp} prefix="$" />
        <StatCard label="Outstanding" value={stats.outstanding} color="var(--yellow)" icon={AlertCircle} prefix="$" />
        <StatCard label="Avg Deal Size" value={stats.avgDeal} color="var(--purple)" icon={BarChart3} prefix="$" />
        <StatCard label="Payments This Month" value={stats.monthPayments} color="var(--teal)" icon={CreditCard} />
        <StatCard label="Collection Rate" value={`${stats.collectionRate}%`} color="var(--green)" icon={Percent} />
      </div>

      {/* Revenue Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'paymentlinks', label: `Payment Links (${paymentLinkLeads.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setRevenueTab(t.id)} style={{
            padding: '10px 16px', fontSize: '13px', fontWeight: revenueTab === t.id ? 700 : 500,
            color: revenueTab === t.id ? 'var(--red)' : 'var(--text2)',
            background: 'none', border: 'none', borderBottom: revenueTab === t.id ? '2px solid var(--red)' : '2px solid transparent',
            cursor: 'pointer', fontFamily: "'Manrope', sans-serif", marginBottom: '-1px',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Payment Links Tab */}
      {revenueTab === 'paymentlinks' && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Payment Links Sent</h3>
            <button className="btn-ghost" onClick={() => {
              const csv = ['Business,Tier,Sent Date,Status,Amount\n',
                ...paymentLinkLeads.map(l => `"${l.businessName}","${l.latestPaymentLink?.tierName}","${l.latestPaymentLink?.sentAt}","${l.paymentStatusInfo?.status}","${l.dealValue || ''}"`)
              ].join('\n');
              downloadCSV(csv, 'payment-links-export.csv');
            }} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <Download size={14} /> Export
            </button>
          </div>
          {paymentLinkLeads.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No payment links sent yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Package</th>
                  <th>Sent</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {paymentLinkLeads.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.businessName}</td>
                    <td>{l.latestPaymentLink?.tierName || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{l.latestPaymentLink?.sentAt ? formatDate(l.latestPaymentLink.sentAt) : '—'}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        background: l.paymentStatusInfo?.status === 'paid' ? 'rgba(34,197,94,0.15)' : l.paymentStatusInfo?.status === 'overdue' ? 'rgba(230,50,40,0.15)' : 'rgba(245,158,11,0.15)',
                        color: l.paymentStatusInfo?.color || 'var(--text2)',
                      }}>
                        {l.paymentStatusInfo?.status || 'sent'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{l.dealValue ? formatCurrency(l.dealValue) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {revenueTab === 'overview' && <>
      {/* Pipeline Value */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Pipeline Value (Active Leads)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--blue)', fontFamily: "'Syne', sans-serif" }}>{formatCurrency(pipelineValue)}</div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
          {leads.filter(l => !['Closed Won', 'Dead'].includes(l.status)).length} active leads
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: '16px', marginBottom: isMobile ? '16px' : '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
              <Area type="monotone" dataKey="oneTime" stackId="1" stroke="var(--red)" fill="var(--red)" fillOpacity={0.3} name="One-time" />
              <Area type="monotone" dataKey="recurring" stackId="1" stroke="var(--blue)" fill="var(--blue)" fillOpacity={0.3} name="Recurring" />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Revenue by Tier</h3>
          {tierData.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', paddingTop: '60px' }}>No paid revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={tierData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {tierData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} formatter={(val) => formatCurrency(val)} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Payments</h3>
          <button className="btn-red" onClick={() => setShowAddPayment(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Add Payment
          </button>
        </div>
        {payments.length === 0 ? (
          <EmptyState message="No payments recorded yet." action="Add Payment" onAction={() => setShowAddPayment(true)} />
        ) : (
          <PaymentsTable payments={payments} />
        )}
      </div>

      {/* Commission Tracker */}
      <div style={{ marginBottom: '24px' }}>
        <CommissionTracker />
      </div>

      {/* Stripe Integration */}
      <StripeSync />
      </>}

      <AddPaymentModal open={showAddPayment} onClose={() => setShowAddPayment(false)} />
    </div>
  );
}
