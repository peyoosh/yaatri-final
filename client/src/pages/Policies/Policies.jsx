import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, RefreshCw, Banknote, Users, ArrowLeft } from 'lucide-react';

export default function Policies() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 pb-20 px-6 lg:px-12 xl:px-20">
      <div className="w-full max-w-4xl">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-brand-blue hover:underline cursor-pointer mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-2">Yaatri · Policies</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-brand-slate mb-3">The Yaatri Contract</h1>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            We keep our policies short, plain, and binding. When you book or list a service on Yaatri,
            you agree to the terms below. Last updated: <strong className="text-brand-slate">{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</strong>.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">

          <PolicySection icon={AlertTriangle} title="1. Cancellation & 20% structural forfeit" accent="text-red-500" iconBg="bg-red-50">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Every booking on Yaatri is binding from the moment it is placed. When a traveller cancels a confirmed
              or pending booking, the platform applies a flat <strong className="text-red-500">20% cancellation fee</strong> on
              the gross booking value. The remaining <strong className="text-brand-green">80% is refunded to the traveller</strong> within 5–7 business days.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-600 leading-relaxed mb-4">
              <strong className="text-brand-slate block mb-1">Worked example.</strong>
              A NPR 25,000 booking is cancelled.<br />
              → Refund eligible: <span className="text-brand-green font-bold">NPR 20,000 (80%)</span><br />
              → Cancellation fee: <span className="text-red-500 font-bold">NPR 5,000 (20%, retained by Yaatri)</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Once a trip is marked <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">completed</code>, it can no longer be cancelled.
              Bookings already in <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">cancelled</code> state cannot be re-cancelled or modified.
            </p>
          </PolicySection>

          <PolicySection icon={Banknote} title="2. Marketplace commission (15%)" accent="text-brand-blue" iconBg="bg-brand-blue/10">
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Yaatri is a three-tier marketplace: traveller, guide, hotel partner. On every successful booking, the platform
              retains a flat <strong className="text-brand-blue">15% commission</strong> from the gross transaction.
              The remaining <strong className="text-brand-slate">85%</strong> is fanned out to the active vendors on the trip:
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed space-y-1 pl-4 list-disc">
              <li><strong className="text-brand-slate">Assigned guide</strong> — 85% of (guide rate × travellers × days)</li>
              <li><strong className="text-brand-slate">Linked hotel-owner(s)</strong> — even split of the remaining vendor share</li>
            </ul>
          </PolicySection>

          <PolicySection icon={RefreshCw} title="3. Vendor payouts" accent="text-brand-green" iconBg="bg-brand-green/10">
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Earnings accumulate on each vendor's <strong className="text-brand-slate">vendor ledger</strong> as <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">pendingPayout</code>.
              Vendors may request a withdrawal at any time via <strong className="text-brand-slate">Dashboard → Request payout</strong>. Requests
              land in the Yaatri admin payout queue and are typically settled within 3–5 business days.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              When a booking is <strong className="text-brand-slate">cancelled</strong>, any vendor ledger credits attached to that booking are
              <strong className="text-red-500"> reversed in full</strong>. Vendors do not earn from cancelled trips.
            </p>
          </PolicySection>

          <PolicySection icon={Users} title="4. Vendor conduct" accent="text-brand-saffron" iconBg="bg-brand-saffron/10">
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Guides and hotel-owners are independent operators contracted via the Yaatri platform. By accepting assignments, vendors agree to:
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed space-y-1 pl-4 list-disc">
              <li>Honour confirmed bookings unless a force-majeure (illness, weather, government order) intervenes</li>
              <li>Maintain valid licensing as required by Nepali tourism regulations</li>
              <li>Communicate any disruption to the traveller and the Yaatri admin within 24 hours</li>
              <li>Decline assignments outside their stated capacity (no overbooking)</li>
            </ul>
          </PolicySection>

          <PolicySection icon={ShieldCheck} title="5. Data & privacy" accent="text-brand-pink" iconBg="bg-brand-pink/10">
            <p className="text-sm text-gray-600 leading-relaxed">
              Yaatri stores user profile images and blog photos as compressed Base64 strings inside the primary MongoDB database.
              We do not share account data with third parties beyond what is required to fulfil bookings (e.g. sharing traveller name
              + contact with the assigned guide and hotel for that trip). Users may request deletion of their account by emailing{' '}
              <a href="mailto:peyooshyaatri@gmail.com" className="text-brand-blue hover:underline">peyooshyaatri@gmail.com</a>.
            </p>
          </PolicySection>

          <PolicySection icon={ShieldCheck} title="6. Disputes" accent="text-brand-blue" iconBg="bg-brand-blue/10">
            <p className="text-sm text-gray-600 leading-relaxed">
              Any dispute regarding a booking, payout, or vendor conduct must be filed via <strong className="text-brand-slate">/support</strong> with
              a clear description and reference number. The Yaatri support team triages within 48 hours. If support cannot resolve the issue,
              the ticket is escalated to a system administrator for a final determination. Yaatri's determination is binding under the terms above.
            </p>
          </PolicySection>

        </div>

        <p className="mt-10 text-[10px] text-gray-400 text-center font-mono">
          [ END_OF_CONTRACT ] · Yaatri Hub · Lalitpur, Nepal
        </p>

      </div>
    </div>
  );
}

function PolicySection({ icon: Icon, title, children, accent, iconBg }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-4.5 h-4.5 ${accent}`} size={18} />
        </div>
        <h2 className="text-base font-bold text-brand-slate">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}
