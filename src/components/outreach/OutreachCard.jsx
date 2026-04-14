import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Edit2, Loader2, Star } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { StatusBadge, CopyButton } from '../ui';
import GHLSendButton from '../ghl/GHLSendButton';

export default function OutreachCard({ lead, onGenerateOne, generating }) {
  const updateLead = useAppStore(s => s.updateLead);
  const moveLeadStatus = useAppStore(s => s.moveLeadStatus);
  const addNotification = useAppStore(s => s.addNotification);
  const [expanded, setExpanded] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState('');

  const stage = lead.outreachStage || 'Queued';
  const messages = lead.outreachMessages || [];
  const isPulsing = stage === 'AI Writing' || stage === 'Sequence Active';

  const stageColors = {
    'Queued': 'var(--muted)',
    'Pulling Data': 'var(--yellow)',
    'AI Writing': 'var(--blue)',
    'Message Ready': 'var(--purple)',
    'Sequence Active': 'var(--red)',
    'Demo Booked': 'var(--green)',
  };

  const handleMarkDemoBooked = () => {
    updateLead(lead.id, { outreachStage: 'Demo Booked' });
    moveLeadStatus(lead.id, 'Demo Scheduled');
    addNotification(`Demo booked for ${lead.businessName}!`, 'success');
  };

  const handleMarkDead = () => {
    updateLead(lead.id, { outreachStage: null });
    moveLeadStatus(lead.id, 'Dead');
    addNotification(`${lead.businessName} marked as dead`, 'info');
  };

  const saveEdit = (idx) => {
    const updated = [...messages];
    updated[idx] = { ...updated[idx], text: editText };
    updateLead(lead.id, { outreachMessages: updated });
    setEditingIdx(null);
  };

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '12px', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', fontFamily: "'Syne', sans-serif" }}>{lead.businessName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
            {lead.type} — {lead.city} — {lead.rating}/5 — {lead.hasWebsite ? lead.websiteUrl : 'No website'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              color: stageColors[stage], background: 'var(--surface2)', border: `1px solid ${stageColors[stage]}`,
              animation: isPulsing ? 'pulse 2s infinite' : 'none',
            }}
          >
            {generating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : stage}
          </span>
        </div>
      </div>

      {messages.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
              fontSize: '13px', marginTop: '12px', fontFamily: "'Manrope', sans-serif",
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {messages.length} messages
          </button>

          {expanded && (
            <div style={{ marginTop: '12px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ background: 'var(--red)', color: 'white', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                      DAY {msg.day}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{msg.type}</span>
                    <span style={{
                      marginLeft: 'auto', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
                      color: msg.text.length <= 160 ? 'var(--green)' : 'var(--red)',
                    }}>
                      {msg.text.length} chars
                    </span>
                  </div>

                  {editingIdx === i ? (
                    <div>
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        style={{ fontSize: '13px', marginBottom: '6px' }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setEditingIdx(null)}>Cancel</button>
                        <button className="btn-red" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => saveEdit(i)}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '8px' }}>{msg.text}</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <CopyButton text={msg.text} />
                        <button
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => { setEditingIdx(i); setEditText(msg.text); }}
                        >
                          Edit
                        </button>
                        <GHLSendButton lead={lead} messageText={msg.text} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {stage === 'Queued' && (
          <button className="btn-red" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => onGenerateOne(lead)} disabled={generating}>
            Generate Outreach
          </button>
        )}
        {stage === 'Sequence Active' && (
          <button className="btn-red" style={{ fontSize: '12px', padding: '6px 14px', background: 'var(--green)' }} onClick={handleMarkDemoBooked}>
            Mark Demo Booked
          </button>
        )}
        {(stage === 'Sequence Active' || stage === 'Message Ready') && (
          <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 14px', color: 'var(--muted)' }} onClick={handleMarkDead}>
            Mark Dead
          </button>
        )}
      </div>
    </div>
  );
}
