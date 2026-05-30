import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Calendar, MapPin, Users, Hotel as HotelIcon, Banknote, BedDouble } from 'lucide-react';

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
  if (days === 0) return 'arrives today';
  if (days === 1) return 'arrives tomorrow';
  if (days > 1 && days < 7) return `arrives in ${days}d`;
  if (days < 0) return `${Math.abs(days)}d ago`;
  return '';
};

const STATUS_COLORS = {
  pending:   { fg: '#F4A261', bg: 'rgba(244,162,97,0.12)' },
  confirmed: { fg: '#A2D729', bg: 'rgba(162,215,41,0.12)' },
  completed: { fg: '#059D72', bg: 'rgba(5,157,114,0.15)' },
  cancelled: { fg: '#ff6b6b', bg: 'rgba(255,107,107,0.12)' },
};

const HotelDashboard = ({ user }) => {
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
        console.error('Failed to load hotel stats', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    pull();
    const id = setInterval(pull, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?._id]);

  const upcoming = stats?.upcomingReservations || [];
  const past = stats?.pastReservations || [];
  const assignedDestinations = stats?.assignedDestinations || [];
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalBookings = stats?.totalBookings ?? 0;
  const hotelName = stats?.hotelName || `${user?.username}'s Hotel`;
  const basePrice = stats?.basePrice || 0;
  // Live wallet from vendorLedger.
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

  // Occupancy: confirmed nights in the next 30 days vs a theoretical 30-night capacity.
  const next30 = upcoming.filter((b) => {
    if (!b.startDate) return false;
    const diff = (new Date(b.startDate).getTime() - Date.now()) / 86400000;
    return diff <= 30;
  });
  const occupancyNights = next30.reduce((sum, b) => sum + Number(b.durationDays || 0), 0);
  const occupancyPct = Math.min(100, Math.round((occupancyNights / 30) * 100));

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* HOTEL HEADER */}
      <section style={{ background: 'linear-gradient(135deg, rgba(26,67,78,0.6), rgba(13,10,2,0.6))', border: '1px solid rgba(162,215,41,0.2)', borderRadius: 12, padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <HotelIcon size={20} style={{ color: '#A2D729' }} />
          <p style={{ fontSize: '0.7rem', letterSpacing: 3, color: '#A2D729', fontWeight: 800, textTransform: 'uppercase' }}>Hotel ops</p>
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{hotelName}</h2>
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 4 }}>
          {basePrice ? `Base rate: ${fmtNPR(basePrice)}/night · ` : ''}
          {assignedDestinations.length} destination{assignedDestinations.length === 1 ? '' : 's'} linked
        </p>
      </section>

      {/* WALLET — pendingPayout from vendorLedger. Tap to file a payout request. */}
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
          }}
        >
          REQUEST PAYOUT →
        </button>
      </section>

      {/* KPI ROW */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard label="Total revenue (live)" value={fmtNPR(totalRevenue)} accent="#A2D729" icon={Banknote} sub={`${totalBookings} booking${totalBookings === 1 ? '' : 's'} · net of cancellations`} />
        <KpiCard label="Upcoming reservations" value={upcoming.length} accent="#F4A261" icon={Calendar} sub={upcoming.length ? `Next: ${fmtDate(upcoming[0]?.startDate)}` : 'No bookings on file'} />
        <KpiCard label="Occupancy (next 30d)" value={`${occupancyPct}%`} accent="#059D72" icon={BedDouble} sub={`${occupancyNights} room-nights booked / 30`} />
        <KpiCard label="Linked destinations" value={assignedDestinations.length} accent="#A2D729" icon={MapPin} sub={lastSync ? `synced ${lastSync.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'syncing…'} />
      </section>

      {/* OCCUPANCY BAR */}
      {assignedDestinations.length > 0 && (
        <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1rem 1.25rem' }}>
          <p style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>30-day occupancy projection</p>
          <div style={{ height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${occupancyPct}%`,
                height: '100%',
                background: occupancyPct > 75 ? '#A2D729' : occupancyPct > 40 ? '#F4A261' : '#059D72',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 6 }}>
            {occupancyNights} confirmed night{occupancyNights === 1 ? '' : 's'} across upcoming bookings · capacity assumed 30/month
          </p>
        </section>
      )}

      {/* UPCOMING RESERVATIONS */}
      <section>
        <h2 style={sectionTitle}>Upcoming reservations</h2>
        {loading ? (
          <SkeletonRow />
        ) : upcoming.length === 0 ? (
          <EmptyBox
            title="No upcoming reservations"
            body="When travellers book on a destination linked to your hotel, you'll see them here and get an email the moment it happens."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcoming.map((b) => (
              <ReservationCard key={b._id} b={b} variant="upcoming" />
            ))}
          </div>
        )}
      </section>

      {/* LINKED DESTINATIONS */}
      <section>
        <h2 style={sectionTitle}>Destinations linked to your hotel</h2>
        {assignedDestinations.length === 0 ? (
          <EmptyBox
            title="Your hotel isn't linked to any destinations yet"
            body="An admin needs to add your hotel to a destination's assigned-hotels list. Once linked, all bookings on that destination notify you."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
            {assignedDestinations.map((d) => (
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

      {/* PAST RESERVATIONS */}
      <section>
        <h2 style={sectionTitle}>Recent stays history</h2>
        {past.length === 0 ? (
          <EmptyBox title="No past stays" body="Completed and cancelled stays will appear here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {past.slice(0, 8).map((b) => (
              <ReservationCard key={b._id} b={b} variant="past" />
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

const ReservationCard = ({ b, variant }) => {
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
          <span><Users size={11} style={{ display: 'inline', marginRight: 4 }} /> @{b.user?.username || 'guest'}</span>
          <span><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} /> {fmtDate(b.startDate)} → {fmtDate(b.endDate)}</span>
          <span>· {b.travelers} guest{b.travelers > 1 ? 's' : ''} · {b.durationDays} night{b.durationDays > 1 ? 's' : ''}</span>
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

export default HotelDashboard;
