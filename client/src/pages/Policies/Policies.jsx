import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, RefreshCw, Banknote, Users, ArrowLeft } from 'lucide-react';

// Static policies / contract page. Linked from the Footer + Booking cancellation receipts.
// Wording is plain and binding so users know exactly what they're agreeing to.
const Policies = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--obsidian, #0D0A02)', color: 'var(--himalayan-mist, #F4F2F3)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '4rem 6% 2rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#A2D729', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <p style={{ fontSize: '0.7rem', letterSpacing: 3, color: 'var(--hill-green, #059D72)', fontWeight: 700, textTransform: 'uppercase' }}>Yaatri · Policies</p>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0.5rem 0 0.75rem' }}>The Yaatri Contract</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.6, maxWidth: 680 }}>
          We keep our policies short, plain, and binding. When you book or list a service on Yaatri,
          you agree to the terms below. Last updated: <strong>May 2026</strong>.
        </p>

        {/* CANCELLATION POLICY — the 20% forfeit */}
        <Section icon={AlertTriangle} title="1. Cancellation & 20% structural forfeit" accent="#ff6b6b">
          <p>
            Every booking on Yaatri is binding from the moment it is placed. When a traveller cancels a confirmed
            or pending booking, the platform applies a flat <strong style={{ color: '#ff6b6b' }}>20% cancellation
            fee</strong> on the gross booking value. The remaining <strong style={{ color: '#A2D729' }}>80% is
            refunded to the traveller</strong> within 5–7 business days via the original payment channel.
          </p>
          <ExampleBlock>
            <strong>Worked example.</strong> A NPR 25,000 booking is cancelled.<br />
            → Refund eligible:&nbsp; <span style={{ color: '#A2D729' }}>NPR 20,000 (80%)</span><br />
            → Cancellation fee: <span style={{ color: '#ff6b6b' }}>NPR 5,000 (20%, retained by Yaatri)</span>
          </ExampleBlock>
          <p>
            Once a trip is marked <code>completed</code> by the system or admin, it can no longer be cancelled.
            Bookings already in <code>cancelled</code> state cannot be re-cancelled or modified.
          </p>
        </Section>

        {/* MARKETPLACE COMMISSION */}
        <Section icon={Banknote} title="2. Marketplace commission (15%)">
          <p>
            Yaatri is a three-tier marketplace: traveller, guide, hotel partner. On every successful booking, the platform
            retains a flat <strong style={{ color: '#A2D729' }}>15% commission</strong> from the gross transaction.
            The remaining <strong>85%</strong> is fanned out to the active vendors on the trip:
          </p>
          <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7 }}>
            <li><strong>Assigned guide</strong> — 85% of (guide rate × travellers × days)</li>
            <li><strong>Linked hotel-owner(s)</strong> — even split of the remaining vendor share</li>
          </ul>
        </Section>

        {/* PAYOUT POLICY */}
        <Section icon={RefreshCw} title="3. Vendor payouts">
          <p>
            Earnings accumulate on each vendor's <strong>vendor ledger</strong> as <code>pendingPayout</code>.
            Vendors may request a withdrawal at any time via <strong>Dashboard → Request payout</strong>. Requests
            land in the Yaatri admin payout queue and are typically settled within 3–5 business days. Payments are
            issued via bank transfer to the account on file.
          </p>
          <p>
            When a booking is <strong>cancelled</strong>, any vendor ledger credits attached to that booking are
            <strong style={{ color: '#ff6b6b' }}> reversed in full</strong>. Vendors do not earn from cancelled trips.
          </p>
        </Section>

        {/* VENDOR CONDUCT */}
        <Section icon={Users} title="4. Vendor conduct">
          <p>
            Guides and hotel-owners are independent operators contracted via the Yaatri platform. By accepting
            assignments through Yaatri, vendors agree to:
          </p>
          <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7 }}>
            <li>Honour confirmed bookings unless a force-majeure (illness, weather, government order) intervenes</li>
            <li>Maintain valid licensing as required by Nepali tourism regulations</li>
            <li>Communicate any disruption to the traveller and the Yaatri admin within 24 hours</li>
            <li>Decline assignments outside their stated capacity (no overbooking)</li>
          </ul>
        </Section>

        {/* DATA & PRIVACY */}
        <Section icon={ShieldCheck} title="5. Data & privacy">
          <p>
            Yaatri stores user profile images (avatars) and blog photos as compressed Base64 strings inside the
            primary MongoDB database. We do not share account data with third parties beyond what is required to
            fulfil bookings (e.g. sharing traveller name + contact with the assigned guide and hotel for that trip).
            Users may request deletion of their account by emailing
            {' '}
            <a href="mailto:peyooshyaatri@gmail.com" style={{ color: 'var(--hill-green, #059D72)' }}>peyooshyaatri@gmail.com</a>.
          </p>
        </Section>

        {/* DISPUTES */}
        <Section icon={ShieldCheck} title="6. Disputes">
          <p>
            Any dispute regarding a booking, payout, or vendor conduct must be filed via{' '}
            <strong>/support</strong> with a clear description and reference number. The Yaatri support team
            triages within 48 hours. If support cannot resolve the issue, the ticket is escalated to a system
            administrator for a final determination. Yaatri's determination is binding under the terms above.
          </p>
        </Section>

        <p style={{ marginTop: '3rem', fontSize: '0.75rem', opacity: 0.5, textAlign: 'center', fontFamily: 'monospace' }}>
          [ END_OF_CONTRACT ] · Yaatri Hub · Lalitpur, Nepal
        </p>
      </div>
    </div>
  );
};

const Section = ({ icon: Icon, title, children, accent = 'var(--hill-green, #059D72)' }) => (
  <section style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
      <Icon size={18} style={{ color: accent }} />
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h2>
    </div>
    <div style={{ fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.85 }}>{children}</div>
  </section>
);

const ExampleBlock = ({ children }) => (
  <div style={{
    margin: '1rem 0',
    padding: '0.85rem 1.1rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(162,215,41,0.3)',
    borderRadius: 6,
    fontSize: '0.85rem',
    lineHeight: 1.65,
  }}>
    {children}
  </div>
);

export default Policies;
