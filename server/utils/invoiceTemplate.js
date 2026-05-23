// Builds the HTML body for the booking-confirmation invoice email.
// Layout follows the Yaatri invoice spec: section 1 = header/branding, 2 = guest matrix,
// 3 = itemized line-items, 4 = aggregated totals + tax tiers, 5 = empty-state safeguards.
//
// Email-safe rules: only inline styles, table-based layout, web-safe fonts, no JS.

const palette = {
  obsidian: '#0D0A02',
  tealSteel: '#1A434E',
  hillGreen: '#059D72',
  toxicLime: '#A2D729',
  teraiHarvest: '#A6A180',
  himalayanMist: '#F4F2F3',
  divider: '#2A3A3F',
};

const fmtNPR = (n) =>
  'NPR ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const fmtTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

// Build a single table row for the itemized grid (section 3).
const lineItemRow = ({ description, quantity, rate, comment, amount }) => `
  <tr>
    <td style="padding:12px 14px; border-bottom:1px solid ${palette.divider}; font-size:13px; color:${palette.himalayanMist}; font-weight:700;">${escapeHtml(description)}</td>
    <td style="padding:12px 14px; border-bottom:1px solid ${palette.divider}; font-size:13px; color:${palette.himalayanMist}; text-align:center;">${quantity === null || quantity === undefined || quantity === '' ? '—' : escapeHtml(quantity)}</td>
    <td style="padding:12px 14px; border-bottom:1px solid ${palette.divider}; font-size:13px; color:${palette.himalayanMist}; text-align:right;">${rate === null || rate === undefined || rate === '' ? '—' : fmtNPR(rate)}</td>
    <td style="padding:12px 14px; border-bottom:1px solid ${palette.divider}; font-size:12px; color:${palette.teraiHarvest}; font-style:italic;">${escapeHtml(comment || '')}</td>
    <td style="padding:12px 14px; border-bottom:1px solid ${palette.divider}; font-size:13px; color:${palette.toxicLime}; text-align:right; font-weight:800;">${fmtNPR(amount)}</td>
  </tr>
`;

// Section 5: clean empty-state — used when a booking has no line items (defensive).
const emptyStateRow = () => `
  <tr>
    <td colspan="5" style="padding:30px 14px; text-align:center; color:${palette.teraiHarvest}; font-size:13px; font-style:italic; border-bottom:1px solid ${palette.divider};">
      No line items recorded for this booking. Contact support if you believe this is an error.
    </td>
  </tr>
`;

// Derive the line items from a booking. Returns at least one row when possible,
// otherwise an empty array (caller renders empty-state).
const buildLineItems = (booking) => {
  const items = [];
  const p = booking.pricing || {};
  const t = Number(booking.travelers) || 1;
  const d = Number(booking.durationDays) || 1;
  const destName = booking.destination?.name || 'Destination';

  // Primary: trip base rate × travelers × days
  if (p.subtotal && p.subtotal > 0) {
    items.push({
      description: 'TRIP CHARGES',
      quantity: `${t} traveller${t > 1 ? 's' : ''} × ${d} day${d > 1 ? 's' : ''}`,
      rate: p.baseRate,
      comment: destName,
      amount: p.subtotal,
    });
  }

  // Add-on line items
  const addOnRates = { guide: 1500, 'premium-lodging': 2000, transport: 800, meals: 600 };
  const addOnLabels = {
    guide: 'GUIDE SERVICE',
    'premium-lodging': 'PREMIUM LODGING',
    transport: 'TRANSPORT',
    meals: 'MEALS PACKAGE',
  };
  const addOnComments = {
    guide: 'Certified local trail guide',
    'premium-lodging': 'Upgraded room category',
    transport: 'Door-to-trailhead vehicle',
    meals: 'Full board (B/L/D)',
  };

  (p.addOns || []).forEach((a) => {
    const rate = addOnRates[a];
    if (!rate) return;
    const amt = rate * t * d;
    items.push({
      description: addOnLabels[a] || a.toUpperCase(),
      quantity: `${t} × ${d}`,
      rate,
      comment: addOnComments[a] || '',
      amount: amt,
    });
  });

  return items;
};

