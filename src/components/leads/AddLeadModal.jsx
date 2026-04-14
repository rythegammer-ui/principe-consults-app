import { useState } from 'react';
import { Modal } from '../ui';
import useAppStore from '../../store/useAppStore';
import { BUSINESS_TYPES, DFW_CITIES, SOURCES, TIER_OPTIONS } from '../../utils/formatters';

export default function AddLeadModal({ open, onClose }) {
  const addLead = useAppStore(s => s.addLead);
  const users = useAppStore(s => s.users);
  const addNotification = useAppStore(s => s.addNotification);
  const [form, setForm] = useState({
    businessName: '', type: 'Auto Shop', ownerName: '', city: 'Dallas',
    phone: '', email: '', hasWebsite: false, websiteUrl: '', rating: 0,
    assignedTo: '', notes: '', source: 'Cold Call', tierFit: 'TBD', dealValue: 0,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) return;
    addLead({ ...form, status: 'New', followUpDate: null });
    addNotification(`Lead "${form.businessName}" created`, 'success');
    setForm({
      businessName: '', type: 'Auto Shop', ownerName: '', city: 'Dallas',
      phone: '', email: '', hasWebsite: false, websiteUrl: '', rating: 0,
      assignedTo: '', notes: '', source: 'Cold Call', tierFit: 'TBD', dealValue: 0,
    });
    onClose();
  };

  const fieldStyle = { marginBottom: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <Modal open={open} onClose={onClose} title="Add Lead" width={600}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Business Name *</label>
            <input value={form.businessName} onChange={e => set('businessName', e.target.value)} required placeholder="Eagle Auto & Tire" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Business Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Owner Name</label>
            <input value={form.ownerName} onChange={e => set('ownerName', e.target.value)} placeholder="John Smith" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>City</label>
            <select value={form.city} onChange={e => set('city', e.target.value)}>
              {DFW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} placeholder="9725550101" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@business.com" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Has Website</label>
            <div
              className={`toggle ${form.hasWebsite ? 'active' : ''}`}
              onClick={() => set('hasWebsite', !form.hasWebsite)}
            />
          </div>
          {form.hasWebsite && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Website URL</label>
              <input value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} placeholder="example.com" />
            </div>
          )}
          <div style={fieldStyle}>
            <label style={labelStyle}>Google Rating (0-5)</label>
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set('rating', parseFloat(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Assign To</label>
            <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
              <option value="">Unassigned</option>
              {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Source</label>
            <select value={form.source} onChange={e => set('source', e.target.value)}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tier Fit</label>
            <select value={form.tierFit} onChange={e => set('tierFit', e.target.value)}>
              {TIER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this lead..." />
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-red">Add Lead</button>
        </div>
      </form>
    </Modal>
  );
}
