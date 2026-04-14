import { useState, useMemo, useRef, useEffect } from 'react';
import { Zap, Filter } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import OutreachCard from '../components/outreach/OutreachCard';
import PipelineStrip from '../components/outreach/PipelineStrip';
import ROIProjector from '../components/outreach/ROIProjector';
import { EmptyState, LoadingSpinner } from '../components/ui';
import { callClaude, OUTREACH_SYSTEM_PROMPT, buildOutreachPrompt } from '../utils/api';
import { useIsMobile } from '../utils/hooks';

export default function AIOutreach() {
  const leads = useAppStore(s => s.leads);
  const settings = useAppStore(s => s.settings);
  const updateLead = useAppStore(s => s.updateLead);
  const addActivity = useAppStore(s => s.addActivity);
  const addNotification = useAppStore(s => s.addNotification);
  const currentUser = useAppStore(s => s.currentUser);
  const [filter, setFilter] = useState('All');
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);
  const isMobile = useIsMobile();

  const outreachLeads = useMemo(() => {
    return leads.filter(l => {
      if (filter === 'Queued') return !l.outreachStage || l.outreachStage === 'Queued';
      if (filter === 'Active') return l.outreachStage === 'Sequence Active';
      if (filter === 'Done') return l.outreachStage === 'Demo Booked' || l.outreachStage === 'Message Ready';
      return true;
    });
  }, [leads, filter]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = (text, color = 'var(--text2)') => {
    setLogs(prev => [...prev, { text, color, time: new Date().toLocaleTimeString() }]);
  };

  const generateForLead = async (lead) => {
    if (!settings.anthropicApiKey) {
      addNotification('Set your Anthropic API key in Settings first.', 'error');
      return;
    }

    setGeneratingIds(prev => new Set(prev).add(lead.id));
    addLog(`Pulling data for ${lead.businessName}...`, 'var(--yellow)');
    updateLead(lead.id, { outreachStage: 'Pulling Data' });

    await new Promise(r => setTimeout(r, 500));
    addLog(`AI writing messages for ${lead.businessName}...`, 'var(--blue)');
    updateLead(lead.id, { outreachStage: 'AI Writing' });

    try {
      const prompt = buildOutreachPrompt(lead);
      const responseText = await callClaude(settings.anthropicApiKey, OUTREACH_SYSTEM_PROMPT, prompt);
      const messages = JSON.parse(responseText);

      updateLead(lead.id, {
        outreachMessages: messages,
        outreachStage: 'Message Ready',
      });
      addLog(`Messages ready for ${lead.businessName}`, 'var(--purple)');
      addActivity(`Outreach messages generated for "${lead.businessName}"`, 'outreach', currentUser?.id, lead.id);

      // Auto-advance to Sequence Active
      setTimeout(() => {
        updateLead(lead.id, { outreachStage: 'Sequence Active' });
        addLog(`Sequence activated for ${lead.businessName}`, 'var(--red)');
      }, 1000);

    } catch (err) {
      addLog(`Error for ${lead.businessName}: ${err.message}`, 'var(--red)');
      addNotification(`Outreach failed for ${lead.businessName}: ${err.message}`, 'error');
      updateLead(lead.id, { outreachStage: 'Queued' });
    }

    setGeneratingIds(prev => {
      const next = new Set(prev);
      next.delete(lead.id);
      return next;
    });
  };

  const launchCampaign = async () => {
    const queued = leads.filter(l => !l.outreachStage || l.outreachStage === 'Queued');
    if (queued.length === 0) {
      addNotification('No queued leads to process.', 'warning');
      return;
    }
    addLog(`Launching campaign for ${queued.length} leads...`, 'var(--red)');
    for (const lead of queued) {
      await generateForLead(lead);
    }
    addLog('Campaign complete!', 'var(--green)');
    addNotification('Campaign complete!', 'success');
  };

  const runSelected = async () => {
    const selected = leads.filter(l => selectedIds.has(l.id));
    for (const lead of selected) {
      await generateForLead(lead);
    }
    setSelectedIds(new Set());
  };

  const isRunning = generatingIds.size > 0;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <button
          className="btn-red animate-glow"
          onClick={launchCampaign}
          disabled={isRunning}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isRunning ? <LoadingSpinner size={16} color="white" /> : <Zap size={16} />}
          {isRunning ? 'Running...' : 'Launch Campaign'}
        </button>

        {selectedIds.size > 0 && (
          <button className="btn-ghost" onClick={runSelected} disabled={isRunning}>
            Run Selected ({selectedIds.size})
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {['All', 'Queued', 'Active', 'Done'].map(f => (
            <button
              key={f}
              className={f === filter ? 'btn-red' : 'btn-ghost'}
              onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', fontSize: '13px' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Strip */}
      <PipelineStrip leads={leads} />

      {/* Main content + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '16px' }}>
        {/* Lead Cards */}
        <div>
          {outreachLeads.length === 0 ? (
            <EmptyState message="No leads in outreach. Add leads and queue them for outreach." />
          ) : (
            outreachLeads.map(lead => (
              <div key={lead.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(lead.id)}
                  onChange={() => {
                    setSelectedIds(prev => {
                      const next = new Set(prev);
                      if (next.has(lead.id)) next.delete(lead.id); else next.add(lead.id);
                      return next;
                    });
                  }}
                  style={{ marginTop: '20px', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <OutreachCard
                    lead={lead}
                    generating={generatingIds.has(lead.id)}
                    onGenerateOne={generateForLead}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          {/* Activity Log */}
          <div className="card" style={{ padding: '16px', marginBottom: '16px', maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Activity Log
            </h4>
            <div ref={logRef} style={{ flex: 1, overflowY: 'auto', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
              {logs.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>Waiting for campaign launch...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: '6px', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{log.time}</span>
                    <span style={{ color: log.color }}>{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ROI Projector */}
          <ROIProjector leadsCount={leads.filter(l => !l.outreachStage || l.outreachStage === 'Queued').length} />
        </div>
      </div>
    </div>
  );
}
