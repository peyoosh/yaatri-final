const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Query = require('../models/Query');
const { sendMail } = require('../utils/mailer');

const VENDOR_ROLES = ['hotel', 'hotel_owner', 'guide'];

// POST /api/vendors/payout-request
// Body: { amount: Number, note?: String }
// Vendor (guide/hotel) requests a payout. We file a high-priority support ticket
// that bypasses the normal queue and routes directly to the admin payout drawer:
//   - type: 'account_issue'
//   - assignedTo: 'admin'
//   - isEscalated: true
//   - status: 'escalated'
// The platform's support inbox is also CC'd via the mailer (graceful-skip if SMTP is off).
router.post('/payout-request', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!VENDOR_ROLES.includes(user.role)) {
      return res.status(403).json({ message: 'Only guide and hotel accounts can file payout requests.' });
    }

    const { amount, note } = req.body || {};
    const requested = Number(amount);
    if (!Number.isFinite(requested) || requested <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number (NPR).' });
    }

    const ledger = user.vendorLedger || { pendingPayout: 0 };
    const available = Number(ledger.pendingPayout || 0);
    if (requested > available) {
      return res.status(400).json({
        message: `Requested NPR ${requested.toLocaleString('en-IN')} exceeds your pending balance of NPR ${available.toLocaleString('en-IN')}.`,
      });
    }

    const subject = `[PAYOUT REQUEST] - From Vendor ID: ${user._id}`;
    const messageBody = [
      `Vendor:       @${user.username}  (${user.role})`,
      `Vendor ID:    ${user._id}`,
      `Vendor email: ${user.email || 'n/a'}`,
      ``,
      `Amount requested: NPR ${requested.toLocaleString('en-IN')}`,
      `Pending balance:  NPR ${available.toLocaleString('en-IN')}`,
      `Lifetime earned:  NPR ${Number(ledger.totalEarned || 0).toLocaleString('en-IN')}`,
      `Already paid:     NPR ${Number(ledger.totalWithdrawn || 0).toLocaleString('en-IN')}`,
      ``,
      note ? `Note from vendor:\n${String(note).slice(0, 1500)}` : 'No note provided.',
    ].join('\n');

    const ticket = await Query.create({
      user: user._id,
      email: user.email || `vendor-${user._id}@yaatri.local`,
      subject,
      type: 'account_issue',
      message: messageBody,
      assignedTo: 'admin',
      isEscalated: true,
      status: 'escalated',
    });

    // Persist the rendered mail snapshot so it shows in /admin/messages without an SMTP fetch.
    ticket.mailRendered = `[YAATRI PAYOUT REQUEST]\nTicket: ${ticket._id}\nSubject: ${subject}\n\n${messageBody}`;
    await ticket.save();

    console.log(`[payouts] payout request filed: ticket=${ticket._id} vendor=${user.username} amount=NPR ${requested}`);

    // Notify the support inbox (admin drawer) immediately — fire-and-forget.
    setImmediate(async () => {
      try {
        const supportInbox = process.env.SUPPORT_INBOX || process.env.SMTP_USER;
        if (!supportInbox) {
          console.warn(`[payouts] SUPPORT_INBOX not configured — ticket ${ticket._id} logged only.`);
          return;
        }
        const html = `
          <div style="font-family:'Segoe UI',sans-serif; background:#0D0A02; color:#F4F2F3; padding:24px; max-width:640px; margin:0 auto; border:1px solid #2A3A3F; border-radius:10px;">
            <p style="margin:0 0 8px; font-size:11px; letter-spacing:3px; color:#F4A261; font-weight:800;">YAATRI · HIGH PRIORITY · PAYOUT REQUEST</p>
            <h2 style="margin:0 0 16px; font-size:18px;">${user.username} (${user.role}) requests a payout</h2>
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px; margin-bottom:12px;">
              <tr><td style="opacity:0.6; padding:4px 0; width:160px;">Amount requested</td><td style="color:#A2D729; font-weight:800; font-size:15px;">NPR ${requested.toLocaleString('en-IN')}</td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Pending balance</td><td>NPR ${available.toLocaleString('en-IN')}</td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Vendor ID</td><td style="font-family:monospace;">${user._id}</td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Vendor email</td><td><a href="mailto:${user.email || ''}" style="color:#A2D729;">${user.email || 'n/a'}</a></td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Ticket</td><td style="font-family:monospace;">${ticket._id}</td></tr>
            </table>
            ${note ? `<div style="border-top:1px solid #2A3A3F; padding-top:12px; white-space:pre-wrap; line-height:1.5; font-size:13px;">${String(note).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])).slice(0, 1500)}</div>` : ''}
            <p style="margin-top:18px; font-size:11px; opacity:0.5;">Review in /admin/messages or hit POST /api/admin/payouts/deduct to settle.</p>
          </div>
        `;
        await sendMail({ to: supportInbox, subject, text: messageBody, html });
      } catch (mailErr) {
        console.warn(`[payouts] mailer error for ticket ${ticket._id}: ${mailErr.message}`);
      }
    });

    res.status(201).json({
      message: 'Payout request filed. An admin will review and process it shortly.',
      ticketId: ticket._id,
      amount: requested,
      currency: 'NPR',
      assignedTo: ticket.assignedTo,
      status: ticket.status,
    });
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('PAYOUT_REQUEST_ERROR', err);
    res.status(400).json({ message: err.message || 'Failed to file payout request.' });
  }
});

module.exports = router;
