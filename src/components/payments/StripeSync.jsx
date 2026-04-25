import { useState } from 'react';
import { RefreshCw, ClipboardPaste } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function StripeSync() {
  const addPayment = useAppStore(s => s.addPayment);
  const addNotification = useAppStore(s => s.addNotification);
  const secrets = useAppStore(s => s.secrets);
  const currentUser = useAppStore(s => s.currentUser);
  const [rawData, setRawData] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  // The Stripe secret key is admin-only. Reps see the import section without
  // the curl example so they can still paste data an admin pulled for them.
  const isAdmin = currentUser?.role === 'admin';
  const stripeSecretKey = secrets?.stripeSecretKey || '';
  const curlCommand = `curl https://api.stripe.com/v1/charges?limit=100 -u ${stripeSecretKey || 'sk_live_YOUR_KEY'}: | pbcopy`;

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

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Stripe Import</h4>
      <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
        Pull a snapshot of charges from Stripe and import them as payments. To
        send live payment links to clients, set the per-tier Payment Link URLs
        in Settings → Integrations.
      </p>

      <div style={{ marginBottom: '12px' }}>
        <button
          className={showPaste ? 'btn-red' : 'btn-ghost'}
          onClick={() => setShowPaste(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ClipboardPaste size={14} /> {showPaste ? 'Cancel Import' : 'Import Stripe Data'}
        </button>
      </div>

      {showPaste && (
        <div>
          {isAdmin && (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
                Run this in your terminal to pull Stripe data, then paste the JSON below:
              </p>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <code style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)', wordBreak: 'break-all' }}>
                  {curlCommand}
                </code>
              </div>
            </>
          )}
          {!isAdmin && (
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
              Paste a JSON snapshot of Stripe charges below to import them as payments.
            </p>
          )}
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
    </div>
  );
}
