const STAGES = [
  { label: 'Queued', color: 'var(--muted)' },
  { label: 'Pulling Data', color: 'var(--yellow)' },
  { label: 'AI Writing', color: 'var(--blue)' },
  { label: 'Message Ready', color: 'var(--purple)' },
  { label: 'Sequence Active', color: 'var(--red)' },
  { label: 'Demo Booked', color: 'var(--green)' },
];

export default function PipelineStrip({ leads }) {
  const counts = {};
  STAGES.forEach(s => { counts[s.label] = 0; });
  leads.forEach(l => {
    const stage = l.outreachStage || 'Queued';
    if (counts[stage] !== undefined) counts[stage]++;
  });

  return (
    <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
      {STAGES.map(stage => (
        <div
          key={stage.label}
          style={{
            flex: 1,
            padding: '12px',
            background: 'var(--surface)',
            borderBottom: `3px solid ${stage.color}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Syne', sans-serif", color: stage.color }}>
            {counts[stage.label]}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{stage.label}</div>
        </div>
      ))}
    </div>
  );
}
