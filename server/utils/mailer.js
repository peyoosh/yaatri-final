// Singleton nodemailer transporter for the Yaatri platform.
//
// Behaviour:
//   - If SMTP_HOST is set in .env → creates a real SMTP transporter and verifies it on first use.
//   - If SMTP_HOST is empty / missing → "skip mode": sendMail() resolves successfully but logs the
//     intended payload instead of dispatching. Lets the app run end-to-end in dev without an inbox.
//
// Always returns a result object — callers can decide whether a non-delivery is fatal or not.
//   { delivered: true,  messageId, ... }    on successful send
//   { delivered: false, skipped: true }     when SMTP isn't configured
//   { delivered: false, error: '…' }        on transient delivery failure

const nodemailer = require('nodemailer');

let transporter = null;
let transporterReady = false;

const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST.trim());

const buildTransporter = () => {
  if (transporter) return transporter;
  if (!isConfigured()) return null;

  const port = Number(process.env.SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });

  // Verify once — failure here is non-fatal; we'll still try to send and log on failure.
  transporter.verify().then(() => {
    transporterReady = true;
    console.log('[mailer] SMTP transporter ready:', process.env.SMTP_HOST);
  }).catch((err) => {
    console.warn('[mailer] SMTP verify failed (will still try to send on demand):', err.message);
  });

  return transporter;
};

const fromHeader = () => {
  const name = process.env.SMTP_FROM_NAME || 'Yaatri';
  const addr = process.env.SMTP_USER || process.env.SUPPORT_INBOX || 'no-reply@yaatri.local';
  return `"${name}" <${addr}>`;
};

const sendMail = async ({ to, subject, html, text, attachments }) => {
  if (!to || !subject || (!html && !text)) {
    return { delivered: false, error: 'Missing to/subject/body.' };
  }

  if (!isConfigured()) {
    console.log('\n══════════════════ [MAIL SKIPPED — SMTP not configured] ══════════════════');
    console.log('  To:      ', to);
    console.log('  Subject: ', subject);
    console.log('  Preview: ', (text || html).slice(0, 240).replace(/\s+/g, ' '));
    console.log('═══════════════════════════════════════════════════════════════════════════\n');
    return { delivered: false, skipped: true };
  }

  const t = buildTransporter();
  try {
    const info = await t.sendMail({
      from: fromHeader(),
      to,
      replyTo: process.env.SUPPORT_INBOX || undefined,
      subject,
      html,
      text,
      attachments,
    });
    if (!transporterReady) transporterReady = true;
    console.log(`[mailer] sent → ${to}  (id=${info.messageId})`);
    return { delivered: true, messageId: info.messageId, response: info.response };
  } catch (err) {
    console.error(`[mailer] send failed → ${to}:`, err.message);
    return { delivered: false, error: err.message };
  }
};

module.exports = { sendMail, isConfigured };
