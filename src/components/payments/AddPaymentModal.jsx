import { useState } from 'react';
import { Modal } from '../ui';
import useAppStore from '../../store/useAppStore';
import { PAYMENT_METHODS, PAYMENT_STATUSES, TIER_NAMES } from '../../utils/formatters';

export default function AddPaymentModal({ open, onClose }) {
  const addPayment = useAppStore(s => s.addPayment);
  const leads = useAppStore(s => s.leads);
  const addNotification = useAppStore(s => s.addNotification);
  const [form, setForm] = useState({
    leadId: '',
    businessName: '',
    amount: '',
    type: 'one-time',
    tier: 'Launchpad',
    status: 'paid',
    method: 'stripe',
    stripeId: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLeadSelect = (leadId) => {
    set('leadId', leadId);
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) set('businessName', lead.businessName);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.businessName || !form.amount) return;
    addPayment({
      ...form,
      amount: parseFloat(form.amount),
      leadId: form.leadId || null,
    });
    addNotification(`Payment of $${parseFloat(form.amount).toLocaleString()} recorded`, 'success');
    onClose();
  };

  const fieldStyle = { marginBottom: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <Modal open={open} onClose={onClose} title="Add Payment">
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Client (link to lead)</label>
          <select value={form.leadId} onChange={e => handleLeadSelect(e.target.value)}>
            <option value="">— No linked lead —</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Client Name *</label>
          <input value={form.businessName} onChange={e => set('businessName', e.target.value)} required placeholder="Business name" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Amount ($) *</label>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="997" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="one-time">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tier</label>
            <select value={form.tier} onChange={e => set('tier', e.target.value)}>
              {TIER_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Payment Method</label>
            <select value={form.method} onChange={e => set('method', e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Stripe Payment ID</label>
          <input value={form.stripeId} onChange={e => set('stripeId', e.target.value)} placeholder="pi_xxxx or sub_xxxx" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Payment notes..." />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-red">Add Payment</button>
        </div>
      </form>
    </Modal>
  );
}
