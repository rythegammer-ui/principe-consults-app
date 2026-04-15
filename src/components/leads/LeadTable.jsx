import { useState } from 'react';
import { Check, X, MoreVertical, Copy, Trash2, Edit2, Eye } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { StatusBadge, Avatar, StarRating } from '../ui';
import { formatPhone, relativeTime } from '../../utils/formatters';
import { calculateLeadScore, getScoreColor } from '../../lib/leadScoring';
import LeadDetailPanel from './LeadDetailPanel';

export default function LeadTable({ leads }) {
  const users = useAppStore(s => s.users);
  const deleteLead = useAppStore(s => s.deleteLead);
  const updateLead = useAppStore(s => s.updateLead);
  const addNotification = useAppStore(s => s.addNotification);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [menuOpen, setMenuOpen] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map(l => l.id)));
  };

  const copyPhone = async (phone, id) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(id);
      setTimeout(() => setCopiedPhone(null), 1500);
    } catch { /* noop */ }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteLead(id));
    addNotification(`Deleted ${selectedIds.size} leads`, 'info');
    setSelectedIds(new Set());
  };

  const handleBulkAssign = (userId) => {
    selectedIds.forEach(id => updateLead(id, { assignedTo: userId }));
    addNotification(`Assigned ${selectedIds.size} leads`, 'success');
    setSelectedIds(new Set());
  };

  return (
    <>
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '12px', animation: 'fadeIn 0.2s ease-out' }}>
          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{selectedIds.size} selected</span>
          <select onChange={e => { if (e.target.value) handleBulkAssign(e.target.value); }} style={{ height: '32px', fontSize: '12px', width: 'auto', padding: '4px 8px' }} defaultValue="">
            <option value="" disabled>Assign to...</option>
            {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--red)' }} onClick={handleBulkDelete}>
            <Trash2 size={14} style={{ marginRight: '4px', display: 'inline' }} />Delete
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" checked={selectedIds.size === leads.length && leads.length > 0} onChange={toggleAll} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              </th>
              <th>Score</th>
              <th>Business</th>
              <th>Type</th>
              <th>City</th>
              <th>Phone</th>
              <th>Website</th>
              <th>Rating</th>
              <th>Assigned</th>
              <th>Status</th>
              <th>Last Activity</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => {
              const assigned = users.find(u => u.id === lead.assignedTo);
              const score = calculateLeadScore(lead);
              const scoreStyle = getScoreColor(score);
              return (
                <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLead(lead.id)}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleSelect(lead.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '36px', padding: '3px 6px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                      background: scoreStyle.bg, color: scoreStyle.text, border: `1px solid ${scoreStyle.border}`,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {score}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{lead.businessName}</span>
                    {lead.ownerName && <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{lead.ownerName}</div>}
                  </td>
                  <td>
                    <span style={{ background: 'var(--surface3)', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{lead.type}</span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{lead.city}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {lead.phone ? (
                      <span
                        onClick={() => copyPhone(lead.phone, lead.id)}
                        style={{ cursor: 'pointer', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text2)' }}
                        title="Click to copy"
                      >
                        {copiedPhone === lead.id ? (
                          <span style={{ color: 'var(--green)', fontSize: '12px' }}>Copied!</span>
                        ) : (
                          formatPhone(lead.phone)
                        )}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td>
                    {lead.hasWebsite ? (
                      <Check size={16} style={{ color: 'var(--green)' }} />
                    ) : (
                      <X size={16} style={{ color: 'var(--red)' }} />
                    )}
                  </td>
                  <td><StarRating rating={lead.rating} size={12} /></td>
                  <td>
                    {assigned ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Avatar name={assigned.name} size={22} />
                        <span style={{ fontSize: '12px' }}>{assigned.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td style={{ fontSize: '12px', color: 'var(--text2)' }}>{relativeTime(lead.createdAt)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setMenuOpen(menuOpen === lead.id ? null : lead.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: '4px' }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen === lead.id && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', zIndex: 20,
                          background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.5)', minWidth: '140px', padding: '4px',
                        }}>
                          <button onClick={() => { setSelectedLead(lead.id); setMenuOpen(null); }} style={menuItemStyle}>
                            <Eye size={14} /> View
                          </button>
                          <button onClick={() => { setSelectedLead(lead.id); setMenuOpen(null); }} style={menuItemStyle}>
                            <Edit2 size={14} /> Edit
                          </button>
                          <button onClick={() => { deleteLead(lead.id); setMenuOpen(null); addNotification(`Deleted ${lead.businessName}`, 'info'); }} style={{ ...menuItemStyle, color: 'var(--red)' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedLead && <LeadDetailPanel leadId={selectedLead} onClose={() => setSelectedLead(null)} />}
    </>
  );
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
  padding: '8px 12px', background: 'none', border: 'none',
  color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', borderRadius: '4px',
  fontFamily: "'Manrope', sans-serif", textAlign: 'left',
};
