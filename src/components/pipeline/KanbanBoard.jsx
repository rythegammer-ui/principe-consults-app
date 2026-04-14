import { useState, useMemo } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import useAppStore from '../../store/useAppStore';
import KanbanCard from './KanbanCard';
import LeadDetailPanel from '../leads/LeadDetailPanel';
import { LEAD_STATUSES, STATUS_COLORS, formatCurrency } from '../../utils/formatters';
import { canSeeAllLeads } from '../../utils/permissions';
import { useIsMobile } from '../../utils/hooks';

const COLUMN_COLORS = {
  'New': 'var(--blue)',
  'Contacted': 'var(--yellow)',
  'Replied': 'var(--purple)',
  'Demo Scheduled': 'var(--orange)',
  'Demo Completed': 'var(--teal)',
  'Proposal Sent': 'var(--indigo)',
  'Closed Won': 'var(--green)',
  'Dead': 'var(--muted)',
};

export default function KanbanBoard() {
  const leads = useAppStore(s => s.leads);
  const currentUser = useAppStore(s => s.currentUser);
  const moveLeadStatus = useAppStore(s => s.moveLeadStatus);
  const addNotification = useAppStore(s => s.addNotification);
  const [selectedLead, setSelectedLead] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const isMobile = useIsMobile();

  const visibleLeads = useMemo(() => {
    return canSeeAllLeads(currentUser?.role)
      ? leads
      : leads.filter(l => l.assignedTo === currentUser?.id);
  }, [leads, currentUser?.role, currentUser?.id]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const leadId = result.draggableId;
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status !== newStatus) {
      moveLeadStatus(leadId, newStatus);
      addNotification(`"${lead.businessName}" moved to ${newStatus}`, 'success');
      if (newStatus === 'Closed Won') {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 2000);
      }
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '12px',
          overflowX: isMobile ? 'visible' : 'auto',
          paddingBottom: '16px',
          minHeight: isMobile ? 'auto' : 'calc(100vh - 160px)',
        }}>
          {LEAD_STATUSES.map(status => {
            const columnLeads = visibleLeads.filter(l => l.status === status);
            const color = COLUMN_COLORS[status];
            const closedTotal = status === 'Closed Won' ? columnLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0) : 0;

            return (
              <div key={status} style={{ minWidth: isMobile ? 'auto' : '260px', width: isMobile ? '100%' : '260px', flexShrink: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', marginBottom: '8px',
                  borderBottom: `2px solid ${color}`,
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color }}>{status}</span>
                  <span style={{
                    background: color, color: '#000', padding: '2px 8px', borderRadius: '10px',
                    fontSize: '11px', fontWeight: 700,
                  }}>
                    {columnLeads.length}
                  </span>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '100px',
                        padding: '4px',
                        borderRadius: '8px',
                        background: snapshot.isDraggingOver ? 'var(--surface2)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      {columnLeads.map((lead, idx) => (
                        <KanbanCard key={lead.id} lead={lead} index={idx} onClick={() => setSelectedLead(lead.id)} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {status === 'Closed Won' && closedTotal > 0 && (
                  <div style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 700, color: 'var(--green)', textAlign: 'center', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
                    Total: {formatCurrency(closedTotal)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {confetti && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 200 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: ['var(--green)', 'var(--yellow)', 'var(--red)', 'var(--blue)'][i % 4],
                left: `${Math.cos(i * 30 * Math.PI / 180) * 60}px`,
                top: `${Math.sin(i * 30 * Math.PI / 180) * 60}px`,
                animation: 'confetti 1s ease-out forwards',
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      {selectedLead && <LeadDetailPanel leadId={selectedLead} onClose={() => setSelectedLead(null)} />}
    </>
  );
}
