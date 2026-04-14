import { useState, useRef, useMemo } from 'react';
import { FileText, Download, Copy, Check, Loader2, RefreshCw, Printer } from 'lucide-react';
import { Modal, LoadingSpinner } from '../ui';
import useAppStore from '../../store/useAppStore';
import { callClaude, PROPOSAL_SYSTEM_PROMPT, buildProposalPrompt } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ProposalModal({ open, onClose, leadId }) {
  const leads = useAppStore(s => s.leads);
  const lead = useMemo(() => leads.find(l => l.id === leadId), [leads, leadId]);
  const updateLead = useAppStore(s => s.updateLead);
  const settings = useAppStore(s => s.settings);
  const addNotification = useAppStore(s => s.addNotification);
  const addActivity = useAppStore(s => s.addActivity);
  const currentUser = useAppStore(s => s.currentUser);
  const [generating, setGenerating] = useState(false);
  const [selectedTier, setSelectedTier] = useState(() => {
    if (!lead?.tierFit || lead.tierFit === 'TBD') return 'Growth Engine';
    if (lead.tierFit.includes('Launchpad')) return 'Launchpad';
    if (lead.tierFit.includes('Full Stack')) return 'Full Stack';
    return 'Growth Engine';
  });
  const [copied, setCopied] = useState(false);
  const proposalRef = useRef(null);

  if (!lead) return null;

  const proposal = lead.proposal || null;

  const generate = async () => {
    if (!settings.anthropicApiKey) {
      addNotification('Set your Anthropic API key in Settings first.', 'error');
      return;
    }
    setGenerating(true);
    try {
      const prompt = buildProposalPrompt(lead, settings, selectedTier);
      const responseText = await callClaude(settings.anthropicApiKey, PROPOSAL_SYSTEM_PROMPT, prompt);
      const parsed = JSON.parse(responseText);
      updateLead(lead.id, { proposal: { ...parsed, generatedAt: new Date().toISOString(), tier: selectedTier } });
      addActivity(`Proposal generated for "${lead.businessName}" (${selectedTier})`, 'lead', currentUser?.id, lead.id);
      addNotification('Proposal generated!', 'success');
    } catch (err) {
      addNotification(`Proposal failed: ${err.message}`, 'error');
    }
    setGenerating(false);
  };

  const copyAll = async () => {
    if (!proposalRef.current) return;
    try {
      await navigator.clipboard.writeText(proposalRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const handlePrint = () => {
    const content = proposalRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Proposal — ${lead.businessName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Manrope', sans-serif; color: #1a1a1a; padding: 48px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
            h1, h2, h3 { font-family: 'Syne', sans-serif; }
            h1 { font-size: 28px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #e63228; }
            h3 { font-size: 15px; margin-bottom: 8px; }
            p { margin-bottom: 12px; font-size: 14px; }
            ul { padding-left: 20px; margin-bottom: 16px; }
            li { margin-bottom: 6px; font-size: 14px; }
            .header { border-bottom: 3px solid #e63228; padding-bottom: 20px; margin-bottom: 32px; }
            .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: #e63228; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
            .meta { font-size: 12px; color: #666; }
            .investment-box { background: #f8f8f8; border: 2px solid #e63228; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .investment-box .price { font-size: 32px; font-weight: 700; color: #e63228; font-family: 'Syne', sans-serif; }
            .investment-box .monthly { font-size: 16px; color: #666; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
            @media print { body { padding: 24px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Proposal Generator" width={750}>
      {/* Tier Selector + Generate */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Package Tier
          </label>
          <select value={selectedTier} onChange={e => setSelectedTier(e.target.value)} style={{ height: '38px' }}>
            <option value="Launchpad">Launchpad — ${(settings.avgDealLaunchpad || 997).toLocaleString()}</option>
            <option value="Growth Engine">Growth Engine — ${(settings.avgDealGrowth || 2500).toLocaleString()} + ${(settings.retainerGrowth || 500).toLocaleString()}/mo</option>
            <option value="Full Stack">Full Stack — ${(settings.avgDealFullStack || 5000).toLocaleString()} + ${(settings.retainerFullStack || 1000).toLocaleString()}/mo</option>
          </select>
        </div>
        <button
          className="btn-red"
          onClick={generate}
          disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}
        >
          {generating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
          {generating ? 'Generating...' : proposal ? 'Regenerate' : 'Generate Proposal'}
        </button>
      </div>

      {/* Lead context */}
      <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--text2)' }}>
        <strong style={{ color: 'var(--text)' }}>{lead.businessName}</strong> — {lead.type} in {lead.city} — {lead.hasWebsite ? lead.websiteUrl : 'No website'} — {lead.rating}/5 stars
        {lead.ownerName && <span> — Owner: {lead.ownerName}</span>}
      </div>

      {/* Proposal Display */}
      {generating && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <LoadingSpinner size={32} />
          <p style={{ color: 'var(--text2)', marginTop: '12px', fontSize: '14px' }}>Writing proposal for {lead.businessName}...</p>
        </div>
      )}

      {!generating && !proposal && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <FileText size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p style={{ fontSize: '14px' }}>Select a tier and generate a custom proposal for this lead.</p>
        </div>
      )}

      {!generating && proposal && (
        <>
          {/* Action bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <button className="btn-ghost" onClick={copyAll} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px' }}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy All</>}
            </button>
            <button className="btn-ghost" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px' }}>
              <Printer size={14} /> Print / PDF
            </button>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--muted)', alignSelf: 'center' }}>
              Generated {formatDate(proposal.generatedAt)} — Valid until {formatDate(proposal.validUntil)}
            </span>
          </div>

          {/* Rendered Proposal */}
          <div ref={proposalRef} style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {/* Header */}
            <div className="header" style={{ borderBottom: '3px solid var(--red)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div className="logo" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                {settings.agencyName || 'Principe Consults'}
              </div>
              <div className="meta" style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                Proposal for {lead.businessName} — {formatDate(proposal.generatedAt)}
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.3, color: 'var(--text)' }}>
                {proposal.headline}
              </h1>
            </div>

            {/* Summary */}
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text2)', marginBottom: '24px' }}>
              {proposal.summary}
            </p>

            {/* Problems */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--red)', marginBottom: '12px' }}>
              The Challenge
            </h2>
            <div style={{ marginBottom: '24px' }}>
              {(proposal.problems || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'var(--red-glow)',
                    color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '2px',
                  }}>{i + 1}</span>
                  <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>{p}</p>
                </div>
              ))}
            </div>

            {/* Solutions */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)', marginBottom: '12px' }}>
              Our Solution
            </h2>
            <div style={{ marginBottom: '24px' }}>
              {(proposal.solutions || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)',
                    color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '2px',
                  }}>{i + 1}</span>
                  <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>{s}</p>
                </div>
              ))}
            </div>

            {/* Deliverables */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
              What You Get — {proposal.investment?.packageName || selectedTier}
            </h2>
            <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              {(proposal.deliverables || []).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: i < proposal.deliverables.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--green)', fontSize: '14px' }}>&#10003;</span>
                  <span style={{ fontSize: '14px', color: 'var(--text)' }}>{d}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
              Timeline
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '24px' }}>
              {proposal.timeline}
            </p>

            {/* Investment */}
            <div style={{
              background: 'var(--surface2)', border: '2px solid var(--red)', borderRadius: '12px',
              padding: '24px', textAlign: 'center', marginBottom: '24px',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                Your Investment
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--red)', fontFamily: "'Syne', sans-serif" }}>
                {formatCurrency(proposal.investment?.oneTime || 0)}
              </div>
              {proposal.investment?.monthly && (
                <div style={{ fontSize: '16px', color: 'var(--text2)', marginTop: '4px' }}>
                  + {formatCurrency(proposal.investment.monthly)}/month
                </div>
              )}
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
                {proposal.investment?.packageName} Package
              </div>
            </div>

            {/* Why Us */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
              Why {settings.agencyName || 'Principe Consults'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '24px' }}>
              {proposal.whyUs}
            </p>

            {/* Next Steps */}
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--red)', marginBottom: '12px' }}>
              Next Steps
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '24px' }}>
              {proposal.nextSteps}
            </p>

            {/* Footer */}
            <div className="footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)' }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '12px', color: 'var(--text2)' }}>
                  {settings.agencyName || 'Principe Consults'}
                </div>
                <div>{settings.agencyEmail}</div>
                {settings.agencyPhone && <div>{settings.agencyPhone}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Prepared by {settings.ownerName || 'Ryan Principe'}</div>
                <div>Valid until {formatDate(proposal.validUntil)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
