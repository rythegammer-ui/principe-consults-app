import { useState, useEffect } from 'react';
import { Eye, EyeOff, Cloud, Upload, Download, Copy, Check, Users, Settings2, CreditCard, Zap, Bell } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { ConfirmDialog } from '../components/ui';

const TABS = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'packages', label: 'Packages', icon: CreditCard },
  { id: 'automation', label: 'Automation', icon: Bell },
];

export default function Settings() {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const resetSettings = useAppStore(s => s.resetSettings);
  const clearAllData = useAppStore(s => s.clearAllData);
  const firebaseConnected = useAppStore(s => s.firebaseConnected);
  const seedFirebase = useAppStore(s => s.seedFirebase);
  const pullFromFirebase = useAppStore(s => s.pullFromFirebase);
  const getInviteCode = useAppStore(s => s.getInviteCode);
  const currentUser = useAppStore(s => s.currentUser);

  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({ ...settings });
  const [showKeys, setShowKeys] = useState({});
  const [showReset, setShowReset] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      getInviteCode().then(code => { if (code) setInviteCode(code); });
    }
  }, [currentUser]);

  // Sync form when settings change externally (Firebase sync)
  useEffect(() => { setForm(f => ({ ...settings, ...f })); }, [settings]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleKey = (key) => setShowKeys(s => ({ ...s, [key]: !s[key] }));

  const handleSave = () => updateSettings(form);

  const sectionStyle = { marginBottom: '32px' };
  const titleStyle = { fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' };
  const fieldStyle = { marginBottom: '14px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const hintStyle = { fontSize: '11px', color: 'var(--muted)', marginTop: '4px' };

  const SecretField = ({ label, field, placeholder }) => (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={showKeys[field] ? 'text' : 'password'}
          value={form[field] || ''}
          onChange={e => set(field, e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: '44px', fontFamily: "'JetBrains Mono', monospace" }}
        />
        <button onClick={() => toggleKey(field)}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
          {showKeys[field] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '750px', animation: 'fadeIn 0.3s ease-out' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', fontSize: '13px', fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--red)' : 'var(--text2)',
              background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid var(--red)' : '2px solid transparent',
              cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
              transition: 'all 0.2s', marginBottom: '-1px',
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ GENERAL TAB ═══════════════ */}
      {tab === 'general' && (
        <>
          {/* Agency Info */}
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Agency Info</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Agency Name</label>
                <input value={form.agencyName || ''} onChange={e => set('agencyName', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Owner Name</label>
                <input value={form.ownerName || ''} onChange={e => set('ownerName', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Default City</label>
                <input value={form.defaultCity || ''} onChange={e => set('defaultCity', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Agency Phone</label>
                <input value={form.agencyPhone || ''} onChange={e => set('agencyPhone', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Agency Email</label>
                <input value={form.agencyEmail || ''} onChange={e => set('agencyEmail', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Invite Code */}
          {currentUser?.role === 'admin' && inviteCode && (
            <div style={sectionStyle}>
              <h3 style={titleStyle}>
                <Users size={16} style={{ marginRight: '6px', display: 'inline', color: 'var(--red)' }} />
                Team Invite Code
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
                Share this code with your sales reps so they can sign up and join your agency.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{
                  background: 'var(--surface2)', border: '2px dashed var(--red)', borderRadius: '10px',
                  padding: '12px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px',
                  fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all', maxWidth: '100%',
                }}>
                  {inviteCode}
                </div>
                <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(inviteCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {codeCopied ? <><Check size={14} style={{ color: 'var(--green)' }} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </div>
          )}

          {/* Booking & Links */}
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Booking & Links</h3>
            <div style={fieldStyle}>
              <label style={labelStyle}>Calendar Booking Link</label>
              <input value={form.bookingLink || ''} onChange={e => set('bookingLink', e.target.value)} placeholder="https://calendly.com/you or GHL booking link" />
              <p style={hintStyle}>Sent to leads when they book a demo</p>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Client Intake Form URL</label>
              <input value={form.clientIntakeFormUrl || ''} onChange={e => set('clientIntakeFormUrl', e.target.value)} placeholder="https://forms.google.com/..." />
              <p style={hintStyle}>Sent to new clients after closing — collects logo, brand info, etc.</p>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Digest Email Recipients</label>
              <input value={form.digestEmailRecipients || ''} onChange={e => set('digestEmailRecipients', e.target.value)} placeholder="ryan@principeconsults.com, admin@example.com" />
              <p style={hintStyle}>Comma-separated emails for daily/weekly digest reports</p>
            </div>
          </div>

          {/* Cloud Sync */}
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <Cloud size={16} style={{ color: firebaseConnected ? 'var(--green)' : 'var(--muted)', marginRight: '6px', display: 'inline' }} />
              Cloud Sync
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
              {firebaseConnected
                ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>Connected & syncing in real-time</span>
                : <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Connecting...</span>
              }
            </p>
            {firebaseConnected && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn-ghost" onClick={seedFirebase} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={14} /> Push to Cloud
                </button>
                <button className="btn-ghost" onClick={pullFromFirebase} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> Pull from Cloud
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ INTEGRATIONS TAB ═══════════════ */}
      {tab === 'integrations' && (
        <>
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Anthropic (AI)</h3>
            <SecretField label="Anthropic API Key" field="anthropicApiKey" placeholder="sk-ant-..." />
            <p style={hintStyle}>Powers AI lead generation, outreach sequences, and proposals</p>
          </div>

          <div style={sectionStyle}>
            <h3 style={titleStyle}>Stripe (Payments)</h3>
            <SecretField label="Stripe Secret Key" field="stripeSecretKey" placeholder="sk_live_..." />
            <SecretField label="Stripe Webhook Secret" field="stripeWebhookSecret" placeholder="whsec_..." />
            <div style={fieldStyle}>
              <label style={labelStyle}>Launchpad Payment Link ($997)</label>
              <input value={form.stripeLaunchpadUrl || ''} onChange={e => set('stripeLaunchpadUrl', e.target.value)} placeholder="https://buy.stripe.com/..." style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Growth Engine Payment Link ($2,500 + $500/mo)</label>
              <input value={form.stripeGrowthUrl || ''} onChange={e => set('stripeGrowthUrl', e.target.value)} placeholder="https://buy.stripe.com/..." style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Stack Payment Link ($5,000 + $1,000/mo)</label>
              <input value={form.stripeFullStackUrl || ''} onChange={e => set('stripeFullStackUrl', e.target.value)} placeholder="https://buy.stripe.com/..." style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
            <p style={hintStyle}>Create payment links in Stripe Dashboard → Products → Payment Links, then paste URLs here</p>
          </div>

          <div style={sectionStyle}>
            <h3 style={titleStyle}>GoHighLevel (CRM)</h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
              Send SMS/email, sync contacts, trigger workflows directly from the console.
            </p>
            <SecretField label="GHL API Key" field="ghlApiKey" placeholder="eyJhbGciOi..." />
            <div style={fieldStyle}>
              <label style={labelStyle}>GHL Location ID</label>
              <input value={form.ghlLocationId || ''} onChange={e => set('ghlLocationId', e.target.value)} placeholder="ve9EPM428h8vShlRW1KT" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>GHL Workflow IDs</label>
              <input value={form.ghlWorkflows || ''} onChange={e => set('ghlWorkflows', e.target.value)} placeholder="workflow_id_1:Follow-Up, workflow_id_2:Review Request" />
              <p style={hintStyle}>Format: id:Label, id:Label</p>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={titleStyle}>SendGrid (Email)</h3>
            <SecretField label="SendGrid API Key" field="sendgridApiKey" placeholder="SG...." />
            <p style={hintStyle}>Used for digest emails and transactional emails. Optional — falls back to GHL for sending.</p>
          </div>
        </>
      )}

      {/* ═══════════════ PACKAGES TAB ═══════════════ */}
      {tab === 'packages' && (
        <>
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Package Pricing</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Launchpad (one-time)</label>
                <input type="number" value={form.avgDealLaunchpad} onChange={e => set('avgDealLaunchpad', parseInt(e.target.value) || 0)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Growth Engine (one-time)</label>
                <input type="number" value={form.avgDealGrowth} onChange={e => set('avgDealGrowth', parseInt(e.target.value) || 0)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Full Stack (one-time)</label>
                <input type="number" value={form.avgDealFullStack} onChange={e => set('avgDealFullStack', parseInt(e.target.value) || 0)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Growth Monthly Retainer</label>
                <input type="number" value={form.retainerGrowth} onChange={e => set('retainerGrowth', parseInt(e.target.value) || 0)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Full Stack Monthly Retainer</label>
                <input type="number" value={form.retainerFullStack} onChange={e => set('retainerFullStack', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={titleStyle}>Commission Rates</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Demo Shown (flat $)</label>
                <input type="number" value={form.commissionDemo} onChange={e => set('commissionDemo', parseInt(e.target.value) || 0)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Launchpad Close ($)</label>
                <input type="number" value={form.commissionLaunchpad} onChange={e => set('commissionLaunchpad', parseInt(e.target.value) || 0)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Growth Engine Close ($)</label>
                <input type="number" value={form.commissionGrowth} onChange={e => set('commissionGrowth', parseInt(e.target.value) || 0)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Full Stack Close ($)</label>
                <input type="number" value={form.commissionFullStack} onChange={e => set('commissionFullStack', parseInt(e.target.value) || 0)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Retainer Recurring %</label>
                <input type="number" value={form.commissionRetainerPct} onChange={e => set('commissionRetainerPct', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ AUTOMATION TAB ═══════════════ */}
      {tab === 'automation' && (
        <>
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Lead Thresholds</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Days before "Stale" flag</label>
                <input type="number" value={form.staleDays || 7} onChange={e => set('staleDays', parseInt(e.target.value) || 7)} />
                <p style={hintStyle}>No pipeline movement = stale</p>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Days before "Cold" (re-engage)</label>
                <input type="number" value={form.coldDays || 14} onChange={e => set('coldDays', parseInt(e.target.value) || 14)} />
                <p style={hintStyle}>No activity = eligible for re-engagement</p>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Payment link overdue (hours)</label>
                <input type="number" value={form.overdueHours || 72} onChange={e => set('overdueHours', parseInt(e.target.value) || 72)} />
                <p style={hintStyle}>Sent but not paid = overdue</p>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={titleStyle}>Lead Score Cutoffs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>"Hot" Lead Score (min)</label>
                <input type="number" value={form.hotScoreCutoff || 70} onChange={e => set('hotScoreCutoff', parseInt(e.target.value) || 70)} />
                <p style={hintStyle}>Red badge, top priority</p>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>"Warm" Lead Score (min)</label>
                <input type="number" value={form.warmScoreCutoff || 40} onChange={e => set('warmScoreCutoff', parseInt(e.target.value) || 40)} />
                <p style={hintStyle}>Amber badge, active follow-up</p>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={titleStyle}>Pipeline Automation</h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
              These automations fire when leads move through pipeline stages.
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              {[
                { label: 'New → Contacted', desc: 'Start email sequence, notify rep' },
                { label: 'Contacted → Demo', desc: 'Pause sequences, send booking link' },
                { label: 'Demo → Closed Won', desc: 'Stop sequences, fire onboarding, log deal' },
                { label: 'Stale (no movement)', desc: 'Auto-flag, notify rep & admin' },
                { label: 'Payment link overdue', desc: 'Flag in Revenue, add to digest' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface2)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{item.desc}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>Active</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ SAVE BAR ═══════════════ */}
      <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px', flexWrap: 'wrap' }}>
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
