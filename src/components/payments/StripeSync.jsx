import { useState } from 'react';
import { RefreshCw, ClipboardPaste, Link2, ExternalLink, Copy, Check } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function StripeSync() {
  const addPayment = useAppStore(s => s.addPayment);
  const addNotification = useAppStore(s => s.addNotification);
  const settings = useAppStore(s => s.settings);
  const leads = useAppStore(s => s.leads);
  const [rawData, setRawData] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [showLinkGen, setShowLinkGen] = useState(false);
  const [selectedLead, setSelectedLead] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const curlCommand = `curl https://api.stripe.com/v1/charges?limit=100 -u ${settings.stripeSecretKey || 'sk_live_YOUR_KEY'}: | pbcopy`;

  const parseStripeData = () => {
    try {
      const data = JSON.parse(rawData);
      const charges = data.data || [];
      let imported = 0;
      charges.forEach(charge => {
        if (charge.status === 'succeeded' || charge.status === 'failed') {
          addPayment({
            leadId: null,
            businessName: charge.metadata?.client || charge.description || 'Stripe Charge',
            amount: charge.amount / 100,
            type: 'one-time',
            tier: 'Custom',
            status: charge.status === 'succeeded' ? 'paid' : 'failed',
            date: new Date(charge.created * 1000).toISOString().slice(0, 10),
            method: 'stripe',
            stripeId: charge.id,
            notes: `Imported from Stripe — ${charge.description || ''}`,
          });
          imported++;
        }
      });
      addNotification(`Imported ${imported} payments from Stripe`, 'success');
      setRawData('');
      setShowPaste(false);
    } catch {
      addNotification('Failed to parse Stripe data. Make sure it is valid JSON.', 'error');
    }
  };

  const generatePaymentLink = () => {
    const base = settings.stripePaymentLinkBase;
    if (!base) {
      addNotification('Set your Stripe Payment Link base URL in Settings first.', 'error');
      return;
    }
    const lead = leads.find(l => l.id === selectedLead);
    const params = new URLSearchParams();
    if (linkAmount) params.set('line_items[0][price_data][unit_amount]', Math.round(parseFloat(linkAmount) * 100));
    if (lead) params.set('client_reference_id', lead.id);
    if (linkDescription) params.set('line_items[0][price_data][product_data][name]', linkDescription);

    const link = params.toString() ? `${base}?${params.toString()}` : base;
    setGeneratedLink(link);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      addNotification('Payment link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Stripe Integration</h4>

      {/* Payment Link Generator */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            className={showLinkGen ? 'btn-red' : 'btn-ghost'}
            onClick={() => { setShowLinkGen(!showLinkGen); setShowPaste(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Link2 size={14} /> Generate Payment Link
          </button>
          <button
            className={showPaste ? 'btn-red' : 'btn-ghost'}
            onClick={() => { setShowPaste(!showPaste); setShowLinkGen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ClipboardPaste size={14} /> Import Stripe Data
          </button>
        </div>

        {showLinkGen && (
          <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
              Generate a Stripe payment link to send to a client. They can pay directly via credit card.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Client (optional)</label>
                <select value={selectedLead} onChange={e => {
                  setSelectedLead(e.target.value);
                  const lead = leads.find(l => l.id === e.target.value);
                  if (lead) setLinkDescription(`${lead.tierFit || 'Web Services'} — ${lead.businessName}`);
                }}>
                  <option value="">— Select a lead —</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Amount ($)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={linkAmount}
                  onChange={e => setLinkAmount(e.target.value)}
                  placeholder="997"
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Description</label>
              <input
                value={linkDescription}
                onChange={e => setLinkDescription(e.target.value)}
                placeholder="e.g. Growth Engine — Eagle Auto & Tire"
              />
            </div>

            <button className="btn-red" onClick={generatePaymentLink} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Link2 size={14} /> Generate Link
            </button>

            {generatedLink && (
              <div style={{ background: 'var(--surface)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ flex: 1, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--blue)', wordBreak: 'break-all' }}>
                  {generatedLink}
                </code>
                <button className="btn-ghost" onClick={copyLink} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={14} /> Open
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Stripe Data */}
      {showPaste && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
            Run this in your terminal to pull Stripe data, then paste the JSON below:
          </p>
          <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <code style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)', wordBreak: 'break-all' }}>
              {curlCommand}
            </code>
          </div>
          <textarea
            rows={6}
            value={rawData}
            onChange={e => setRawData(e.target.value)}
            placeholder='Paste the JSON response from Stripe here...'
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', marginBottom: '10px' }}
          />
          <button className="btn-red" onClick={parseStripeData} disabled={!rawData.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Parse & Import
          </button>
        </div>
      )}

      {/* Payment Link Base Display */}
      <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>
          {settings.stripePaymentLinkBase ? 'Payment Link Base:' : 'No payment link base set — configure in Settings'}
        </p>
        {settings.stripePaymentLinkBase && (
          <code style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--blue)' }}>
            {settings.stripePaymentLinkBase}
          </code>
        )}
      </div>
    </div>
  );
}
