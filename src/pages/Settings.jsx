import { useState } from 'react';
import { Eye, EyeOff, Cloud, Upload, Download } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { ConfirmDialog } from '../components/ui';

export default function Settings() {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const resetSettings = useAppStore(s => s.resetSettings);
  const clearAllData = useAppStore(s => s.clearAllData);
  const firebaseConnected = useAppStore(s => s.firebaseConnected);
  const seedFirebase = useAppStore(s => s.seedFirebase);
  const pullFromFirebase = useAppStore(s => s.pullFromFirebase);
  const [form, setForm] = useState({ ...settings });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [showGhlKey, setShowGhlKey] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showClear, setShowClear] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    updateSettings(form);
  };

  const sectionStyle = { marginBottom: '32px' };
  const sectionTitleStyle = { fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' };
  const fieldStyle = { marginBottom: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ maxWidth: '700px', animation: 'fadeIn 0.3s ease-out' }}>
      {/* Agency Info */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Agency Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Agency Name</label>
            <input value={form.agencyName} onChange={e => set('agencyName', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Owner Name</label>
            <input value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Default City</label>
            <input value={form.defaultCity} onChange={e => set('defaultCity', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Agency Phone</label>
            <input value={form.agencyPhone} onChange={e => set('agencyPhone', e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Agency Email</label>
            <input value={form.agencyEmail} onChange={e => set('agencyEmail', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Deal Settings */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Deal Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Avg Deal — Launchpad</label>
            <input type="number" value={form.avgDealLaunchpad} onChange={e => set('avgDealLaunchpad', parseInt(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Avg Deal — Growth Engine</label>
            <input type="number" value={form.avgDealGrowth} onChange={e => set('avgDealGrowth', parseInt(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Avg Deal — Full Stack</label>
            <input type="number" value={form.avgDealFullStack} onChange={e => set('avgDealFullStack', parseInt(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Monthly Retainer — Growth</label>
            <input type="number" value={form.retainerGrowth} onChange={e => set('retainerGrowth', parseInt(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Monthly Retainer — Full Stack</label>
            <input type="number" value={form.retainerFullStack} onChange={e => set('retainerFullStack', parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      {/* Booking */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Booking</h3>
        <div style={fieldStyle}>
          <label style={labelStyle}>Booking Link</label>
          <input value={form.bookingLink} onChange={e => set('bookingLink', e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Calendar Name</label>
          <input value={form.calendarName} onChange={e => set('calendarName', e.target.value)} />
        </div>
      </div>

      {/* Integrations */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Integrations</h3>
        <div style={fieldStyle}>
          <label style={labelStyle}>Anthropic API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={form.anthropicApiKey}
              onChange={e => set('anthropicApiKey', e.target.value)}
              placeholder="sk-ant-..."
              style={{ paddingRight: '44px', fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Stripe Secret Key</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showStripeKey ? 'text' : 'password'}
              value={form.stripeSecretKey}
              onChange={e => set('stripeSecretKey', e.target.value)}
              placeholder="sk_live_..."
              style={{ paddingRight: '44px', fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button
              onClick={() => setShowStripeKey(!showStripeKey)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}
            >
              {showStripeKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Stripe Payment Link Base URL</label>
          <input value={form.stripePaymentLinkBase} onChange={e => set('stripePaymentLinkBase', e.target.value)} placeholder="https://buy.stripe.com/xxxx" />
        </div>
      </div>

      {/* GoHighLevel */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>GoHighLevel (GHL)</h3>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
          Connect your GHL sub-account to send SMS/email directly from the console and view conversation history.
        </p>
        <div style={fieldStyle}>
          <label style={labelStyle}>GHL API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showGhlKey ? 'text' : 'password'}
              value={form.ghlApiKey || ''}
              onChange={e => set('ghlApiKey', e.target.value)}
              placeholder="eyJhbGciOi..."
              style={{ paddingRight: '44px', fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button
              onClick={() => setShowGhlKey(!showGhlKey)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}
            >
              {showGhlKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Settings &gt; Business Profile &gt; API Keys in your GHL sub-account
          </p>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>GHL Location ID</label>
          <input
            value={form.ghlLocationId || ''}
            onChange={e => set('ghlLocationId', e.target.value)}
            placeholder="ve9EPM428h8vShlRW1KT"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>GHL Workflow IDs (comma-separated)</label>
          <input
            value={form.ghlWorkflows || ''}
            onChange={e => set('ghlWorkflows', e.target.value)}
            placeholder="workflow_id_1:Follow-Up Sequence, workflow_id_2:Review Request"
          />
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Format: id:Label, id:Label — find workflow IDs in GHL Automation settings
          </p>
        </div>
      </div>

      {/* Cloud Sync Status */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <Cloud size={18} style={{ color: firebaseConnected ? 'var(--green)' : 'var(--muted)', marginRight: '8px', display: 'inline' }} />
          Cloud Sync
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
          Your data syncs in real-time across all devices.
          {firebaseConnected
            ? <span style={{ color: 'var(--green)', fontWeight: 600 }}> Connected & syncing</span>
            : <span style={{ color: 'var(--yellow)', fontWeight: 600 }}> Connecting...</span>
          }
        </p>
        {firebaseConnected && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={seedFirebase} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> Push Data to Cloud
            </button>
            <button className="btn-ghost" onClick={pullFromFirebase} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Pull Data from Cloud
            </button>
          </div>
        )}
      </div>

      {/* Commission Rates */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Commission Rates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Demo Shown (flat)</label>
            <input type="number" value={form.commissionDemo} onChange={e => set('commissionDemo', parseInt(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Launchpad Commission</label>
            <input type="number" value={form.commissionLaunchpad} onChange={e => set('commissionLaunchpad', parseInt(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Growth Engine Commission</label>
            <input type="number" value={form.commissionGrowth} onChange={e => set('commissionGrowth', parseInt(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Full Stack Commission</label>
            <input type="number" value={form.commissionFullStack} onChange={e => set('commissionFullStack', parseInt(e.target.value) || 0)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Retainer Recurring %</label>
            <input type="number" value={form.commissionRetainerPct} onChange={e => set('commissionRetainerPct', parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <button className="btn-red" onClick={handleSave}>Save Settings</button>
        <button className="btn-ghost" onClick={() => setShowReset(true)}>Reset to Defaults</button>
        <button className="btn-ghost" onClick={() => setShowClear(true)} style={{ color: 'var(--red)', borderColor: 'var(--red-dim)' }}>
          Clear All Data
        </button>
      </div>

      <ConfirmDialog
        open={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={() => { resetSettings(); setForm({ ...useAppStore.getState().settings }); }}
        title="Reset Settings"
        message="This will reset all settings to their default values. Your leads, calls, and other data will not be affected."
      />

      <ConfirmDialog
        open={showClear}
        onClose={() => setShowClear(false)}
        onConfirm={() => { clearAllData(); window.location.reload(); }}
        title="Clear All Data"
        message="This will permanently delete ALL data including leads, calls, payments, and settings. This cannot be undone."
      />
    </div>
  );
}
