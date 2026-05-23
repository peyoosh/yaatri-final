const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const { validateAdmin } = require('../middleware/authMiddleware');
const { sendMail } = require('../utils/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const renderMailTemplate = ({ email, subject, type, message, _id, createdAt }) => `
[YAATRI SUPPORT INBOUND]
Ticket: ${_id}
Received: ${new Date(createdAt || Date.now()).toISOString()}
Type:    ${type}
From:    ${email}
Subject: ${subject}

----- MESSAGE -----
${message}
-------------------
`.trim();

// POST /api/queries  — anyone can file a support ticket (auth optional).
router.post('/', async (req, res) => {
  try {
    const { email, subject, type, message } = req.body || {};

    if (!email || !EMAIL_RE.test(String(email))) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    if (!message || String(message).trim().length < 5) {
      return res.status(400).json({ message: 'Message must be at least 5 characters' });
    }
    const allowedTypes = ['Report Issue', 'Suggestion', 'General Feedback'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid query type' });
    }

    const doc = await Query.create({
      user: null, // attach later if you wire auth-aware support
      email: String(email).trim().toLowerCase(),
      subject: String(subject).trim(),
      type: type || 'General Feedback',
      message: String(message).trim(),
    });

    // Render and persist a mail-template snapshot, then log it for the admin dashboard.
    doc.mailRendered = renderMailTemplate(doc.toObject());
    await doc.save();

    // Server-side notification log — admin dashboards can read this stream from server stdout.
    console.warn(`[SUPPORT_QUEUE_NEW] ticket=${doc._id} type="${doc.type}" from=${doc.email}`);

    // Forward the ticket to the support inbox. Fire-and-forget — never let mailer issues
    // change the user-facing HTTP response. The mailer itself graceful-skips when SMTP is unset.
    setImmediate(async () => {
      try {
        const supportInbox = process.env.SUPPORT_INBOX || process.env.SMTP_USER;
        if (!supportInbox) {
          console.warn(`[support-mail] SUPPORT_INBOX not configured — ticket ${doc._id} logged only.`);
          return;
        }
        const subjectLine = `[Yaatri Support · ${doc.type}] ${doc.subject}`;
        const text = doc.mailRendered || renderMailTemplate(doc.toObject());
        const html = `
          <div style="font-family: 'Segoe UI', sans-serif; background:#0D0A02; color:#F4F2F3; padding:24px; max-width:640px; margin:0 auto;">
            <h2 style="margin:0 0 4px; color:#A2D729; letter-spacing:2px; font-size:14px; text-transform:uppercase;">Yaatri · Support inbound</h2>
            <p style="margin:0 0 18px; font-size:12px; opacity:0.6;">Ticket ${doc._id}</p>
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px;">
              <tr><td style="padding:4px 0; opacity:0.6; width:90px;">Type</td><td style="font-weight:700; color:#A2D729;">${doc.type}</td></tr>
              <tr><td style="padding:4px 0; opacity:0.6;">From</td><td><a href="mailto:${doc.email}" style="color:#A2D729; text-decoration:none;">${doc.email}</a></td></tr>
              <tr><td style="padding:4px 0; opacity:0.6;">Subject</td><td>${doc.subject.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</td></tr>
            </table>
            <div style="border-top:1px solid #2A3A3F; margin-top:16px; padding-top:16px; white-space:pre-wrap; line-height:1.6;">
              ${doc.message.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}
            </div>
            <p style="margin-top:24px; font-size:11px; opacity:0.5;">Reply directly to <a href="mailto:${doc.email}" style="color:#A2D729;">${doc.email}</a> to respond to the user. Manage status in /admin/messages.</p>
          </div>
        `;
        const result = await sendMail({ to: supportInbox, subject: subjectLine, text, html });
        if (!result.delivered) {
          console.warn(`[support-mail] ticket=${doc._id} delivery returned: ${result.skipped ? 'skipped (SMTP not configured)' : result.error || 'unknown'}`);
        }
      } catch (mailErr) {
        // Per spec: log and move on. Never throw — the ticket is already saved.
        console.warn(`[support-mail] ticket=${doc._id} mailer threw: ${mailErr.message}`);
      }
    });

    res.status(201).json({
      message: 'Your query has been received. We will follow up via email shortly.',
      ticketId: doc._id,
    });
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('QUERY_CREATE_ERROR', err);
    return res.status(400).json({ message: err.message || 'Failed to submit query' });
  }
});

// GET /api/queries  — admin: list of tickets newest first.
router.get('/', validateAdmin, async (req, res) => {
  try {
    const list = await Query.find({}).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/queries/:id/status — admin moves the ticket through its lifecycle.
router.patch('/:id/status', validateAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['new', 'in_progress', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'invalid status' });
    }
    const updated = await Query.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'query not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
