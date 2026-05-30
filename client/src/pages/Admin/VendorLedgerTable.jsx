import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { Banknote, Send, RefreshCw } from 'lucide-react';

const fmtNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;

// Reusable admin table that lists vendors (hotel or guide), their ledger numbers,
// and lets admin trigger a manual payout via POST /api/admin/payouts/deduct.
//
// Props:
//   role            'hotel' | 'guide'  — drives the /api/admin/providers query
//   title           string             — page heading text
//   secondaryColumn { label, getter }  — extra column specific to this role (e.g. rate/day, base rate)
const VendorLedgerTable = ({ role, title, secondaryColumn }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/providers?role=${role}`);
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load vendors', err);
      setFeedback({ kind: 'err', text: err?.response?.data?.message || 'Could not load vendor list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [role]);

  const totals = useMemo(() => {
    return vendors.reduce(
      (acc, v) => {
        const l = v.vendorLedger || {};
        acc.earned += Number(l.totalEarned || 0);
        acc.withdrawn += Number(l.totalWithdrawn || 0);
        acc.pending += Number(l.pendingPayout || 0);
        return acc;
      },
      { earned: 0, withdrawn: 0, pending: 0 }
    );
  }, [vendors]);

  const handlePay = async (vendor) => {
    const ledger = vendor.vendorLedger || {};
    const max = Number(ledger.pendingPayout || 0);
    if (max <= 0) {
      window.alert(`${vendor.username} has no pending balance to pay out.`);
      return;
    }
    const input = window.prompt(
      `Pay out NPR amount to @${vendor.username}?\n\n` +
      `Pending balance: NPR ${max.toLocaleString('en-IN')}\n` +
      `Already paid:    NPR ${Number(ledger.totalWithdrawn || 0).toLocaleString('en-IN')}\n\n` +
      `Enter amount (max ${max}):`,
      String(max)
    );
    if (input === null) return;
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Invalid amount.');
      return;
    }
    if (amount > max) {
      window.alert(`Amount NPR ${amount} exceeds pending balance NPR ${max}.`);
      return;
    }
    setBusyId(vendor._id);
    try {
      const { data } = await api.post('/admin/payouts/deduct', { vendorId: vendor._id, amountPaid: amount });
      // Patch the local row with the canonical ledger from the server.
      setVendors((prev) => prev.map((v) => (v._id === vendor._id ? { ...v, vendorLedger: data.vendorLedger } : v)));
      setFeedback({ kind: 'ok', text: data.message });
    } catch (err) {
      setFeedback({ kind: 'err', text: err?.response?.data?.message || 'Payout failed.' });
    } finally {
      setBusyId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>{title}</h2>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--hill-green, #059D72)',
            padding: '0.4rem 0.85rem', borderRadius: 999, cursor: loading ? 'wait' : 'pointer',
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1.5,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> REFRESH
        </button>
      </div>

      {feedback && (
        <div style={{
          margin: '1rem 0 0',
          padding: '0.7rem 1rem',
          borderRadius: 6,
          background: feedback.kind === 'ok' ? 'rgba(162,215,41,0.1)' : 'rgba(255,107,107,0.1)',
          color: feedback.kind === 'ok' ? '#A2D729' : '#ff6b6b',
          border: `1px solid ${feedback.kind === 'ok' ? '#A2D729' : '#ff6b6b'}`,
          fontSize: '0.8rem',
        }}>
          {feedback.text}
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', margin: '1.25rem 0' }}>
        <KpiCard label="Vendors active" value={vendors.length} accent="#A2D729" />
        <KpiCard label="Lifetime earned" value={fmtNPR(totals.earned)} accent="#059D72" />
        <KpiCard label="Already paid out" value={fmtNPR(totals.withdrawn)} accent="#F4A261" />
        <KpiCard label="Outstanding owed" value={fmtNPR(totals.pending)} accent="#ff6b6b" emphasized />
      </div>

      <section className="table-section">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>VENDOR</th>
                <th>EMAIL</th>
                {secondaryColumn && <th>{secondaryColumn.label}</th>}
                <th style={{ textAlign: 'right' }}>EARNED</th>
                <th style={{ textAlign: 'right' }}>PAID</th>
                <th style={{ textAlign: 'right' }}>OWED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading vendors…</td></tr>
              ) : vendors.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No {role === 'guide' ? 'guides' : 'hotels'} registered yet.</td></tr>
              ) : (
                vendors.map((v) => {
                  const l = v.vendorLedger || {};
                  const pending = Number(l.pendingPayout || 0);
                  const acting = busyId === v._id;
                  return (
                    <tr key={v._id}>
                      <td className="highlight-text">@{v.username}</td>
                      <td style={{ fontSize: '0.8rem' }}>{v.email || '—'}</td>
                      {secondaryColumn && (
                        <td style={{ fontSize: '0.8rem' }}>{secondaryColumn.getter(v)}</td>
                      )}
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmtNPR(l.totalEarned)}</td>
                      <td style={{ textAlign: 'right', opacity: 0.7 }}>{fmtNPR(l.totalWithdrawn)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: pending > 0 ? '#ff6b6b' : 'var(--text-muted, #A6A180)' }}>
                        {fmtNPR(pending)}
                      </td>
                      <td className="actions-cell">
                        <button
                          disabled={acting || pending <= 0}
                          onClick={() => handlePay(v)}
                          className="action-btn"
                          style={{
                            background: pending > 0 ? '#A2D729' : 'rgba(255,255,255,0.04)',
                            color: pending > 0 ? '#0D0A02' : 'var(--text-muted, #A6A180)',
                            border: 'none',
                            padding: '0.4rem 0.85rem',
                            borderRadius: 4,
                            cursor: pending > 0 ? (acting ? 'wait' : 'pointer') : 'not-allowed',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title={pending > 0 ? `Pay out up to NPR ${pending.toLocaleString('en-IN')}` : 'No pending balance'}
                        >
                          <Send size={11} /> PAY
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const KpiCard = ({ label, value, accent, emphasized }) => (
  <div style={{
    background: emphasized ? `${accent}10` : 'rgba(255,255,255,0.02)',
    border: `1px solid ${emphasized ? accent + '66' : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 8,
    padding: '0.85rem 1rem',
  }}>
    <p style={{ fontSize: '0.6rem', opacity: 0.55, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Banknote size={11} style={{ color: accent }} /> {label}
    </p>
    <p style={{ fontSize: '1.3rem', fontWeight: 900, color: accent, letterSpacing: '-0.01em' }}>{value}</p>
  </div>
);

export default VendorLedgerTable;
