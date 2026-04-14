const GHL_BASE = 'https://services.leadconnectorhq.com';

function getHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Version': '2021-07-28',
  };
}

// Search for a contact by phone number
export async function searchContact(apiKey, locationId, phone) {
  const digits = phone.replace(/\D/g, '');
  const formatted = digits.length === 10 ? `+1${digits}` : digits.length === 11 ? `+${digits}` : `+1${digits}`;

  const res = await fetch(`${GHL_BASE}/contacts/search/duplicate?locationId=${locationId}&number=${encodeURIComponent(formatted)}`, {
    method: 'GET',
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GHL API error: ${res.status}`);
  }

  const data = await res.json();
  return data.contact || null;
}

// Create a contact in GHL
export async function createContact(apiKey, locationId, lead) {
  const digits = lead.phone?.replace(/\D/g, '') || '';
  const phone = digits.length === 10 ? `+1${digits}` : digits.length === 11 ? `+${digits}` : digits;

  const res = await fetch(`${GHL_BASE}/contacts/`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      locationId,
      firstName: lead.ownerName?.split(' ')[0] || lead.businessName,
      lastName: lead.ownerName?.split(' ').slice(1).join(' ') || '',
      name: lead.ownerName || lead.businessName,
      email: lead.email || undefined,
      phone: phone || undefined,
      companyName: lead.businessName,
      city: lead.city,
      source: 'Principe Console',
      tags: ['console-lead', lead.type?.toLowerCase().replace(/\s+/g, '-')].filter(Boolean),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create contact: ${res.status}`);
  }

  const data = await res.json();
  return data.contact;
}

// Send an SMS via GHL
export async function sendSMS(apiKey, contactId, message) {
  const res = await fetch(`${GHL_BASE}/conversations/messages`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      type: 'SMS',
      contactId,
      message,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to send SMS: ${res.status}`);
  }

  return await res.json();
}

// Send an email via GHL
export async function sendEmail(apiKey, contactId, subject, htmlBody) {
  const res = await fetch(`${GHL_BASE}/conversations/messages`, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({
      type: 'Email',
      contactId,
      subject,
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to send email: ${res.status}`);
  }

  return await res.json();
}

// Get conversations for a contact
export async function getConversations(apiKey, locationId, contactId) {
  const res = await fetch(`${GHL_BASE}/conversations/search?locationId=${locationId}&contactId=${contactId}`, {
    method: 'GET',
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to get conversations: ${res.status}`);
  }

  const data = await res.json();
  return data.conversations || [];
}

// Get messages in a conversation
export async function getMessages(apiKey, conversationId) {
  const res = await fetch(`${GHL_BASE}/conversations/${conversationId}/messages`, {
    method: 'GET',
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to get messages: ${res.status}`);
  }

  const data = await res.json();
  return data.messages?.messages || data.messages || [];
}

// Trigger a workflow for a contact
export async function triggerWorkflow(apiKey, contactId, workflowId) {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}/workflow/${workflowId}`, {
    method: 'POST',
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to trigger workflow: ${res.status}`);
  }

  return await res.json();
}

// Delete a workflow from a contact
export async function removeWorkflow(apiKey, contactId, workflowId) {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}/workflow/${workflowId}`, {
    method: 'DELETE',
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to remove workflow: ${res.status}`);
  }

  return await res.json();
}
