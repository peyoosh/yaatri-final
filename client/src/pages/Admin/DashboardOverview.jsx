import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const fmtNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtRelative = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

export default function DashboardOverview({ stats: initialStats }) {
  // We accept an `initialStats` prop for first paint (parent Dashboard.jsx already
  // fetches once), then take over with our own polling so the tiles stay live.
  const [stats, setStats] = useState(initialStats || null);
  const [pulseAt, setPulseAt] = useState(0); // bumped on each refresh — drives a subtle "live" indicator
  const [financials, setFinancials] = useState(null);
  const [financialsLoading, setFinancialsLoading] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        if (!cancelled) {
          setStats(data);
          setPulseAt(Date.now());
        }
      } catch (_) { /* leave the previous snapshot on screen */ }
    };
    pull(); // refresh immediately on mount in case parent's snapshot is stale
    const id = setInterval(pull, 30_000); // every 30s — matches a comfortable "live" cadence without hammering Mongo
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Lazy-fetch the marketplace breakdown only when the modal is opened.
  const openFinancials = async () => {
    setShowFinancials(true);
    if (financials) return; // already cached
    setFinancialsLoading(true);
    try {
      const { data } = await api.get('/admin/financials/overview');
      setFinancials(data);
    } catch (err) {
      console.error('Failed to load financials breakdown', err);
    } finally {
      setFinancialsLoading(false);
    }
  };

  const bookings = stats?.bookings || {};
  const topDestinations = stats?.topDestinations || [];
  const recentActivity = stats?.recentActivity || [];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>ADMIN_PANEL_OVERVIEW</h2>
        <span
          key={pulseAt}
          style={{
            fontSize: '0.65rem',
            opacity: 0.55,
            letterSpacing: 2,
            fontFamily: 'monospace',
            color: 'var(--hill-green, #059D72)',
            animation: 'pulse 1.2s ease',
          }}
        >
          ● LIVE — updates every 30s
        </span>
      </div>

      {/* PRIMARY KPIs — driven by real bookings */}
      <div className="summary-grid">
        {/* TOTAL_REVENUE tile is clickable — opens the marketplace breakdown popup */}
        <button
          type="button"
          onClick={openFinancials}
          className="summary-card bg-teal-steel"
          style={{ cursor: 'pointer', textAlign: 'left', border: 'none', position: 'relative', font: 'inherit', color: 'inherit' }}
          title="Click for full marketplace breakdown (commission, forfeit, vendor balances)"
        >
          <span className="card-label">TOTAL_REVENUE</span>
          <span className="card-value">{fmtNPR(stats?.revenue)}</span>
          {Number(stats?.cancelledRevenue) > 0 && (
            <span style={{ fontSize: '0.65rem', opacity: 0.55, marginTop: 4 }}>
              cancelled: {fmtNPR(stats.cancelledRevenue)}
            </span>
          )}
          <span style={{ position: 'absolute', top: 8, right: 10, fontSize: '0.55rem', opacity: 0.5, letterSpacing: 1.5, fontFamily: 'monospace' }}>
            ▸ BREAKDOWN
          </span>
        </button>
        <div className="summary-card bg-teal-steel">
          <span className="card-label">TOTAL_BOOKINGS</span>
          <span className="card-value">{bookings.total ?? 0}</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.55, marginTop: 4 }}>
            {bookings.pending || 0} pending · {bookings.confirmed || 0} confirmed · {bookings.completed || 0} completed
          </span>
        </div>
        <div className="summary-card bg-teal-steel">
          <span className="card-label">REGISTERED_USERS</span>
          <span className="card-value">{stats?.users ?? 0}</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.55, marginTop: 4 }}>
            {stats?.activeGuides || 0} guides · {stats?.hotels || 0} hotels
          </span>
        </div>
        <div className="summary-card bg-teal-steel">
          <span className="card-label">CATALOG_SIZE</span>
          <span className="card-value">{stats?.destinations ?? 0}</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.55, marginTop: 4 }}>
            {stats?.blogs || 0} blogs · est. {Number(stats?.traffic || 0).toLocaleString('en-IN')} visits
          </span>
        </div>
      </div>

      {/* TOP DESTINATIONS BY BOOKING COUNT — replaces the previous placeholder chart */}
      <div className="chart-section">
        <h3 className="section-title">Most Opted Nepal Routes</h3>
        {topDestinations.length === 0 ? (
          <div className="chart-placeholder">
            [ NO BOOKINGS YET — POPULATE_VIA_USER_FLOW ]
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topDestinations.map((d, i) => {
              const maxBookings = topDestinations[0]?.bookings || 1;
              const widthPct = Math.max(8, Math.round((d.bookings / maxBookings) * 100));
              return (
                <div key={d._id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'monospace', opacity: 0.55, fontSize: '0.75rem' }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ position: 'relative', height: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${widthPct}%`,
                        background: 'linear-gradient(90deg, rgba(162,215,41,0.22), rgba(5,157,114,0.4))',
                        borderRight: '1px solid var(--toxic-lime, #A2D729)',
                      }}
                    />
                    <div style={{ position: 'relative', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 700 }}>{d.name}</span>
                      <span style={{ opacity: 0.55 }}>{d.region}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--toxic-lime, #A2D729)', whiteSpace: 'nowrap' }}>
                    {d.bookings}× · {fmtNPR(d.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECENT ACTIVITY — real bookings stream, replaces the static 2024 mock list */}
      <section className="table-section">
        <h3 className="section-title">Recent Booking Activity</h3>
        <div className="table-wrapper">
          {recentActivity.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No booking activity in the system yet.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ACTION</th>
                  <th>STATUS</th>
                  <th>WHEN</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((log) => (
                  <tr key={log.id}>
                    <td className="highlight-text">@{log.user}</td>
                    <td>{log.action}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: log.status === 'cancelled' ? 'rgba(255,77,77,0.12)' : 'rgba(162,215,41,0.15)',
                          color: log.status === 'cancelled' ? '#ff6b6b' : '#A2D729',
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', opacity: 0.6 }}>{fmtRelative(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* MARKETPLACE BREAKDOWN MODAL — opens on TOTAL_REVENUE click. Pulls /admin/financials/overview. */}
      {showFinancials && (
        <div
          onClick={() => setShowFinancials(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--obsidian, #0D0A02)',
              border: '1px solid var(--hill-green, #059D72)',
              borderRadius: 12,
              padding: '2rem',
              maxWidth: 640,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              color: 'var(--himalayan-mist, #F4F2F3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#A2D729', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                  Marketplace breakdown
                </p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Where the money is</h2>
              </div>
              <button
                onClick={() => setShowFinancials(false)}
                style={{ background: 'none', border: 'none', color: '#A6A180', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                aria-label="Close"
              >×</button>
            </div>

            {financialsLoading || !financials ? (
              <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>Loading…</p>
            ) : (
              <>
                {/* Gross revenue at top */}
                <div style={{ background: 'rgba(162,215,41,0.08)', border: '1px solid rgba(162,215,41,0.3)', borderRadius: 8, padding: '1rem 1.2rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.65rem', letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase' }}>Total gross revenue (NPR)</p>
                  <p style={{ fontSize: '2rem', fontWeight: 900, color: '#A2D729', letterSpacing: '-0.02em' }}>
                    {fmtNPR(financials.totalGrossRevenue)}
                  </p>
                  <p style={{ fontSize: '0.7rem', opacity: 0.55, marginTop: 4 }}>
                    From bookings in <code>escrow_held</code> / <code>approved</code> / <code>completed</code> (incl. legacy pending/confirmed)
                  </p>
                </div>

                {/* Two-column split: what Yaatri keeps vs what Yaatri owes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(5,157,114,0.1)', border: '1px solid rgba(5,157,114,0.4)', borderRadius: 8, padding: '1rem' }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase', marginBottom: 6 }}>Platform earnings</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059D72' }}>{fmtNPR(financials.platformNetEarnings)}</p>
                    <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 10, lineHeight: 1.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Commission (15%)</span><span style={{ fontWeight: 700, color: '#A2D729' }}>{fmtNPR(financials.platformBreakdown.commission15Pct)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Forfeit (20%)</span><span style={{ fontWeight: 700, color: '#F4A261' }}>{fmtNPR(financials.platformBreakdown.cancellationForfeit20Pct)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 8, padding: '1rem' }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase', marginBottom: 6 }}>Outstanding payouts owed</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ff6b6b' }}>
                      {fmtNPR(Number(financials.totalOwedToHotels) + Number(financials.totalOwedToGuides))}
                    </p>
                    <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 10, lineHeight: 1.7 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>To {financials.vendorCounts?.hotels || 0} hotel(s)</span><span style={{ fontWeight: 700 }}>{fmtNPR(financials.totalOwedToHotels)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>To {financials.vendorCounts?.guides || 0} guide(s)</span><span style={{ fontWeight: 700 }}>{fmtNPR(financials.totalOwedToGuides)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.7rem', opacity: 0.55, fontStyle: 'italic', textAlign: 'center', marginBottom: '0.5rem' }}>
                  Drain individual vendor balances from <strong>/admin/hotelmanagement</strong> or <strong>/admin/userguidemanagement</strong>.
                </p>
                <p style={{ fontSize: '0.6rem', opacity: 0.35, textAlign: 'center', fontFamily: 'monospace' }}>
                  generated {new Date(financials.generatedAt).toLocaleTimeString()}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
