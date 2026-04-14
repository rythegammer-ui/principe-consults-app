import { Trash2, Edit2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { PaymentStatusBadge } from '../ui';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function PaymentsTable({ payments }) {
  const deletePayment = useAppStore(s => s.deletePayment);
  const addNotification = useAppStore(s => s.addNotification);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Tier</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Status</th>
            <th>Method</th>
            <th>Stripe ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td style={{ fontSize: '13px' }}>{formatDate(p.date)}</td>
              <td style={{ fontWeight: 600 }}>{p.businessName}</td>
              <td>
                <span style={{ background: 'var(--surface3)', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{p.tier}</span>
              </td>
              <td style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
              <td>
                <span style={{
                  padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                  background: p.type === 'recurring' ? 'rgba(96,165,250,0.15)' : 'rgba(167,139,250,0.15)',
                  color: p.type === 'recurring' ? 'var(--blue)' : 'var(--purple)',
                }}>
                  {p.type}
                </span>
              </td>
              <td><PaymentStatusBadge status={p.status} /></td>
              <td style={{ fontSize: '12px', textTransform: 'capitalize' }}>{p.method}</td>
              <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text2)' }}>
                {p.stripeId || '—'}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => { deletePayment(p.id); addNotification('Payment deleted', 'info'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
