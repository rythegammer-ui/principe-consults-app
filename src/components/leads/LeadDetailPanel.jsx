import { useState, useMemo, Component } from 'react';
import { X, Phone, Mail, Globe, MapPin, ExternalLink, MessageSquare, FileText } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { StatusBadge, StarRating, OutcomeBadge, CopyButton, PaymentStatusBadge } from '../ui';
import { formatPhone, formatDate, formatCurrency, LEAD_STATUSES } from '../../utils/formatters';
import LogCallModal from '../calls/LogCallModal';
import ProposalModal from './ProposalModal';
import GHLMessaging from '../ghl/GHLMessaging';

// Error boundary to catch render crashes inside the panel
class PanelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--red)', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Something went wrong loading this lead.</p>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px' }}>{String(this.state.error?.message || '')}</p>
          <button className="btn-ghost" onClick={this.props.onClose}>Close Panel</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PanelContent({ leadId, onClose }) {
  const leads = useAppStore(s => s.leads);
  const updateLead = useAppStore(s => s.updateLead);
  const users = useAppStore(s => s.users);
  const allCallLogs = useAppStore(s => s.callLogs);
  const allPayments = useAppStore(s => s.payments);
  const allActivity = useAppStore(s => s.activityLog);
  const settings = useAppStore(s => s.settings);

  const lead = useMemo(() => leads.find(l => l.id === leadId), [leads, leadId]);
  const callLogs = useMemo(() => allCallLogs.filter(c => c.leadId === leadId), [allCallLogs, leadId]);
  const payments = useMemo(() => allPayments.filter(p => p.leadId === leadId), [allPayments, leadId]);
  const activityLog = useMemo(() => allActivity.filter(a => a.leadId === leadId), [allActivity, leadId]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  if (!lead) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Lead not found.</p>
        <button className="btn-ghost" onClick={onClose} style={{ marginTop: '12px' }}>Close</button>
      </div>
    );
  }

  const outreachMessages = Array.isArray(lead.outreachMessages) ? lead.outreachMessages : [];

  return (
    <>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{lead.businessName || 'Unnamed Lead'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{lead.type || '—'}</span>
            <span style={{ color: 'var(--muted)' }}>|</span>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{lead.city || '—'}</span>
            <StatusBadge status={lead.status || 'New'} />
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Status & Assignment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Status</label>
            <select value={lead.status || 'New'} onChange={e => updateLead(lead.id, { status: e.target.value })} style={{ height: '36px', fontSize: '13px' }}>
              {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Assigned To</label>
            <select value={lead.assignedTo || ''} onChange={e => updateLead(lead.id, { assignedTo: e.target.value })} style={{ height: '36px', fontSize: '13px' }}>
              <option value="">Unassigned</option>
              {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        {/* Contact Info */}
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h4>
          {lead.ownerName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text2)' }}>Owner:</span> {lead.ownerName}
            </div>
          )}
          {lead.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
              <Phone size={14} style={{ color: 'var(--text2)' }} />
              <a href={`tel:${lead.phone}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>{formatPhone(lead.phone)}</a>
              <CopyButton text={lead.phone} label="Copy" />
            </div>
          )}
          {lead.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
              <Mail size={14} style={{ color: 'var(--text2)' }} />
              <span>{lead.email}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
            <Globe size={14} style={{ color: lead.hasWebsite ? 'var(--green)' : 'var(--red)' }} />
            {lead.hasWebsite ? <span>{lead.websiteUrl || '—'}</span> : <span style={{ color: 'var(--muted)' }}>No website</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <MapPin size={14} style={{ color: 'var(--text2)' }} />
            <span>{lead.city || '—'}</span>
          </div>
          {lead.rating != null && (
            <div style={{ marginTop: '8px' }}>
              <StarRating rating={lead.rating} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--text2)' }}>Source:</span> {lead.source || '—'}</div>
            <div><span style={{ color: 'var(--text2)' }}>Tier:</span> {lead.tierFit || '—'}</div>
            <div><span style={{ color: 'var(--text2)' }}>Deal Value:</span> {formatCurrency(lead.dealValue)}</div>
            <div><span style={{ color: 'var(--text2)' }}>Created:</span> {formatDate(lead.createdAt)}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button className="btn-red" onClick={() => setShowCallModal(true)} style={{ fontSize: '13px', padding: '8px 16px' }}>
            <Phone size={14} style={{ marginRight: '6px', display: 'inline' }} />Log a Call
          </button>
          <button className="btn-ghost" onClick={() => window.open(settings.bookingLink, '_blank')} style={{ fontSize: '13px', padding: '8px 16px' }}>
            <ExternalLink size={14} style={{ marginRight: '6px', display: 'inline' }} />Book Demo
          </button>
          <button className="btn-ghost" onClick={() => setShowProposal(true)} style={{ fontSize: '13px', padding: '8px 16px', borderColor: lead.proposal ? 'var(--green)' : 'var(--border)', color: lead.proposal ? 'var(--green)' : 'var(--text2)' }}>
            <FileText size={14} style={{ marginRight: '6px', display: 'inline' }} />{lead.proposal ? 'View Proposal' : 'Generate Proposal'}
          </button>
        </div>

        {/* GHL Messaging */}
        <GHLMessaging lead={lead} />

        {/* Notes */}
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</h4>
            {!editingNotes && (
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => { setEditingNotes(true); setNotesValue(lead.notes || ''); }}>
                Edit
              </button>
            )}
          </div>
          {editingNotes ? (
            <div>
              <textarea rows={4} value={notesValue} onChange={e => setNotesValue(e.target.value)} style={{ marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setEditingNotes(false)}>Cancel</button>
                <button className="btn-red" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => { updateLead(lead.id, { notes: notesValue }); setEditingNotes(false); }}>Save</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: lead.notes ? 'var(--text)' : 'var(--muted)', whiteSpace: 'pre-wrap' }}>
              {lead.notes || 'No notes yet.'}
            </p>
          )}
        </div>

        {/* Outreach Messages */}
        {outreachMessages.length > 0 && (
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              <MessageSquare size={14} style={{ marginRight: '6px', display: 'inline' }} />
              Outreach Messages
            </h4>
            {outreachMessages.map((msg, i) => {
              const text = msg?.text || '';
              return (
                <div key={i} style={{ padding: '10px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ background: 'var(--red)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                      DAY {msg?.day || '?'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{msg?.type || ''}</span>
                    <span style={{ fontSize: '11px', color: text.length <= 160 ? 'var(--green)' : 'var(--red)', marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>
                      {text.length}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: '1.5' }}>{text}</p>
                  {text && <CopyButton text={text} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Call History */}
        {callLogs.length > 0 && (
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Call History</h4>
            {callLogs.slice().reverse().map(c => (
              <div key={c.id} style={{ padding: '10px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: "'JetBrains Mono', monospace" }}>{formatDate(c.timestamp)}</span>
                  <OutcomeBadge outcome={c.outcome || 'No Answer'} />
                  {c.duration && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.duration}min</span>}
                </div>
                {c.notes && <p style={{ fontSize: '13px', color: 'var(--text2)' }}>{c.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Payment History</h4>
            {payments.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '6px' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text2)', marginLeft: '8px' }}>{p.tier || ''} - {p.type || ''}</span>
                </div>
                <PaymentStatusBadge status={p.status || 'pending'} />
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {activityLog.length > 0 && (
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Timeline</h4>
            {activityLog.slice().reverse().map(a => (
              <div key={a.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', flexShrink: 0 }}>
                  {formatDate(a.timestamp)}
                </span>
                <span style={{ color: 'var(--text2)' }}>{a.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCallModal && <LogCallModal open={showCallModal} onClose={() => setShowCallModal(false)} defaultLeadId={leadId} />}
      {showProposal && <ProposalModal open={showProposal} onClose={() => setShowProposal(false)} leadId={leadId} />}
    </>
  );
}

export default function LeadDetailPanel({ leadId, onClose }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50,
        }}
      />
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: isMobile ? '100%' : '520px', maxWidth: '100%',
          background: 'var(--surface)', borderLeft: isMobile ? 'none' : '1px solid var(--border)', zIndex: 51,
          overflowY: 'auto', animation: 'slideIn 0.2s ease-out',
        }}
      >
        <PanelErrorBoundary onClose={onClose}>
          <PanelContent leadId={leadId} onClose={onClose} />
        </PanelErrorBoundary>
      </div>
    </>
  );
}
