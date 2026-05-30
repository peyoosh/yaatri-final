import React from 'react';
import VendorLedgerTable from './VendorLedgerTable';

// Admin hotel manager — vendor-ledger-centric view. Lists every user with the
// hotel role, shows their earnings, paid-out, and outstanding payout balance,
// and gives admin a one-click "Pay" button that drains the pending balance
// via POST /api/admin/payouts/deduct.
//
// (The legacy Hotel collection still exists for destination<->hotel linking,
// but operationally the source of truth for vendor finance is User.vendorLedger.)
export default function HotelManager() {
  return (
    <VendorLedgerTable
      role="hotel"
      title="HOTEL_PARTNER_LEDGER"
      secondaryColumn={{
        label: 'BASE RATE / NIGHT',
        getter: (v) => v.profileData?.baseRoomRate ? `NPR ${Number(v.profileData.baseRoomRate).toLocaleString('en-IN')}` : '—',
      }}
    />
  );
}
