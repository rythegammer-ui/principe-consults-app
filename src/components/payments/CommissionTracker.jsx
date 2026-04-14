import useAppStore from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';

export default function CommissionTracker() {
  const users = useAppStore(s => s.users);
  const leads = useAppStore(s => s.leads);
  const callLogs = useAppStore(s => s.callLogs);
  const payments = useAppStore(s => s.payments);
  const settings = useAppStore(s => s.settings);

  const reps = users.filter(u => u.role === 'rep' || u.role === 'manager');

  const getRepData = (rep) => {
    const repLeads = leads.filter(l => l.assignedTo === rep.id);
    const demosShown = repLeads.filter(l => ['Demo Completed', 'Proposal Sent', 'Closed Won'].includes(l.status)).length;
    const closedLeads = repLeads.filter(l => l.status === 'Closed Won');

    const launchpadCloses = closedLeads.filter(l => l.tierFit?.includes('Launchpad')).length;
    const growthCloses = closedLeads.filter(l => l.tierFit?.includes('Growth')).length;
    const fullStackCloses = closedLeads.filter(l => l.tierFit?.includes('Full Stack')).length;

    const demoCommission = demosShown * (settings.commissionDemo || 50);
    const launchpadCommission = launchpadCloses * (settings.commissionLaunchpad || 150);
    const growthCommission = growthCloses * (settings.commissionGrowth || 300);
    const fullStackCommission = fullStackCloses * (settings.commissionFullStack || 500);

    // Recurring commission from retainers
    const recurringPaid = payments.filter(p => p.type === 'recurring' && p.status === 'paid');
    const repRecurring = recurringPaid.filter(p => {
      const lead = leads.find(l => l.id === p.leadId);
      return lead?.assignedTo === rep.id;
    });
    const recurringCommission = repRecurring.reduce((sum, p) => sum + (p.amount * (settings.commissionRetainerPct || 15) / 100), 0);

    const total = demoCommission + launchpadCommission + growthCommission + fullStackCommission + recurringCommission;

    return {
      demosShown,
      launchpadCloses,
      growthCloses,
      fullStackCloses,
      recurringCommission,
      total,
    };
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Commission Tracker</h4>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Rep</th>
              <th>Demos (x${settings.commissionDemo || 50})</th>
              <th>Launchpad (x${settings.commissionLaunchpad || 150})</th>
              <th>Growth (x${settings.commissionGrowth || 300})</th>
              <th>Full Stack (x${settings.commissionFullStack || 500})</th>
              <th>Recurring</th>
              <th>Total Earned</th>
            </tr>
          </thead>
          <tbody>
            {reps.map(rep => {
              const data = getRepData(rep);
              return (
                <tr key={rep.id}>
                  <td style={{ fontWeight: 600 }}>{rep.name}</td>
                  <td>{data.demosShown}</td>
                  <td>{data.launchpadCloses}</td>
                  <td>{data.growthCloses}</td>
                  <td>{data.fullStackCloses}</td>
                  <td>{formatCurrency(data.recurringCommission)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(data.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
