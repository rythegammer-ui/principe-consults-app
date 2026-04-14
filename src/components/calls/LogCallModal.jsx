import { useState } from 'react';
import { Modal } from '../ui';
import useAppStore from '../../store/useAppStore';
import { CALL_OUTCOMES } from '../../utils/formatters';

export default function LogCallModal({ open, onClose, defaultLeadId = '' }) {
  const leads = useAppStore(s => s.leads);
  const currentUser = useAppStore(s => s.currentUser);
  const logCall = useAppStore(s => s.logCall);
  const addNotification = useAppStore(s => s.addNotification);

  const now = new Date();
  const [form, setForm] = useState({
    leadId: defaultLeadId,
    calledBy: currentUser?.name || '',
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    duration: '',
    outcome: 'No Answer',
    notes: '',
    followUpDate: '',
    followUpNote: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.leadId) return;
    logCall({
      leadId: form.leadId,
      calledBy: form.calledBy,
      date: form.date,
      time: form.time,
      duration: form.duration ? parseInt(form.duration) : null,
      outcome: form.outcome,
      notes: form.notes,
      followUpDate: form.followUpDate || null,
      followUpNote: form.followUpNote,
    });
    addNotification('Call logged successfully', 'success');
    onClose();
  };

  const fieldStyle = { marginBottom: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <Modal open={open} onClose={onClose} title="Log a Call">
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Lead *</label>
          <select value={form.leadId} onChange={e => set('leadId', e.target.value)} required>
            <option value="">Select a lead...</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Called By</label>
            <input value={form.calledBy} onChange={e => set('calledBy', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Duration (min)</label>
            <input type="number" min="0" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="5" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Time</label>
            <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Outcome</label>
          <select value={form.outcome} onChange={e => set('outcome', e.target.value)}>
            {CALL_OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="What was discussed, objections, next steps..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Next Follow-up Date</label>
            <input type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Follow-up Note</label>
            <input value={form.followUpNote} onChange={e => set('followUpNote', e.target.value)} placeholder="What to say next time" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-red">Log Call</button>
        </div>
      </form>
    </Modal>
  );
}
