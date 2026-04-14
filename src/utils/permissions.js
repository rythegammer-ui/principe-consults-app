const PAGE_ACCESS = {
  Dashboard: ['admin', 'manager', 'rep'],
  Leads: ['admin', 'manager', 'rep'],
  'AI Outreach': ['admin', 'manager', 'rep'],
  Pipeline: ['admin', 'manager', 'rep'],
  'Call Tracker': ['admin', 'manager', 'rep'],
  Revenue: ['admin', 'manager'],
  Payouts: ['admin', 'manager', 'rep'],
  'Lead Generator': ['admin', 'manager', 'rep'],
  'My Scripts': ['admin', 'manager', 'rep'],
  Playbook: ['admin', 'manager', 'rep'],
  Team: ['admin', 'manager'],
  'Activity Log': ['admin', 'manager', 'rep'],
  Settings: ['admin'],
};

export function canAccess(role, pageName) {
  const allowed = PAGE_ACCESS[pageName];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function canSeeAllLeads(role) {
  return role === 'admin' || role === 'manager';
}
