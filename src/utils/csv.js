export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim().toLowerCase().replace(/\s+/g, '_')] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function mapCSVToLead(row) {
  return {
    businessName: row.business_name || row.name || row.company || '',
    type: row.type || row.business_type || row.category || 'Other',
    ownerName: row.owner_name || row.owner || row.contact || '',
    city: row.city || row.location || '',
    phone: (row.phone || row.phone_number || '').replace(/\D/g, ''),
    email: row.email || '',
    hasWebsite: !!(row.website || row.website_url || row.has_website === 'true' || row.has_website === 'yes'),
    websiteUrl: row.website || row.website_url || '',
    rating: parseFloat(row.rating || row.google_rating) || 0,
    assignedTo: '',
    status: row.status || 'New',
    notes: row.notes || '',
    source: row.source || 'Inbound',
    tierFit: row.tier || row.tier_fit || 'TBD',
    dealValue: parseFloat(row.deal_value) || 0,
    followUpDate: row.follow_up_date || null,
  };
}

export function exportLeadsCSV(leads) {
  const headers = ['Business Name', 'Type', 'Owner', 'City', 'Phone', 'Email', 'Has Website', 'Website URL', 'Rating', 'Status', 'Source', 'Tier Fit', 'Notes'];
  const rows = leads.map(l => [
    l.businessName, l.type, l.ownerName, l.city, l.phone, l.email,
    l.hasWebsite ? 'Yes' : 'No', l.websiteUrl, l.rating, l.status, l.source, l.tierFit, l.notes,
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportCallsCSV(calls, leads) {
  const headers = ['Date', 'Business', 'Phone', 'Called By', 'Duration (min)', 'Outcome', 'Notes', 'Follow-up'];
  const rows = calls.map(c => {
    const lead = leads.find(l => l.id === c.leadId);
    return [
      c.date || c.timestamp, lead?.businessName || '', lead?.phone || '', c.calledBy || '',
      c.duration || '', c.outcome || '', c.notes || '', c.followUpDate || '',
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
