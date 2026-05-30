import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Calendar, MapPin, Users, Compass, Banknote, Award } from 'lucide-react';

const fmtNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtRelative = (d) => {
  if (!d) return '';
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.round(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days > 1 && days < 7) return `in ${days} days`;
  if (days < 0) return `${Math.abs(days)}d ago`;
  return '';
};

const STATUS_COLORS = {
  pending:   { fg: '#F4A261', bg: 'rgba(244,162,97,0.12)' },
  confirmed: { fg: '#A2D729', bg: 'rgba(162,215,41,0.12)' },
  completed: { fg: '#059D72', bg: 'rgba(5,157,114,0.15)' },
  cancelled: { fg: '#ff6b6b', bg: 'rgba(255,107,107,0.12)' },
};

const GuideDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const { data } = await api.get(`/users/${user._id}/role-stats`);
        if (!cancelled) {
          setStats(data);
          setLastSync(new Date());
        }
      } catch (err) {
        console.error('Failed to load guide stats', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    pull();
    const id = setInterval(pull, 60_000); // live sync every 60s
    return () => { cancelled = true; clearInterval(id); };
  }, [user?._id]);

  const upcoming = stats?.upcomingEngagements || [];
  const past = stats?.pastEngagements || [];
  const assigned = stats?.assignedDestinations || [];
  const totalEngagements = stats?.totalEngagements ?? 0;
  const totalEarnings = stats?.totalEarnings ?? 0;
  // Live wallet pulled from the user's vendorLedger (top-level on User doc).
  const pendingPayout = Number(user?.vendorLedger?.pendingPayout || 0);
  const lifetimeEarned = Number(user?.vendorLedger?.totalEarned || 0);
  const alreadyPaid = Number(user?.vendorLedger?.totalWithdrawn || 0);

  const handleRequestPayout = async () => {
    if (pendingPayout <= 0) {
      window.alert('You have no pending balance to request.');
      return;
    }
    const input = window.prompt(
      `Request a payout from your pending balance.\n\n` +
      `Pending:        NPR ${pendingPayout.toLocaleString('en-IN')}\n` +
      `Lifetime earned: NPR ${lifetimeEarned.toLocaleString('en-IN')}\n` +
      `Already paid:    NPR ${alreadyPaid.toLocaleString('en-IN')}\n\n` +
      `Amount to request (max ${pendingPayout}):`,
      String(pendingPayout)
    );
    if (input === null) return;
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Invalid amount.');
      return;
    }
    const note = window.prompt('Optional note for the admin (or leave blank):', '') || '';
    try {
      const { data } = await api.post('/vendors/payout-request', { amount, note });
      window.alert(`✓ Payout request filed.\nTicket: ${String(data.ticketId).slice(-8).toUpperCase()}\nAn admin will settle it within 3–5 business days.`);
    } catch (err) {
      window.alert(err?.response?.data?.message || 'Could not file payout request.');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* WALLET — pendingPayout from your vendorLedger. Click to file a payout request. */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(162,215,41,0.12), rgba(5,157,114,0.08))',
        border: '1px solid rgba(162,215,41,0.35)',
        borderRadius: 10,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: '0.7rem', letterSpacing: 2, color: '#A2D729', fontWeight: 800, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Banknote size={12} /> Your wallet · pending payout
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 900, color: '#A2D729', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmtNPR(pendingPayout)}</p>
          <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 4 }}>
            Lifetime earned {fmtNPR(lifetimeEarned)} · already paid {fmtNPR(alreadyPaid)}
          </p>
        </div>
        <button
          onClick={handleRequestPayout}
          disabled={pendingPayout <= 0}
          style={{
            background: pendingPayout > 0 ? '#A2D729' : 'rgba(255,255,255,0.05)',
            color: pendingPayout > 0 ? '#0D0A02' : 'var(--text-muted, #A6A180)',
            border: 'none',
            padding: '0.85rem 1.4rem',
            borderRadius: 999,
            cursor: pendingPayout > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          REQUEST PAYOUT →
        </button>
      </section>

      {/* KPI ROW */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard label="Total earnings" value={fmtNPR(totalEarnings)} accent="#A2D729" icon={Banknote} sub={`${totalEngagements} engagement${totalEngagements === 1 ? '' : 's'}`} />
        <KpiCard label="Upcoming" value={upcoming.length} accent="#F4A261" icon={Calendar} sub={upcoming.length ? `Next: ${fmtDate(upcoming[0]?.startDate)}` : 'No engagements scheduled'} />
        <KpiCard label="Destinations covered" value={assigned.length} accent="#059D72" icon={Compass} sub={assigned.slice(0, 2).map((d) => d.name).join(', ') || 'None assigned yet'} />
        <KpiCard label="Completed tours" value={past.filter((b) => b.status === 'completed').length} accent="#A2D729" icon={Award} sub={lastSync ? `synced ${lastSync.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'syncing…'} />
      </section>

      {/* UPCOMING SCHEDULE */}
      <section>
        <h2 style={sectionTitle}>Upcoming trips you're guiding</h2>
        {loading ? (
          <SkeletonRow />
        ) : upcoming.length === 0 ? (
          <EmptyBox
            title="No upcoming engagements"
            body="New bookings on your assigned destinations will appear here — and you'll receive an email the moment one is booked."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcoming.map((b) => (
              <EngagementCard key={b._id} b={b} variant="upcoming" />
            ))}
          </div>
        )}
      </section>

      {/* ASSIGNED DESTINATIONS */}
      <section>
        <h2 style={sectionTitle}>Destinations under your guidance</h2>
        {assigned.length === 0 ? (
          <EmptyBox
            title="No destinations assigned yet"
            body="An admin needs to link you to a destination in the Destination Manager. Once linked, you'll start receiving booking assignments."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
            {assigned.map((d) => (
              <div key={d._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.9rem 1rem' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{d.name}</p>
                <p style={{ fontSize: '0.72rem', opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MapPin size={11} /> {d.region} · {d.terrainType}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PAST ENGAGEMENTS */}
      <section>
        <h2 style={sectionTitle}>Recent engagement history</h2>
        {past.length === 0 ? (
          <EmptyBox title="No past engagements" body="Completed and cancelled trips you've guided will appear here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {past.slice(0, 8).map((b) => (
              <EngagementCard key={b._id} b={b} variant="past" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const KpiCard = ({ label, value, sub, accent = '#A2D729', icon: Icon }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1.1rem 1.2rem' }}>
    <p style={{ fontSize: '0.65rem', opacity: 0.55, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {Icon && <Icon size={12} style={{ color: accent }} />} {label}
    </p>
    <p style={{ fontSize: '1.6rem', fontWeight: 900, color: accent, letterSpacing: '-0.02em' }}>{value}</p>
    {sub && <p style={{ fontSize: '0.7rem', opacity: 0.55, marginTop: 4 }}>{sub}</p>}
  </div>
);

const EngagementCard = ({ b, variant }) => {
  const c = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.9rem 1.1rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1rem', alignItems: 'center' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 4 }}>
          {b.destination?.name || 'Destination'}
          {variant === 'upcoming' && fmtRelative(b.startDate) && (
            <span style={{ marginLeft: 10, fontSize: '0.7rem', color: '#A2D729', fontWeight: 700 }}>· {fmtRelative(b.startDate)}</span>
          )}
        </p>
        <p style={{ fontSize: '0.78rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span><Users size={11} style={{ display: 'inline', marginRight: 4 }} /> @{b.user?.username || 'traveler'}</span>
          <span><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} /> {fmtDate(b.startDate)} → {fmtDate(b.endDate)}</span>
          <span>· {b.travelers}p × {b.durationDays}d</span>
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#A2D729' }}>{fmtNPR(b.pricing?.totalCost)}</span>
        <span style={{ fontSize: '0.65rem', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: c.bg, color: c.fg }}>
          {b.status}
        </span>
      </div>
    </div>
  );
};

const EmptyBox = ({ title, body }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
    <p style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6 }}>{title}</p>
    <p style={{ fontSize: '0.8rem', opacity: 0.6, lineHeight: 1.5, maxWidth: 480, margin: '0 auto' }}>{body}</p>
  </div>
);

const SkeletonRow = () => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.5rem', opacity: 0.5 }}>Loading…</div>
);

const sectionTitle = {
  fontSize: '0.95rem',
  fontWeight: 800,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: 'var(--hill-green, #059D72)',
  marginBottom: '0.85rem',
};

export default GuideDashboard;
