import { useState, useMemo } from 'react';
import { DollarSign, Send, Clock, CheckCircle, XCircle, Banknote, CreditCard, TrendingUp } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { StatCard, Modal, EmptyState } from '../components/ui';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const PAYOUT_STATUS_STYLES = {
  pending: { bg: 'rgba(245,158,11,0.15)', text: 'var(--yellow)', border: 'rgba(245,158,11,0.3)', label: 'Pending' },
  approved: { bg: 'rgba(96,165,250,0.15)', text: 'var(--blue)', border: 'rgba(96,165,250,0.3)', label: 'Approved' },
  paid: { bg: 'rgba(34,197,94,0.15)', text: 'var(--green)', border: 'rgba(34,197,94,0.3)', label: 'Paid' },
  rejected: { bg: 'rgba(230,50,40,0.15)', text: 'var(--red)', border: 'rgba(230,50,40,0.3)', label: 'Rejected' },
};

function PayoutStatusBadge({ status }) {
  const s = PAYOUT_STATUS_STYLES[status] || PAYOUT_STATUS_STYLES.pending;
  return (
    <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function RequestPayoutModal({ open, onClose, maxAmount }) {
  const requestPayout = useAppStore(s => s.requestPayout);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('zelle');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (val > maxAmount) return;
    requestPayout(val, method, notes);
    setAmount('');
    setNotes('');
    onClose();
  };

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const fieldStyle = { marginBottom: '14px' };

  return (
    <Modal open={open} onClose={onClose} title="Request Payout">
      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Available Balance</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green)', fontFamily: "'Syne', sans-serif" }}>
            {formatCurrency(maxAmount)}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Amount ($) *</label>
          <input
            type="number"
            min="1"
            max={maxAmount}
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            placeholder={`Max ${formatCurrency(maxAmount)}`}
          />
          {parseFloat(amount) > maxAmount && (
            <p style={{ color: 'var(--red)', fontSize: '12px', marginTop: '4px' }}>Cannot exceed available balance</p>
          )}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Payout Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)}>
            <option value="zelle">Zelle</option>
            <option value="stripe">Stripe Transfer</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="cashapp">Cash App</option>
            <option value="venmo">Venmo</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any details for admin..."
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            className="btn-red"
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={14} /> Request Payout
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AdminPayoutActions({ request }) {
  const approvePayout = useAppStore(s => s.approvePayout);
  const rejectPayout = useAppStore(s => s.rejectPayout);
  const markPayoutPaid = useAppStore(s => s.markPayoutPaid);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showPaid, setShowPaid] = useState(false);
  const [stripeId, setStripeId] = useState('');

  if (request.status === 'pending') {
    return (
      <div>
        {showReject ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason..."
              style={{ fontSize: '12px', padding: '4px 8px', width: '140px' }}
            />
            <button
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--red)' }}
              onClick={() => { rejectPayout(request.id, rejectReason); setShowReject(false); }}
            >
              Confirm
            </button>
            <button className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setShowReject(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--green)' }}
              onClick={() => approvePayout(request.id)}
            >
              Approve
            </button>
            <button
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--red)' }}
              onClick={() => setShowReject(true)}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    );
  }

  if (request.status === 'approved') {
    return (
      <div>
        {showPaid ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              value={stripeId}
              onChange={e => setStripeId(e.target.value)}
              placeholder="Stripe/Ref ID (optional)"
              style={{ fontSize: '12px', padding: '4px 8px', width: '160px', fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button
              className="btn-ghost"
              style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--green)' }}
              onClick={() => { markPayoutPaid(request.id, stripeId); setShowPaid(false); }}
            >
              Confirm
            </button>
            <button className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setShowPaid(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn-red"
            style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowPaid(true)}
          >
            <Banknote size={12} /> Mark Paid
          </button>
        )}
      </div>
    );
  }

  return <span style={{ fontSize: '12px', color: 'var(--muted)' }}>-</span>;
}

