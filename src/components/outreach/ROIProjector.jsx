import { useState } from 'react';
import useAppStore from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';

export default function ROIProjector({ leadsCount }) {
  const settings = useAppStore(s => s.settings);
  const [inputs, setInputs] = useState({
    leadsInCampaign: leadsCount || 0,
    replyRate: 15,
    bookingRate: 40,
    closeRate: 30,
    avgDealValue: settings.avgDealGrowth || 2500,
  });

  const set = (key, val) => setInputs(i => ({ ...i, [key]: parseFloat(val) || 0 }));

  const expectedReplies = Math.round(inputs.leadsInCampaign * (inputs.replyRate / 100));
  const expectedDemos = Math.round(expectedReplies * (inputs.bookingRate / 100));
  const expectedCloses = Math.round(expectedDemos * (inputs.closeRate / 100));
  const expectedRevenue = expectedCloses * inputs.avgDealValue;

  const labelStyle = { fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>ROI Projector</h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Leads in Campaign</label>
          <input type="number" value={inputs.leadsInCampaign} onChange={e => set('leadsInCampaign', e.target.value)} style={{ height: '34px', fontSize: '13px' }} />
        </div>
        <div>
          <label style={labelStyle}>Reply Rate %</label>
          <input type="number" value={inputs.replyRate} onChange={e => set('replyRate', e.target.value)} style={{ height: '34px', fontSize: '13px' }} />
        </div>
        <div>
          <label style={labelStyle}>Demo Booking Rate %</label>
          <input type="number" value={inputs.bookingRate} onChange={e => set('bookingRate', e.target.value)} style={{ height: '34px', fontSize: '13px' }} />
        </div>
        <div>
          <label style={labelStyle}>Close Rate %</label>
          <input type="number" value={inputs.closeRate} onChange={e => set('closeRate', e.target.value)} style={{ height: '34px', fontSize: '13px' }} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Avg Deal Value</label>
          <input type="number" value={inputs.avgDealValue} onChange={e => set('avgDealValue', e.target.value)} style={{ height: '34px', fontSize: '13px' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Expected Replies', value: expectedReplies, color: 'var(--yellow)' },
          { label: 'Expected Demos', value: expectedDemos, color: 'var(--purple)' },
          { label: 'Expected Closes', value: expectedCloses, color: 'var(--green)' },
          { label: 'Expected Revenue', value: formatCurrency(expectedRevenue), color: 'var(--green)' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: item.color, fontFamily: "'Syne', sans-serif" }}>{item.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
