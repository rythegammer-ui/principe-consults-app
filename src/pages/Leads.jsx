import { useState, useMemo } from 'react';
import { Plus, Upload, Download, Search, Flame, RefreshCw } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import LeadTable from '../components/leads/LeadTable';
import AddLeadModal from '../components/leads/AddLeadModal';
import ImportCSVModal from '../components/leads/ImportCSVModal';
import { EmptyState } from '../components/ui';
import { canSeeAllLeads } from '../utils/permissions';
import { LEAD_STATUSES, BUSINESS_TYPES, DFW_CITIES } from '../utils/formatters';
import { calculateLeadScore } from '../lib/leadScoring';
import { getColdLeads, generateReengagementSequence, markLeadsReengaged } from '../lib/reengagement';
import { exportLeadsCSV, downloadCSV } from '../utils/csv';
import { canAccess } from '../utils/permissions';
import { useIsMobile } from '../utils/hooks';

export default function Leads() {
  const leads = useAppStore(s => s.leads);
  const currentUser = useAppStore(s => s.currentUser);
  const users = useAppStore(s => s.users);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [hotOnly, setHotOnly] = useState(false);
  const isMobile = useIsMobile();

  const visibleLeads = useMemo(() => {
    let filtered = canSeeAllLeads(currentUser?.role) ? leads : leads.filter(l => l.assignedTo === currentUser?.id);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l =>
        (l.businessName || '').toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.ownerName || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus) filtered = filtered.filter(l => l.status === filterStatus);
    if (filterType) filtered = filtered.filter(l => l.type === filterType);
    if (filterCity) filtered = filtered.filter(l => l.city === filterCity);
    if (filterAssigned) filtered = filtered.filter(l => l.assignedTo === filterAssigned);
    if (hotOnly) filtered = filtered.filter(l => calculateLeadScore(l) >= 70);

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score': return calculateLeadScore(b) - calculateLeadScore(a);
        case 'name': return (a.businessName || '').localeCompare(b.businessName || '');
        case 'date': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'status': return LEAD_STATUSES.indexOf(a.status) - LEAD_STATUSES.indexOf(b.status);
        default: return 0;
      }
    });

    return filtered;
  }, [leads, search, filterStatus, filterType, filterCity, filterAssigned, sortBy, currentUser]);

  const handleExport = () => {
    const csv = exportLeadsCSV(visibleLeads);
    downloadCSV(csv, 'leads-export.csv');
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '8px' : '10px', marginBottom: isMobile ? '12px' : '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: isMobile ? '100%' : '320px', width: isMobile ? '100%' : 'auto' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ paddingLeft: '36px', height: '38px' }} />
        </div>

        {!isMobile && (
          <>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', height: '38px', padding: '0 12px' }}>
              <option value="">All Statuses</option>
              {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto', height: '38px', padding: '0 12px' }}>
              <option value="">All Types</option>
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ width: 'auto', height: '38px', padding: '0 12px' }}>
              <option value="">All Cities</option>
              {DFW_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)} style={{ width: 'auto', height: '38px', padding: '0 12px' }}>
              <option value="">All Reps</option>
              {users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto', height: '38px', padding: '0 12px' }}>
              <option value="score">Sort: Score</option>
              <option value="name">Sort: Name</option>
              <option value="date">Sort: Date Added</option>
              <option value="rating">Sort: Rating</option>
              <option value="status">Sort: Status</option>
            </select>

            <button
              onClick={() => setHotOnly(!hotOnly)}
              className={hotOnly ? 'btn-red' : 'btn-ghost'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 14px' }}
            >
              <Flame size={14} /> Hot Leads
            </button>

            {canAccess(currentUser?.role, 'Team') && getColdLeads().length > 0 && (
              <button
                className="btn-ghost"
                onClick={async () => {
                  const cold = getColdLeads();
                  const seq = await generateReengagementSequence(cold);
                  if (seq) {
                    markLeadsReengaged(cold.map(l => l.id));
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 14px', borderColor: 'var(--yellow)', color: 'var(--yellow)' }}
              >
                <RefreshCw size={14} /> Re-engage ({getColdLeads().length})
              </button>
            )}
          </>
        )}

        {isMobile ? (
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: 1, height: '38px', padding: '0 8px', fontSize: '12px' }}>
              <option value="">Status</option>
              {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: 1, height: '38px', padding: '0 8px', fontSize: '12px' }}>
              <option value="score">Score</option>
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="rating">Rating</option>
              <option value="status">Status</option>
            </select>
            <button className="btn-red" onClick={() => setShowAdd(true)} style={{ padding: '8px 14px', fontSize: '12px' }}>
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn-ghost" onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> Import CSV
            </button>
            <button className="btn-ghost" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Export CSV
            </button>
            <button className="btn-red" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} /> Add Lead
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {visibleLeads.length === 0 ? (
        <EmptyState message="No leads found. Add your first lead to get started." action="Add Lead" onAction={() => setShowAdd(true)} />
      ) : (
        <LeadTable leads={visibleLeads} />
      )}

      <AddLeadModal open={showAdd} onClose={() => setShowAdd(false)} />
      <ImportCSVModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