// Section 2: build the operational matrix data (guest + ops).
const buildOpsMatrix = (booking, user) => {
  const created = booking.createdAt || new Date();
  const start = booking.startDate;
  const end = booking.endDate;
  const invoiceId = `YAA-${String(booking._id).slice(-8).toUpperCase()}`;
  const accountId = String(user?._id || '').slice(-8).toUpperCase();

  return {
    invoiceId,
    accountId,
    tripId: String(booking._id).slice(-6).toUpperCase(),
    arrivalDate: fmtDate(start),
    departureDate: fmtDate(end),
    checkInTime: start ? fmtTime(start) : '—',
    checkOutTime: end ? fmtTime(end) : '—',
    checkedInBy: 'YAATRI_AUTO',
    checkedOutBy: 'TBD',
    invoiceDate: fmtDate(created),
  };
};

// Main entry: build the full HTML email body.
const buildBookingInvoiceHTML = ({ booking, user, destination }) => {
  const p = booking.pricing || {};
  const items = buildLineItems(booking);
  const ops = buildOpsMatrix(booking, user);

  // Section 4: tax tiers (4% state + 12% GST), computed off the subtotal+addons base.
  const baseForTax = Number(p.subtotal || 0) + Number(p.addOnTotal || 0);
  const stateTax = p.stateTax != null ? Number(p.stateTax) : Math.round(baseForTax * 0.04);
  const gst = p.gst != null ? Number(p.gst) : Math.round(baseForTax * 0.12);
  const grandTotal = p.totalCost != null ? Number(p.totalCost) : baseForTax + stateTax + gst;

  const guestName = (user?.username || 'Guest').toUpperCase();
  const guestPrefix = /^(mr|mrs|ms|dr)\b/i.test(user?.username || '') ? '' : 'MR./MS.';
  const userEmail = user?.email || '';

  const destinationName = destination?.name || booking.destination?.name || 'Destination';
  const destinationRegion = destination?.region || booking.destination?.region || '';
  const hotelAvatar = '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yaatri — Booking Invoice</title>
</head>
<body style="margin:0; padding:0; background:${palette.obsidian}; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color:${palette.himalayanMist};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${palette.obsidian}; padding:24px 0;">
    <tr><td align="center">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:640px; max-width:100%; background:${palette.obsidian}; border:1px solid ${palette.divider}; border-radius:10px; overflow:hidden;">

        <!-- ═══════════════ SECTION 1 — HEADER & BRANDING ═══════════════ -->
        <tr>
          <td style="background:linear-gradient(135deg, ${palette.tealSteel} 0%, ${palette.obsidian} 100%); padding:36px 36px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Left typography block -->
                <td style="vertical-align:top;">
                  <h1 style="margin:0; font-size:38px; font-weight:900; letter-spacing:-1px; color:${palette.himalayanMist}; line-height:1;">INVOICE</h1>
                  <p style="margin:10px 0 0; color:${palette.toxicLime}; font-size:13px; font-weight:800; letter-spacing:2px; text-transform:uppercase;">YAATRI HUB · ${escapeHtml(destinationName.toUpperCase())}</p>
                  <p style="margin:14px 0 2px; color:${palette.teraiHarvest}; font-size:12px;">Lazimpat Road, Kathmandu</p>
                  <p style="margin:0 0 2px; color:${palette.teraiHarvest}; font-size:12px;">${escapeHtml(destinationRegion || 'Bagmati Province')}, Nepal</p>
                  <p style="margin:0; color:${palette.teraiHarvest}; font-size:12px;">
                    <a href="https://yaatri-final.onrender.com" style="color:${palette.hillGreen}; text-decoration:none;">yaatri.np</a>
                  </p>
                </td>
                <!-- Right branding block -->
                <td style="vertical-align:top; text-align:right; width:140px;">
                  ${hotelAvatar ? `<img src="${hotelAvatar}" alt="brand" width="84" height="84" style="display:inline-block; border-radius:50%; border:2px solid ${palette.toxicLime};" />` : `
                    <div style="display:inline-block; width:84px; height:84px; border-radius:50%; border:2px solid ${palette.toxicLime}; background:${palette.obsidian}; line-height:84px; text-align:center; color:${palette.toxicLime}; font-weight:900; font-size:22px;">Y</div>
                  `}
                  <p style="margin:14px 0 0; font-size:10px; color:${palette.teraiHarvest}; letter-spacing:2px;">PROCESSED</p>
                  <p style="margin:2px 0 0; font-size:13px; color:${palette.himalayanMist}; font-weight:700;">${ops.invoiceDate}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══════════════ SECTION 2 — GUEST & OPS MATRIX ═══════════════ -->
        <tr>
          <td style="padding:24px 36px 8px;">
            <p style="margin:0; font-size:14px; font-weight:600; letter-spacing:4px; color:${palette.himalayanMist}; text-transform:uppercase;">
              ${guestPrefix ? guestPrefix + ' ' : ''}${escapeHtml(guestName)}
            </p>
            ${userEmail ? `<p style="margin:4px 0 0; font-size:11px; color:${palette.teraiHarvest};">${escapeHtml(userEmail)}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 36px 30px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.03); border:1px solid ${palette.divider}; border-radius:8px;">
              <tr>
                <!-- Left column: identifiers -->
                <td style="vertical-align:top; padding:18px 22px; border-right:1px solid ${palette.divider}; width:50%;">
                  ${[
                    ['Invoice No.', ops.invoiceId],
                    ['Account ID', ops.accountId],
                    ['Trip Reference', ops.tripId],
                    ['Arrival Date', ops.arrivalDate],
                    ['Departure Date', ops.departureDate],
                  ].map(([k, v]) => `
                    <p style="margin:0 0 8px; font-size:12px; color:${palette.teraiHarvest};">
                      <span style="display:inline-block; min-width:120px; letter-spacing:1px; text-transform:uppercase; font-size:10px;">${escapeHtml(k)}</span>
                      <span style="color:${palette.himalayanMist}; font-weight:700;">${escapeHtml(v)}</span>
                    </p>
                  `).join('')}
                </td>
                <!-- Right column: operational -->
                <td style="vertical-align:top; padding:18px 22px; width:50%;">
                  ${[
                    ['Check-in Time', ops.checkInTime],
                    ['Check-out Time', ops.checkOutTime],
                    ['Checked In By', ops.checkedInBy],
                    ['Checked Out By', ops.checkedOutBy],
                    ['Status', String(booking.status || 'pending').toUpperCase()],
                  ].map(([k, v]) => `
                    <p style="margin:0 0 8px; font-size:12px; color:${palette.teraiHarvest};">
                      <span style="display:inline-block; min-width:120px; letter-spacing:1px; text-transform:uppercase; font-size:10px;">${escapeHtml(k)}</span>
                      <span style="color:${palette.himalayanMist}; font-weight:700;">${escapeHtml(v)}</span>
                    </p>
                  `).join('')}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══════════════ SECTION 3 — ITEMIZED TRANSACTION GRID ═══════════════ -->
        <tr>
          <td style="padding:0 36px;">
            <p style="margin:0 0 10px; font-size:11px; letter-spacing:3px; color:${palette.toxicLime}; font-weight:800;">// ITEMIZED CHARGES</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; background:rgba(255,255,255,0.02); border:1px solid ${palette.divider}; border-radius:8px; overflow:hidden;">
              <thead>
                <tr style="background:${palette.tealSteel};">
                  <th style="padding:12px 14px; text-align:left; font-size:10px; letter-spacing:2px; color:${palette.himalayanMist}; font-weight:800;">DESCRIPTION</th>
                  <th style="padding:12px 14px; text-align:center; font-size:10px; letter-spacing:2px; color:${palette.himalayanMist}; font-weight:800;">QTY</th>
                  <th style="padding:12px 14px; text-align:right; font-size:10px; letter-spacing:2px; color:${palette.himalayanMist}; font-weight:800;">RATE</th>
                  <th style="padding:12px 14px; text-align:left; font-size:10px; letter-spacing:2px; color:${palette.himalayanMist}; font-weight:800;">COMMENT</th>
                  <th style="padding:12px 14px; text-align:right; font-size:10px; letter-spacing:2px; color:${palette.himalayanMist}; font-weight:800;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${items.length === 0 ? emptyStateRow() : items.map(lineItemRow).join('')}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- ═══════════════ SECTION 4 — TOTALS & TAX TIERS ═══════════════ -->
        <tr>
          <td style="padding:28px 36px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Loyalty token (left) -->
                <td style="vertical-align:bottom;">
                  <p style="margin:0; font-size:11px; color:${palette.teraiHarvest}; letter-spacing:1.5px; text-transform:uppercase;">Loyalty</p>
                  <p style="margin:6px 0 0; font-size:13px; color:${palette.himalayanMist};">
                    <span style="color:${palette.toxicLime}; font-weight:800;">+${Math.max(1, Math.floor(Number(grandTotal) / 100))} Yaatri Points</span>
                    have been credited to your account.
                  </p>
                </td>
                <!-- Aggregations (right) -->
                <td style="vertical-align:top; text-align:right; width:260px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:4px 0; font-size:12px; color:${palette.teraiHarvest}; text-transform:uppercase; letter-spacing:1.5px;">Subtotal</td>
                      <td style="padding:4px 0; font-size:13px; color:${palette.himalayanMist}; font-weight:700; text-align:right;">${fmtNPR(baseForTax)}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; font-size:12px; color:${palette.teraiHarvest}; text-transform:uppercase; letter-spacing:1.5px;">State Tax (4%)</td>
                      <td style="padding:4px 0; font-size:13px; color:${palette.himalayanMist}; text-align:right;">${fmtNPR(stateTax)}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0; font-size:12px; color:${palette.teraiHarvest}; text-transform:uppercase; letter-spacing:1.5px;">GST / Local VAT (12%)</td>
                      <td style="padding:4px 0; font-size:13px; color:${palette.himalayanMist}; text-align:right;">${fmtNPR(gst)}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="border-top:1px solid ${palette.divider}; padding-top:10px;"></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0 0; font-size:13px; color:${palette.toxicLime}; font-weight:900; letter-spacing:2px; text-transform:uppercase;">Grand Total</td>
                      <td style="padding:6px 0 0; font-size:20px; color:${palette.toxicLime}; font-weight:900; text-align:right;">${fmtNPR(grandTotal)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Closing banner -->
        <tr>
          <td style="background:linear-gradient(90deg, ${palette.toxicLime} 0%, ${palette.hillGreen} 100%); padding:18px 36px; text-align:center;">
            <p style="margin:0; color:${palette.obsidian}; font-size:14px; font-weight:900; letter-spacing:3px; text-transform:uppercase;">WE HOPE YOU HAVE A GREAT TRIP!</p>
          </td>
        </tr>

        <!-- Fine print -->
        <tr>
          <td style="padding:18px 36px 30px; text-align:center;">
            <p style="margin:0; font-size:10px; color:${palette.teraiHarvest}; line-height:1.6;">
              This is a system-generated invoice. Keep it as proof of booking. Reach us at
              <a href="mailto:${process.env.SUPPORT_INBOX || 'peyoosh@yaatri.np'}" style="color:${palette.hillGreen}; text-decoration:none;">${process.env.SUPPORT_INBOX || 'peyoosh@yaatri.np'}</a>
              for changes or cancellations.
            </p>
            <p style="margin:8px 0 0; font-size:10px; color:${palette.divider};">© Yaatri Hub · ${new Date().getFullYear()}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;
};

// Plain-text fallback for clients that block HTML.
const buildBookingInvoiceText = ({ booking, user, destination }) => {
  const p = booking.pricing || {};
  const items = buildLineItems(booking);
  const ops = buildOpsMatrix(booking, user);
  const destName = destination?.name || booking.destination?.name || 'Destination';
  const baseForTax = Number(p.subtotal || 0) + Number(p.addOnTotal || 0);
  const stateTax = p.stateTax != null ? Number(p.stateTax) : Math.round(baseForTax * 0.04);
  const gst = p.gst != null ? Number(p.gst) : Math.round(baseForTax * 0.12);
  const grandTotal = p.totalCost != null ? Number(p.totalCost) : baseForTax + stateTax + gst;

  return [
    '═══ YAATRI HUB — BOOKING INVOICE ═══',
    '',
    `Invoice No:   ${ops.invoiceId}`,
    `Date:         ${ops.invoiceDate}`,
    `Guest:        ${(user?.username || 'Guest').toUpperCase()}`,
    `Destination:  ${destName}`,
    `Arrival:      ${ops.arrivalDate}`,
    `Departure:    ${ops.departureDate}`,
    `Status:       ${String(booking.status || 'pending').toUpperCase()}`,
    '',
    '── LINE ITEMS ──',
    ...(items.length === 0 ? ['  (no line items)']
        : items.map((i) => `  ${i.description.padEnd(20)}  ${String(i.quantity || '').padEnd(18)}  ${('NPR ' + (i.amount || 0)).padStart(12)}`)),
    '',
    '── TOTALS ──',
    `  Subtotal:         NPR ${baseForTax.toLocaleString('en-IN')}`,
    `  State Tax (4%):   NPR ${stateTax.toLocaleString('en-IN')}`,
    `  GST/VAT (12%):    NPR ${gst.toLocaleString('en-IN')}`,
    `  GRAND TOTAL:      NPR ${grandTotal.toLocaleString('en-IN')}`,
    '',
    'We hope you have a great trip!  — Yaatri Hub',
  ].join('\n');
};

module.exports = { buildBookingInvoiceHTML, buildBookingInvoiceText };
