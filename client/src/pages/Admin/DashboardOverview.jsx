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
        <div className="summary-card bg-teal-steel">
          <span className="card-label">TOTAL_REVENUE</span>
          <span className="card-value">{fmtNPR(stats?.revenue)}</span>
          {Number(stats?.cancelledRevenue) > 0 && (
            <span style={{ fontSize: '0.65rem', opacity: 0.55, marginTop: 4 }}>
              cancelled: {fmtNPR(stats.cancelledRevenue)}
            </span>
          )}
        </div>
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
    </>
  );
}
