// One-shot smoke test: pull a real booking, generate the invoice HTML+text,
// write the HTML to disk so the user can open it in a browser, and fire
// sendMail() to prove the mailer path works (will graceful-skip if SMTP
// isn't configured).
//
//   node server/scripts/testInvoiceEmail.js

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
require('../models/User');
require('../models/Hotel');
require('../models/Destination');
const Booking = require('../models/Booking');
const User = require('../models/User');

const { sendMail, isConfigured } = require('../utils/mailer');
const { buildBookingInvoiceHTML, buildBookingInvoiceText } = require('../utils/invoiceTemplate');

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'yaatri' });
  console.log('[test] connected to mongo');

  const booking = await Booking.findOne({})
    .populate('destination', 'name region imageURL')
    .lean();

  if (!booking) {
    console.error('[test] No booking documents in DB to render — create one through the UI first.');
    await mongoose.connection.close();
    process.exit(1);
  }

  const user = await User.findById(booking.user).select('username email _id').lean();
  if (!user) {
    console.error('[test] Booking has no resolvable user. Skipping.');
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log(`[test] sample booking: ${booking._id} → ${booking.destination?.name} for ${user.username} (${user.email || 'no email'})`);
  console.log(`[test] mailer configured: ${isConfigured()}`);

  const html = buildBookingInvoiceHTML({ booking, user, destination: booking.destination });
  const text = buildBookingInvoiceText({ booking, user, destination: booking.destination });

  // Write HTML so the user can preview the email visually.
  const outPath = path.join(__dirname, '..', '..', 'invoice-preview.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`[test] wrote HTML preview → ${outPath}`);

  if (user.email) {
    const subject = `[TEST] Your Yaatri booking — ${booking.destination?.name || 'trip'}`;
    const result = await sendMail({ to: user.email, subject, html, text });
    console.log('[test] sendMail result:', result);
  } else {
    console.warn('[test] user has no email on file — skipping send.');
  }

  await mongoose.connection.close();
  console.log('[test] done.');
};

main().catch(async (err) => {
  console.error('[test] failed:', err);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});
