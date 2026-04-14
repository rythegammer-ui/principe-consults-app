import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { MessageSquare } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { Avatar } from '../ui';
import { formatPhone, relativeTime, formatCurrency } from '../../utils/formatters';

export default function KanbanCard({ lead, index, onClick }) {
  const users = useAppStore(s => s.users);
  const updateLead = useAppStore(s => s.updateLead);
  const assigned = users.find(u => u.id === lead.assignedTo);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  const saveNote = () => {
    if (!noteText.trim()) { setShowNote(false); return; }
    const timestamp = new Date().toLocaleString();
    const newNotes = lead.notes ? `${lead.notes}\n[${timestamp}] ${noteText}` : `[${timestamp}] ${noteText}`;
    updateLead(lead.id, { notes: newNotes });
    setNoteText('');
    setShowNote(false);
  };

  const copyPhone = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1500);
    } catch { /* noop */ }
  };

  const daysInStage = lead.createdAt
    ? Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? 'var(--surface3)' : 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '8px',
            cursor: 'pointer',
            transition: 'box-shadow 0.15s',
            boxShadow: snapshot.isDragging ? '0 4px 20px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '14px', fontFamily: "'Syne', sans-serif", marginBottom: '4px' }}>
            {lead.businessName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
            {lead.type} — {lead.city}
          </div>

          {lead.phone && (
            <div
              onClick={copyPhone}
              style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '6px', cursor: 'pointer' }}
            >
              {copiedPhone ? <span style={{ color: 'var(--green)' }}>Copied!</span> : formatPhone(lead.phone)}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {assigned && <Avatar name={assigned.name} size={20} />}
              {lead.tierFit && lead.tierFit !== 'TBD' && (
                <span style={{ fontSize: '10px', background: 'var(--surface3)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text2)' }}>
                  {lead.tierFit.split(' ')[0]}
                </span>
              )}
            </div>
            {lead.status === 'Closed Won' && lead.dealValue > 0 && (
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)' }}>
                {formatCurrency(lead.dealValue)}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
            <span>{daysInStage}d in stage</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowNote(!showNote); }}
              style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: '2px' }}
            >
              <MessageSquare size={12} />
            </button>
          </div>

          {lead.notes && !showNote && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead.notes.split('\n').pop()}
            </div>
          )}

          {showNote && (
            <div style={{ marginTop: '8px' }} onClick={e => e.stopPropagation()}>
              <textarea
                rows={2}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNote(); } }}
                onBlur={saveNote}
                placeholder="Add a note..."
                autoFocus
                style={{ fontSize: '12px', padding: '6px 8px' }}
              />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
