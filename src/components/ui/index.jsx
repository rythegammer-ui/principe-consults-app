import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Star, Loader2, Inbox } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { STATUS_COLORS, OUTCOME_COLORS, PAYMENT_STATUS_COLORS } from '../../utils/formatters';

export function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS['New'];
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

export function OutcomeBadge({ outcome }) {
  const colors = OUTCOME_COLORS[outcome] || OUTCOME_COLORS['No Answer'];
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {outcome}
    </span>
  );
}

export function PaymentStatusBadge({ status }) {
  const colors = PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS['pending'];
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

export function StatCard({ label, value, color = 'var(--text)', icon: Icon, prefix = '', pulsing = false }) {
  return (
    <div className="card" style={{ padding: '20px', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: 'var(--text2)', fontSize: '13px', fontWeight: 500 }}>{label}</span>
        {Icon && <Icon size={18} style={{ color: 'var(--muted)' }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color, fontSize: '28px', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {pulsing && (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: color,
              animation: 'pulse 2s infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 560 }) {
  const ref = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        ref={ref}
        className="card"
        style={{
          width: isMobile ? '100%' : '90%',
          maxWidth: isMobile ? '100%' : width,
          maxHeight: isMobile ? '92vh' : '90vh',
          overflow: 'auto',
          padding: isMobile ? '20px 16px' : '24px',
          animation: 'fadeIn 0.2s ease-out',
          borderRadius: isMobile ? '16px 16px 0 0' : '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ToastContainer() {
  const notifications = useAppStore(s => s.notifications);
  const dismiss = useAppStore(s => s.dismissNotification);

  const typeColors = {
    success: 'var(--green)',
    error: 'var(--red)',
    info: 'var(--blue)',
    warning: 'var(--yellow)',
  };

  return (
    <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {notifications.map(n => (
        <div
          key={n.id}
          style={{
            background: 'var(--surface2)',
            border: `1px solid ${typeColors[n.type] || 'var(--border)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '280px',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.2s ease-out',
          }}
        >
          <span style={{ width: '4px', height: '24px', borderRadius: '2px', background: typeColors[n.type] || 'var(--border)', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', color: 'var(--text)', flex: 1 }}>{n.message}</span>
          <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({ size = 20, color = 'var(--red)' }) {
  return <Loader2 size={size} style={{ color, animation: 'spin 1s linear infinite' }} />;
}

// Add keyframe for spin
if (typeof document !== 'undefined' && !document.querySelector('#spinner-keyframes')) {
  const style = document.createElement('style');
  style.id = 'spinner-keyframes';
  style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

export function EmptyState({ icon: Icon = Inbox, message = 'Nothing here yet.', action, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
      <Icon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
      <p style={{ fontSize: '15px', marginBottom: action ? '16px' : 0 }}>{message}</p>
      {action && <button className="btn-red" onClick={onAction}>{action}</button>}
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message = 'This action cannot be undone.' }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div className="card" style={{ padding: '24px', maxWidth: '420px', width: '90%', animation: 'fadeIn 0.2s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertTriangle size={22} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{title}</h3>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-red" onClick={() => { onConfirm(); onClose(); }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export function StarRating({ rating = 0, max = 5, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.round(rating) ? 'var(--yellow)' : 'none'}
          stroke={i < Math.round(rating) ? 'var(--yellow)' : 'var(--muted)'}
        />
      ))}
      <span style={{ marginLeft: '6px', fontSize: '13px', color: 'var(--text2)' }}>{rating}</span>
    </div>
  );
}

export function Avatar({ name, size = 32 }) {
  const initials = (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--red-dim)',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function RoleBadge({ role }) {
  const colors = {
    admin: { bg: 'rgba(230,50,40,0.15)', text: 'var(--red)' },
    manager: { bg: 'rgba(96,165,250,0.15)', text: 'var(--blue)' },
    rep: { bg: 'rgba(167,139,250,0.15)', text: 'var(--purple)' },
  };
  const c = colors[role] || colors.rep;
  return (
    <span style={{
      background: c.bg,
      color: c.text,
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {role}
    </span>
  );
}

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <button
      onClick={handleCopy}
      className="btn-ghost"
      style={{ padding: '4px 10px', fontSize: '12px' }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
