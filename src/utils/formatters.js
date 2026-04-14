import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function relativeTime(date) {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isToday(d)) return 'Today ' + format(d, 'h:mm a');
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatCurrency(number) {
  if (number == null || isNaN(number)) return '$0';
  return '$' + Number(number).toLocaleString();
}

export function formatPhone(str) {
  if (!str) return '—';
  const digits = str.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return str;
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const STATUS_COLORS = {
  'New': { bg: 'rgba(96,165,250,0.15)', text: 'var(--blue)', border: 'rgba(96,165,250,0.3)' },
  'Contacted': { bg: 'rgba(245,158,11,0.15)', text: 'var(--yellow)', border: 'rgba(245,158,11,0.3)' },
  'Replied': { bg: 'rgba(167,139,250,0.15)', text: 'var(--purple)', border: 'rgba(167,139,250,0.3)' },
  'Demo Scheduled': { bg: 'rgba(251,146,60,0.15)', text: 'var(--orange)', border: 'rgba(251,146,60,0.3)' },
  'Demo Completed': { bg: 'rgba(45,212,191,0.15)', text: 'var(--teal)', border: 'rgba(45,212,191,0.3)' },
  'Proposal Sent': { bg: 'rgba(129,140,248,0.15)', text: 'var(--indigo)', border: 'rgba(129,140,248,0.3)' },
  'Closed Won': { bg: 'rgba(34,197,94,0.15)', text: 'var(--green)', border: 'rgba(34,197,94,0.3)' },
  'Dead': { bg: 'rgba(85,85,85,0.15)', text: 'var(--muted)', border: 'rgba(85,85,85,0.3)' },
};

export const OUTCOME_COLORS = {
  'No Answer': { bg: 'rgba(85,85,85,0.15)', text: 'var(--muted)', border: 'rgba(85,85,85,0.3)' },
  'Left VM': { bg: 'rgba(245,158,11,0.15)', text: 'var(--yellow)', border: 'rgba(245,158,11,0.3)' },
  'Callback Requested': { bg: 'rgba(96,165,250,0.15)', text: 'var(--blue)', border: 'rgba(96,165,250,0.3)' },
  'Interested': { bg: 'rgba(167,139,250,0.15)', text: 'var(--purple)', border: 'rgba(167,139,250,0.3)' },
  'Not Interested': { bg: 'rgba(85,85,85,0.15)', text: 'var(--muted)', border: 'rgba(85,85,85,0.3)' },
  'Booked': { bg: 'rgba(34,197,94,0.15)', text: 'var(--green)', border: 'rgba(34,197,94,0.3)' },
};

export const PAYMENT_STATUS_COLORS = {
  'paid': { bg: 'rgba(34,197,94,0.15)', text: 'var(--green)', border: 'rgba(34,197,94,0.3)' },
  'pending': { bg: 'rgba(245,158,11,0.15)', text: 'var(--yellow)', border: 'rgba(245,158,11,0.3)' },
  'overdue': { bg: 'rgba(230,50,40,0.15)', text: 'var(--red)', border: 'rgba(230,50,40,0.3)' },
  'refunded': { bg: 'rgba(85,85,85,0.15)', text: 'var(--muted)', border: 'rgba(85,85,85,0.3)' },
  'failed': { bg: 'rgba(230,50,40,0.1)', text: 'var(--red)', border: 'var(--red)' },
};

export const LEAD_STATUSES = ['New', 'Contacted', 'Replied', 'Demo Scheduled', 'Demo Completed', 'Proposal Sent', 'Closed Won', 'Dead'];

export const BUSINESS_TYPES = ['Auto Shop', 'HVAC', 'Plumber', 'Landscaping', 'Roofing', 'Barbershop', 'Med Spa', 'Gym', 'Electrician', 'Restaurant', 'Other'];

export const DFW_CITIES = ['Dallas', 'McKinney', 'Frisco', 'Plano', 'Allen', 'Farmers Branch', 'Garland', 'Irving', 'Arlington', 'Fort Worth', 'Other'];

export const CALL_OUTCOMES = ['No Answer', 'Left VM', 'Callback Requested', 'Interested', 'Not Interested', 'Booked'];

export const SOURCES = ['AI Outreach', 'Cold Call', 'Referral', 'Inbound', 'Social Media'];

export const TIER_OPTIONS = ['Launchpad $997', 'Growth Engine $2,500', 'Full Stack $5,000', 'TBD'];

export const PAYMENT_METHODS = ['stripe', 'cash', 'check', 'zelle', 'other'];

export const PAYMENT_STATUSES = ['paid', 'pending', 'overdue', 'refunded', 'failed'];

export const TIER_NAMES = ['Launchpad', 'Growth Engine', 'Full Stack', 'Custom'];
