import { useState } from 'react';
import { Send } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { LoadingSpinner } from '../ui';
import { searchContact, createContact, sendSMS } from '../../utils/ghl';

export default function GHLSendButton({ lead, messageText, style = {} }) {
  const settings = useAppStore(s => s.settings);
  const addNotification = useAppStore(s => s.addNotification);
  const addActivity = useAppStore(s => s.addActivity);
  const currentUser = useAppStore(s => s.currentUser);
  const updateLead = useAppStore(s => s.updateLead);
  const [sending, setSending] = useState(false);

  const apiKey = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;

  if (!apiKey || !locationId || !lead.phone) return null;

  const handleSend = async (e) => {
    e.stopPropagation();
    if (!messageText?.trim()) return;

    setSending(true);
    try {
      let contactId = lead.ghlContactId;

      if (!contactId) {
        let contact = await searchContact(apiKey, locationId, lead.phone);
        if (!contact) {
          contact = await createContact(apiKey, locationId, lead);
        }
        contactId = contact.id;
        updateLead(lead.id, { ghlContactId: contactId });
      }

      await sendSMS(apiKey, contactId, messageText);
      addNotification(`SMS sent to ${lead.businessName} via GHL!`, 'success');
      addActivity(`SMS sent to "${lead.businessName}" via GHL`, 'outreach', currentUser?.id, lead.id);
    } catch (err) {
      addNotification(`GHL send failed: ${err.message}`, 'error');
    }
    setSending(false);
  };

  return (
    <button
      className="btn-ghost"
      onClick={handleSend}
      disabled={sending || !messageText?.trim()}
      style={{
        padding: '4px 10px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: 'var(--green)',
        ...style,
      }}
      title="Send via GHL"
    >
      {sending ? <LoadingSpinner size={12} color="var(--green)" /> : <Send size={12} />}
      Send via GHL
    </button>
  );
}
