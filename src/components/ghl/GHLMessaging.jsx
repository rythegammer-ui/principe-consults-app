import { useState, useCallback } from 'react';
import { Send, MessageSquare, RefreshCw, User, ArrowUpRight, ArrowDownLeft, Mail, Phone } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { LoadingSpinner } from '../ui';
import { searchContact, createContact, sendSMS, sendEmail, getConversations, getMessages } from '../../utils/ghl';
import { formatDateTime } from '../../utils/formatters';

export default function GHLMessaging({ lead }) {
  const settings = useAppStore(s => s.settings);
  const addNotification = useAppStore(s => s.addNotification);
  const addActivity = useAppStore(s => s.addActivity);
  const currentUser = useAppStore(s => s.currentUser);
  const updateLead = useAppStore(s => s.updateLead);

  const [ghlContact, setGhlContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [msgType, setMsgType] = useState('SMS');
  const [emailSubject, setEmailSubject] = useState('');
  const [tab, setTab] = useState('send');

  const apiKey = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;
  const isConfigured = !!(apiKey && locationId);
  const contactId = ghlContact?.id || lead.ghlContactId || null;

  const loadMessages = useCallback(async (cId) => {
    if (!cId || !apiKey || !locationId) return;
    setLoading(true);
    try {
      const convos = await getConversations(apiKey, locationId, cId);
      if (convos.length > 0) {
        const msgs = await getMessages(apiKey, convos[0].id);
        setMessages(Array.isArray(msgs) ? msgs.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)) : []);
      } else {
        setMessages([]);
      }
    } catch {
      // Silently fail - user can retry manually
      setMessages([]);
    }
    setLoading(false);
  }, [apiKey, locationId]);

  const handleSync = async () => {
    if (!isConfigured || !lead.phone) return;
    setSyncing(true);
    try {
      let contact = await searchContact(apiKey, locationId, lead.phone);
      if (!contact) {
        contact = await createContact(apiKey, locationId, lead);
        addNotification(`Created GHL contact for ${lead.businessName}`, 'success');
      }
      setGhlContact(contact);
      if (contact.id) {
        updateLead(lead.id, { ghlContactId: contact.id });
        await loadMessages(contact.id);
      }
    } catch (err) {
      addNotification(`GHL sync failed: ${err.message}`, 'error');
    }
    setSyncing(false);
  };

  const handleSend = async () => {
    const cId = contactId;
    if (!cId || !newMessage.trim()) return;

    setSending(true);
    try {
      if (msgType === 'SMS') {
        await sendSMS(apiKey, cId, newMessage);
      } else {
        await sendEmail(apiKey, cId, emailSubject || 'Message from Principe Consults', newMessage);
      }
      addNotification(`${msgType} sent to ${lead.businessName}!`, 'success');
      addActivity(`${msgType} sent to "${lead.businessName}" via GHL`, 'outreach', currentUser?.id, lead.id);
      setNewMessage('');
      setEmailSubject('');
      await loadMessages(cId);
    } catch (err) {
      addNotification(`Failed to send: ${err.message}`, 'error');
    }
    setSending(false);
  };

  if (!isConfigured) {
    return (
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          <MessageSquare size={14} style={{ marginRight: '6px', display: 'inline' }} />
          GHL Messaging
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Set your GHL API Key and Location ID in Settings to enable messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <MessageSquare size={14} style={{ marginRight: '6px', display: 'inline' }} />
          GHL Messaging
        </h4>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {contactId && (
            <span style={{ fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={11} /> Synced
            </span>
          )}
          <button
            className="btn-ghost"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? <LoadingSpinner size={12} /> : <RefreshCw size={12} />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button
          className="btn-ghost"
          onClick={() => setTab('send')}
          style={{
            fontSize: '12px', padding: '4px 12px',
            background: tab === 'send' ? 'var(--red-glow)' : undefined,
            color: tab === 'send' ? 'var(--red)' : undefined,
          }}
        >
          Send Message
        </button>
        <button
          className="btn-ghost"
          onClick={() => { setTab('history'); if (contactId) loadMessages(contactId); }}
          style={{
            fontSize: '12px', padding: '4px 12px',
            background: tab === 'history' ? 'var(--red-glow)' : undefined,
            color: tab === 'history' ? 'var(--red)' : undefined,
          }}
        >
          History ({messages.length})
        </button>
      </div>

      {tab === 'send' && (
        <div>
          {!contactId ? (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                Sync this lead with GHL to start messaging.
              </p>
              <button className="btn-red" onClick={handleSync} disabled={syncing || !lead.phone} style={{ fontSize: '12px' }}>
                {syncing ? 'Syncing...' : 'Sync with GHL'}
              </button>
              {!lead.phone && <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>No phone number on this lead.</p>}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button
                  className={msgType === 'SMS' ? 'btn-red' : 'btn-ghost'}
                  style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setMsgType('SMS')}
                >
                  <Phone size={11} /> SMS
                </button>
                <button
                  className={msgType === 'Email' ? 'btn-red' : 'btn-ghost'}
                  style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setMsgType('Email')}
                >
                  <Mail size={11} /> Email
                </button>
              </div>

              {msgType === 'Email' && (
                <input
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                  style={{ marginBottom: '8px', fontSize: '13px' }}
                />
              )}

              <textarea
                rows={3}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={msgType === 'SMS' ? 'Type your SMS...' : 'Type your email body...'}
                style={{ fontSize: '13px', marginBottom: '8px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {msgType === 'SMS' ? (
                  <span style={{
                    fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
                    color: newMessage.length <= 160 ? 'var(--green)' : 'var(--yellow)',
                  }}>
                    {newMessage.length}/160
                  </span>
                ) : <span />}
                <button
                  className="btn-red"
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {sending ? <LoadingSpinner size={12} color="white" /> : <Send size={12} />}
                  Send {msgType}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <LoadingSpinner size={20} />
            </div>
          ) : messages.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '16px' }}>
              {contactId ? 'No messages yet.' : 'Sync with GHL to see messages.'}
            </p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {messages.map((msg, i) => {
                const isOutbound = msg.direction === 'outbound' || msg.direction === 1;
                return (
                  <div
                    key={msg.id || i}
                    style={{
                      display: 'flex',
                      justifyContent: isOutbound ? 'flex-end' : 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isOutbound ? 'var(--red-dim)' : 'var(--surface2)',
                      border: `1px solid ${isOutbound ? 'var(--red)' : 'var(--border)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        {isOutbound ? <ArrowUpRight size={10} style={{ color: 'var(--red)' }} /> : <ArrowDownLeft size={10} style={{ color: 'var(--green)' }} />}
                        <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                          {msg.type || 'sms'} - {isOutbound ? 'sent' : 'received'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                        {msg.body || msg.message || msg.html || ''}
                      </p>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {msg.dateAdded ? formatDateTime(msg.dateAdded) : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
