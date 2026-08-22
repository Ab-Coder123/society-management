/**
 * WhatsApp Notification Service
 *
 * WHATSAPP_MODE=mock  → Logs to console. No real API calls. Acceptable per Assessment spec.
 * WHATSAPP_MODE=live  → Calls the real WhatsApp Business API (Meta Graph API v19.0).
 *
 * Assessment note from PDF:
 *  "If a live WhatsApp Business API isn't available during the assessment,
 *   a mock/test implementation is acceptable."
 */

const MODE = process.env.WHATSAPP_MODE || 'mock';
const API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
const API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

// ─── Message Templates ────────────────────────────────────────────────────────
const TEMPLATES = {
  visitor_approved: (visitorName, flatNumber) =>
    `🏠 *Society Management Alert*\n\nYour visitor *${visitorName}* has been approved for entry to Flat ${flatNumber}.\n\nPlease ensure they arrive with a valid ID.`,

  visitor_checked_in: (visitorName, checkInTime) =>
    `🚪 *Gate Alert*\n\nYour visitor *${visitorName}* has checked in at ${checkInTime}.\n\nContact security immediately if you were not expecting this visit.`,

  payment_due: (month, amount, flatNumber) =>
    `💳 *Maintenance Due*\n\nYour maintenance fee of *₹${amount}* for *${month}* is due for Flat ${flatNumber}.\n\nPlease pay to avoid late penalties.`,

  payment_overdue: (month, amount) =>
    `⚠️ *Overdue Maintenance*\n\nYour maintenance fee of *₹${amount}* for *${month}* is OVERDUE.\n\nPlease settle immediately to avoid service disruption.`,

  complaint_update: (status, title) =>
    `📋 *Complaint Update*\n\nYour complaint "*${title}*" has been updated to status: *${status.toUpperCase()}*.\n\nLogin to the resident portal for full details.`,

  notice_broadcast: (title, societyName) =>
    `📢 *Notice from ${societyName}*\n\n*${title}*\n\nLogin to the resident portal for full details.`,
};

// ─── Mock Implementation (always-on in test env) ─────────────────────────────
async function sendMock(to, message, templateName) {
  const logLine = `[WhatsApp MOCK] → ${to} | Template: ${templateName} | Msg: ${message.slice(0, 80).replace(/\n/g, ' ')}...`;
  if (process.env.NODE_ENV !== 'test') {
    console.log(logLine);
  }
  // Simulate async API call delay
  await new Promise((r) => setTimeout(r, 10));
  return { success: true, mode: 'mock', to, templateName };
}

// ─── Live Implementation (Meta WhatsApp Business API) ─────────────────────────
async function sendLive(to, message) {
  if (!API_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set for live mode');
  }

  const endpoint = `${API_URL}/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: to.replace(/\D/g, ''),   // Strip non-numeric chars from phone number
    type: 'text',
    text: { body: message },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${errorBody}`);
  }

  return { success: true, mode: 'live', ...(await response.json()) };
}

// ─── Public Send Function ─────────────────────────────────────────────────────
/**
 * Sends a WhatsApp notification.
 * Always non-blocking — caller should NOT await this in production paths.
 *
 * @param {string} phone       - Recipient phone number (E.164 or local with country prefix)
 * @param {string} templateKey - Key from TEMPLATES object
 * @param {string[]} args      - Template arguments
 */
export async function sendWhatsApp(phone, templateKey, ...args) {
  try {
    if (!phone || !templateKey) {
      return { success: false, reason: 'Missing phone or templateKey' };
    }

    const templateFn = TEMPLATES[templateKey];
    if (!templateFn) {
      return { success: false, reason: `Unknown template: ${templateKey}` };
    }

    const message = templateFn(...args);

    if (MODE === 'live') {
      return await sendLive(phone, message);
    }

    return await sendMock(phone, message, templateKey);
  } catch (err) {
    // Non-blocking: never propagate errors to callers
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ WhatsApp send failed:', err.message);
    }
    return { success: false, error: err.message };
  }
}

// ─── Convenience Wrappers ─────────────────────────────────────────────────────
export const whatsapp = {
  visitorApproved:  (phone, visitorName, flatNumber)    => sendWhatsApp(phone, 'visitor_approved',   visitorName, flatNumber),
  visitorCheckedIn: (phone, visitorName, checkInTime)   => sendWhatsApp(phone, 'visitor_checked_in', visitorName, checkInTime),
  paymentDue:       (phone, month, amount, flatNumber)  => sendWhatsApp(phone, 'payment_due',        month, amount, flatNumber),
  paymentOverdue:   (phone, month, amount)              => sendWhatsApp(phone, 'payment_overdue',    month, amount),
  complaintUpdate:  (phone, status, title)              => sendWhatsApp(phone, 'complaint_update',   status, title),
  noticeBroadcast:  (phone, title, societyName)         => sendWhatsApp(phone, 'notice_broadcast',  title, societyName),
};

export default sendWhatsApp;
