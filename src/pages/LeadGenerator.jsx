import { useState } from 'react';
import { Sparkles, Plus, Check, MapPin, Building2, Hash, Search } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { LoadingSpinner, EmptyState } from '../components/ui';
import { callClaude, LEAD_GEN_SYSTEM_PROMPT, buildLeadGenPrompt } from '../utils/api';
import { BUSINESS_TYPES, DFW_CITIES } from '../utils/formatters';
import { formatPhone } from '../utils/formatters';

export default function LeadGenerator() {
  const settings = useAppStore(s => s.settings);
  const addLead = useAppStore(s => s.addLead);
  const currentUser = useAppStore(s => s.currentUser);
  const addNotification = useAppStore(s => s.addNotification);

  const [businessType, setBusinessType] = useState('Auto Shop');
  const [city, setCity] = useState('McKinney');
  const [count, setCount] = useState(10);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());

  const generate = async () => {
    if (!settings.anthropicApiKey) {
      addNotification('Set your Anthropic API key in Settings first.', 'error');
      return;
    }

    setLoading(true);
    setResults([]);
    setAddedIds(new Set());

    try {
      const prompt = buildLeadGenPrompt(businessType, city, count, notes);
      const responseText = await callClaude(settings.anthropicApiKey, LEAD_GEN_SYSTEM_PROMPT, prompt);
      const leads = JSON.parse(responseText);

      if (!Array.isArray(leads)) throw new Error('Expected array of leads');

      setResults(leads.map((l, i) => ({ ...l, _tempId: `gen_${Date.now()}_${i}` })));
      addNotification(`Generated ${leads.length} leads!`, 'success');
    } catch (err) {
      addNotification(`Lead generation failed: ${err.message}`, 'error');
    }

    setLoading(false);
  };

  const addToLeads = (lead) => {
    addLead({
      businessName: lead.businessName,
      type: lead.type || businessType,
      ownerName: lead.ownerName || '',
      city: lead.city || city,
      phone: lead.phone || '',
      email: lead.email || '',
      hasWebsite: lead.hasWebsite || false,
      websiteUrl: lead.websiteUrl || '',
      rating: lead.rating || 0,
      assignedTo: currentUser.id,
      status: 'New',
      notes: lead.notes || '',
      source: 'AI Lead Gen',
      tierFit: lead.tierFit || 'TBD',
      dealValue: lead.tierFit?.includes('997') ? 997 : lead.tierFit?.includes('2,500') ? 2500 : lead.tierFit?.includes('5,000') ? 5000 : 0,
      followUpDate: null,
    });
    setAddedIds(prev => new Set(prev).add(lead._tempId));
  };

  const addAllLeads = () => {
    let added = 0;
    results.forEach(lead => {
      if (!addedIds.has(lead._tempId)) {
        addToLeads(lead);
        added++;
      }
    });
    addNotification(`Added ${added} leads to your pipeline!`, 'success');
  };

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Generator Controls */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>AI Lead Generator</h3>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
          Generate targeted lead lists using AI. Pick a business type and city, and we'll find businesses that need your services.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Business Type</label>
            <select value={businessType} onChange={e => setBusinessType(e.target.value)}>
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>City / Area</label>
            <select value={city} onChange={e => setCity(e.target.value)}>
              {DFW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Count</label>
            <select value={count} onChange={e => setCount(Number(e.target.value))}>
              {[5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Additional Notes (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. focus on businesses without websites, target high-revenue shops..."
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn-red animate-glow"
            onClick={generate}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <LoadingSpinner size={16} color="white" /> : <Sparkles size={16} />}
            {loading ? 'Generating...' : 'Generate Leads'}
          </button>

          {results.length > 0 && (
            <button
              className="btn-ghost"
              onClick={addAllLeads}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add All to Pipeline
            </button>
          )}

          {results.length > 0 && (
            <span style={{ fontSize: '13px', color: 'var(--text2)', marginLeft: 'auto' }}>
              {results.length} leads generated — {addedIds.size} added
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <LoadingSpinner size={32} />
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '16px' }}>
            AI is researching {businessType.toLowerCase()} businesses in {city}...
          </p>
        </div>
      )}

      {!loading && results.length === 0 && (
        <EmptyState
          icon={Search}
          message="Generate leads above to see results here."
        />
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
          {results.map(lead => {
            const isAdded = addedIds.has(lead._tempId);
            return (
              <div
                key={lead._tempId}
                className="card"
                style={{
                  padding: '16px',
                  opacity: isAdded ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>{lead.businessName}</h4>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text2)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Building2 size={11} /> {lead.type}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={11} /> {lead.city}
                      </span>
                    </div>
                  </div>
                  <button
                    className={isAdded ? 'btn-ghost' : 'btn-red'}
                    onClick={() => !isAdded && addToLeads(lead)}
                    disabled={isAdded}
                    style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isAdded ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add</>}
                  </button>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
                  {lead.ownerName && <div><strong>Owner:</strong> {lead.ownerName}</div>}
                  {lead.phone && <div><strong>Phone:</strong> {formatPhone(lead.phone)}</div>}
                  {lead.email && <div><strong>Email:</strong> {lead.email}</div>}
                  <div><strong>Website:</strong> {lead.hasWebsite ? lead.websiteUrl : 'None'}</div>
                  {lead.rating > 0 && <div><strong>Rating:</strong> {lead.rating}/5</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px',
                    background: lead.tierFit?.includes('Full Stack') ? 'rgba(167,139,250,0.15)' : lead.tierFit?.includes('Growth') ? 'rgba(96,165,250,0.15)' : 'rgba(230,50,40,0.15)',
                    color: lead.tierFit?.includes('Full Stack') ? 'var(--purple)' : lead.tierFit?.includes('Growth') ? 'var(--blue)' : 'var(--red)',
                  }}>
                    {lead.tierFit || 'TBD'}
                  </span>
                </div>

                {lead.notes && (
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>
                    {lead.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