export default function Payouts() {
  const currentUser = useAppStore(s => s.currentUser);
  const users = useAppStore(s => s.users);
  const leads = useAppStore(s => s.leads);
  const payments = useAppStore(s => s.payments);
  const payoutRequests = useAppStore(s => s.payoutRequests);
  const settings = useAppStore(s => s.settings);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canManagePayouts = isAdmin || isManager;

  // Calculate commission for a given rep
  const getRepCommission = (repId) => {
    const repLeads = leads.filter(l => l.assignedTo === repId);
    const demosShown = repLeads.filter(l => ['Demo Completed', 'Proposal Sent', 'Closed Won'].includes(l.status)).length;
    const closedLeads = repLeads.filter(l => l.status === 'Closed Won');
    const launchpadCloses = closedLeads.filter(l => l.tierFit?.includes('Launchpad')).length;
    const growthCloses = closedLeads.filter(l => l.tierFit?.includes('Growth')).length;
    const fullStackCloses = closedLeads.filter(l => l.tierFit?.includes('Full Stack')).length;

    const demoCommission = demosShown * (settings.commissionDemo || 50);
    const launchpadCommission = launchpadCloses * (settings.commissionLaunchpad || 150);
    const growthCommission = growthCloses * (settings.commissionGrowth || 300);
    const fullStackCommission = fullStackCloses * (settings.commissionFullStack || 500);

    const recurringPaid = payments.filter(p => p.type === 'recurring' && p.status === 'paid');
    const repRecurring = recurringPaid.filter(p => {
      const lead = leads.find(l => l.id === p.leadId);
      return lead?.assignedTo === repId;
    });
    const recurringCommission = repRecurring.reduce((sum, p) => sum + (p.amount * (settings.commissionRetainerPct || 15) / 100), 0);

    return demoCommission + launchpadCommission + growthCommission + fullStackCommission + recurringCommission;
  };

  const myCommission = getRepCommission(currentUser?.id);
  const myPaidOut = payoutRequests
    .filter(r => r.userId === currentUser?.id && (r.status === 'paid' || r.status === 'approved'))
    .reduce((sum, r) => sum + r.amount, 0);
  const myPending = payoutRequests
    .filter(r => r.userId === currentUser?.id && r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);
  const myAvailable = Math.max(0, myCommission - myPaidOut - myPending);

  const visibleRequests = useMemo(() => {
    let list = canManagePayouts ? payoutRequests : payoutRequests.filter(r => r.userId === currentUser?.id);
    if (filterStatus !== 'all') list = list.filter(r => r.status === filterStatus);
    return [...list].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  }, [payoutRequests, currentUser, canManagePayouts, filterStatus]);

  const totalPending = payoutRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
  const totalApproved = payoutRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);
  const totalPaidOut = payoutRequests.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Rep's own balance card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Total Earned" value={myCommission} color="var(--green)" icon={TrendingUp} prefix="$" />
        <StatCard label="Available to Withdraw" value={myAvailable} color="var(--blue)" icon={DollarSign} prefix="$" />
        <StatCard label="Pending Requests" value={myPending} color="var(--yellow)" icon={Clock} prefix="$" />
        <StatCard label="Total Paid Out" value={canManagePayouts ? totalPaidOut : myPaidOut} color="var(--teal)" icon={Banknote} prefix="$" />
        {canManagePayouts && <StatCard label="Awaiting Approval" value={totalPending} color="var(--yellow)" icon={Clock} prefix="$" />}
        {canManagePayouts && <StatCard label="Approved (Ready to Pay)" value={totalApproved} color="var(--blue)" icon={CheckCircle} prefix="$" />}
      </div>

      {/* Request payout button */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Your Commission Balance</h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
              You have <span style={{ color: 'var(--green)', fontWeight: 700 }}>{formatCurrency(myAvailable)}</span> available to withdraw.
              Request a payout anytime — admin will process it.
            </p>
          </div>
          <button
            className="btn-red"
            onClick={() => setShowRequestModal(true)}
            disabled={myAvailable <= 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: myAvailable <= 0 ? 0.5 : 1 }}
          >
            <Send size={14} /> Request Payout
          </button>
        </div>
      </div>

      {/* Payout requests table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
            {canManagePayouts ? 'All Payout Requests' : 'Your Payout History'}
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'pending', 'approved', 'paid', 'rejected'].map(s => (
              <button
                key={s}
                className="btn-ghost"
                onClick={() => setFilterStatus(s)}
                style={{
                  fontSize: '12px', padding: '4px 10px', textTransform: 'capitalize',
                  background: filterStatus === s ? 'var(--red-glow)' : undefined,
                  color: filterStatus === s ? 'var(--red)' : undefined,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {visibleRequests.length === 0 ? (
          <EmptyState message="No payout requests yet." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  {canManagePayouts && <th>Rep</th>}
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Notes</th>
                  {canManagePayouts && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map(r => (
                  <tr key={r.id}>
                    {canManagePayouts && <td style={{ fontWeight: 600 }}>{r.userName}</td>}
                    <td style={{ fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(r.amount)}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '13px' }}>{r.method}</td>
                    <td><PayoutStatusBadge status={r.status} /></td>
                    <td style={{ fontSize: '13px', color: 'var(--text2)' }}>{formatDateTime(r.requestedAt)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text2)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.notes || '-'}
                    </td>
                    {canManagePayouts && (
                      <td><AdminPayoutActions request={r} /></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RequestPayoutModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        maxAmount={myAvailable}
      />
    </div>
  );
}
