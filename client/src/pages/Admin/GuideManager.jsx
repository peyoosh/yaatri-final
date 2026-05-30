import React from 'react';
import VendorLedgerTable from './VendorLedgerTable';

// Admin guide manager — same vendor-ledger shell as HotelManager, but with a
// rate-per-day column instead of base-rate-per-night.
//
// The previous version of this page accepted a `safetyConcerns` prop and
// rendered mocked incident logs; that prop is now optional and unused —
// concerns belong on the operational reports page when we build one.
export default function GuideManager({ safetyConcerns } = {}) {
  void safetyConcerns; // legacy prop, silently ignored
  return (
    <VendorLedgerTable
      role="guide"
      title="GUIDE_LEDGER"
      secondaryColumn={{
        label: 'RATE / DAY',
        getter: (v) => v.profileData?.ratePerDay ? `NPR ${Number(v.profileData.ratePerDay).toLocaleString('en-IN')}` : '—',
      }}
    />
  );
}
