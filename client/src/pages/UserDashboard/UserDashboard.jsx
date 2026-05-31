import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import {
  Menu, Map, Heart, Settings, LogOut, Camera, Save, Loader, MapPin, Calendar, Tag, Home,
  Compass, Hotel as HotelIcon, MessageSquare, Send, X as XIcon,
  AlertTriangle, Lightbulb, UserX,
} from 'lucide-react';
import GoogleMapView from '../../components/Common/GoogleMapView';
import GuideDashboard from './GuideDashboard';
import HotelDashboard from './HotelDashboard';
import { compressImage } from '../../utils/imageCompression';
import './UserDashboard.css';

// Per-role tab sets — the dashboard branches on user.role at render time so guides
// and hotel-owners get a workspace tailored to their job instead of the traveller view.
const TRAVELER_TABS = [
  { id: 'trips',     label: 'Overview & My Trips',       Icon: Map },
  { id: 'favorites', label: 'My Favorites',              Icon: Heart },
  { id: 'settings',  label: 'Account & Profile Settings', Icon: Settings },
];
const GUIDE_TABS = [
  { id: 'engagements', label: 'My Engagements', Icon: Compass },
  { id: 'settings',    label: 'Account & Profile', Icon: Settings },
];
const HOTEL_TABS = [
  { id: 'reservations', label: 'Reservations', Icon: HotelIcon },
  { id: 'settings',     label: 'Account & Profile', Icon: Settings },
];

const resolveRoleConfig = (role) => {
  if (role === 'guide') return { tabs: GUIDE_TABS, defaultTab: 'engagements', kicker: 'Guide ops', greet: 'Welcome back, dai' };
  if (role === 'hotel' || role === 'hotel_owner') return { tabs: HOTEL_TABS, defaultTab: 'reservations', kicker: 'Hotel ops', greet: 'Welcome back' };
  return { tabs: TRAVELER_TABS, defaultTab: 'trips', kicker: 'Dashboard', greet: 'Namaste' };
};

const convertToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

const UserDashboard = ({ user: userProp }) => {
  const navigate = useNavigate();
  const { user: authUser, setUser, logout } = useContext(AuthContext);
  const user = userProp || authUser;

  // Resolve role config FIRST so we know which tab set to render and which is default.
  const roleConfig = resolveRoleConfig(user?.role);
  const [activeTab, setActiveTab] = useState(roleConfig.defaultTab);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // If role changes (e.g. admin promotes someone) while the dashboard is mounted,
  // snap the active tab back to a valid one in the new role's set.
  useEffect(() => {
    const valid = roleConfig.tabs.some((t) => t.id === activeTab);
    if (!valid) setActiveTab(roleConfig.defaultTab);
  }, [user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <p>Please sign in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-layout" style={{ minHeight: '100vh', background: 'var(--obsidian, #0D0A02)', color: 'white' }}>
      <div style={{ display: 'grid', gridTemplateColumns: sidebarOpen ? '260px 1fr' : '64px 1fr', transition: 'grid-template-columns 0.25s ease', minHeight: '100vh' }}>
        {/* SIDEBAR with 3-line/hamburger toggle */}
        <aside style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#A2D729', cursor: 'pointer', padding: '0.5rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={18} />
            {sidebarOpen && <span style={{ fontWeight: 900, letterSpacing: 4 }}>YAATRI</span>}
          </button>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.5rem 0' }} />

          {roleConfig.tabs.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  background: active ? 'rgba(162,215,41,0.12)' : 'transparent',
                  border: `1px solid ${active ? '#A2D729' : 'transparent'}`,
                  color: active ? '#A2D729' : '#A6A180',
                  padding: '0.7rem 0.8rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={16} />
                {sidebarOpen && <span>{label}</span>}
              </button>
            );
          })}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => { logout && logout(); navigate('/login'); }}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#A6A180',
                padding: '0.6rem 0.8rem',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <LogOut size={14} />
              {sidebarOpen && 'Sign out'}
            </button>
          </div>
        </aside>

        {/* MAIN PANEL */}
        <main style={{ padding: '2rem 4%', overflowY: 'auto' }}>
          <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#A2D729', fontWeight: 700, textTransform: 'uppercase' }}>{roleConfig.kicker}</p>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{roleConfig.greet}, {user.username}</h1>
            </div>
            {/* The dashboard hides the global Navbar, so we surface Home + Feedback inline. */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setFeedbackOpen(true)}
                style={{
                  background: 'rgba(244,162,97,0.08)',
                  border: '1px solid rgba(244,162,97,0.4)',
                  color: '#F4A261',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: 1,
                  padding: '0.5rem 0.95rem',
                  borderRadius: 999,
                }}
                title="Send a quick bug report, suggestion, or account note"
              >
                <MessageSquare size={13} /> FEEDBACK
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'rgba(162,215,41,0.08)',
                  border: '1px solid rgba(162,215,41,0.4)',
                  color: '#A2D729',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: 1,
                  padding: '0.5rem 0.95rem',
                  borderRadius: 999,
                }}
              >
                <Home size={13} /> BACK TO HOMEPAGE
              </button>
              <span style={{ fontSize: '0.75rem', opacity: 0.4, fontFamily: 'monospace' }}>
                [TAB: {activeTab.toUpperCase()}]
              </span>
            </div>
          </header>

          {feedbackOpen && (
            <FeedbackModal
              user={user}
              onClose={() => setFeedbackOpen(false)}
            />
          )}

          {/* Traveler tabs */}
          {activeTab === 'trips' && <TripsTab user={user} navigate={navigate} />}
          {activeTab === 'favorites' && <FavoritesTab user={user} navigate={navigate} />}
          {/* Guide tabs */}
          {activeTab === 'engagements' && <GuideDashboard user={user} />}
          {/* Hotel tabs */}
          {activeTab === 'reservations' && <HotelDashboard user={user} />}
          {/* Shared */}
          {activeTab === 'settings' && <SettingsTab user={user} setUser={setUser} />}
        </main>
      </div>
    </div>
  );
};

/* ----- TAB 1: TRIPS ----- */
const TripsTab = ({ user, navigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (booking) => {
    const dest = booking.destination?.name || 'this trip';
    if (!window.confirm(`Cancel your booking for ${dest}? This sends a cancellation receipt to your email and cannot be undone.`)) return;
    setCancellingId(booking._id);
    try {
      const { data } = await api.patch(`/bookings/${booking._id}/cancel`);
      // Update local list with the cancelled record so the UI reshuffles immediately.
      setBookings((prev) => prev.map((b) => (b._id === booking._id ? { ...b, ...data, destination: b.destination } : b)));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to cancel booking.';
      alert(msg);
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.get('/bookings/me')
      .then(({ data }) => { if (!cancelled) setBookings(Array.isArray(data) ? data : []); })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load bookings', err);
          setBookings([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p style={{ opacity: 0.5 }}>Loading itineraries…</p>;

  const upcoming = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  // Deduplicate destinations across bookings so the map doesn't stack identical pins.
  // Use a plain object — the lucide-react `Map` icon imported above shadows the JS built-in `Map`.
  const tripDestinations = (() => {
    const byId = {};
    bookings.forEach((b) => {
      const d = b.destination;
      if (d && d._id && !byId[String(d._id)]) byId[String(d._id)] = d;
    });
    return Object.values(byId);
  })();

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {tripDestinations.length > 0 && (
        <section>
          <h2 style={sectionTitle}>Journey map</h2>
          <p style={{ fontSize: '0.75rem', opacity: 0.55, marginBottom: 10 }}>
            {tripDestinations.length} unique destination{tripDestinations.length === 1 ? '' : 's'} across your {bookings.length} booking{bookings.length === 1 ? '' : 's'} · click a pin to revisit it
          </p>
          <GoogleMapView
            destinations={tripDestinations}
            height={320}
            onMarkerClick={(d) => d?._id && navigate(`/destination/${d._id}`)}
          />
        </section>
      )}

      <section>
        <h2 style={sectionTitle}>Upcoming itineraries</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming trips yet"
            body="Visit the Explore page to map your next journey."
            cta="Open Explore"
            onClick={() => navigate('/explore')}
          />
        ) : (
          <div style={cardGrid}>
            {upcoming.map(b => <BookingCard key={b._id} b={b} onCancel={handleCancel} cancelling={cancellingId === b._id} onReview={(updated) => setBookings(prev => prev.map(x => x._id === updated._id ? updated : x))} />)}
          </div>
        )}
      </section>

      <section>
        <h2 style={sectionTitle}>Trip history</h2>
        {past.length === 0 ? (
          <EmptyState
            title="No trip history yet"
            body="Completed and cancelled trips will appear here."
          />
        ) : (
          <div style={cardGrid}>
            {past.map(b => <BookingCard key={b._id} b={b} onReview={(updated) => setBookings(prev => prev.map(x => x._id === updated._id ? updated : x))} />)}
          </div>
        )}
      </section>
    </div>
  );
};

const BookingCard = ({ b, onCancel, cancelling, onReview }) => {
  const dest = b.destination || {};
  const [reviewOpen, setReviewOpen] = useState(false);

  // Status colour: lime for completed, hill-green for active, muted red for cancelled.
  const statusColors = {
    completed:       { bg: 'rgba(162,215,41,0.15)', fg: '#A2D729' },
    approved:        { bg: 'rgba(162,215,41,0.15)', fg: '#A2D729' },
    confirmed:       { bg: 'rgba(162,215,41,0.15)', fg: '#A2D729' },
    cancelled:       { bg: 'rgba(255,77,77,0.12)', fg: '#ff6b6b' },
    pending_payment: { bg: 'rgba(255,180,80,0.15)', fg: '#FFB450' },
    escrow_held:     { bg: 'rgba(244,162,97,0.15)', fg: '#F4A261' },
    default:         { bg: 'rgba(5,157,114,0.15)', fg: '#059D72' },
  };
  const c = statusColors[b.status] || statusColors.default;
  const canCancel = ['pending', 'pending_payment', 'escrow_held', 'confirmed', 'approved'].includes(b.status) && typeof onCancel === 'function';
  // Review window: trip has started (approved) or finished (completed) AND hasn't been reviewed yet.
  const canReview = ['approved', 'completed', 'confirmed'].includes(b.status) && !b.review?.rating;
  const hasReview = !!b.review?.rating;

  return (
    <>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{dest.name || 'Destination'}</h3>
          <span style={{
            fontSize: '0.65rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700,
            padding: '2px 8px', borderRadius: 999,
            background: c.bg, color: c.fg,
          }}>{b.status}</span>
        </div>
        {dest.region && (
          <p style={{ fontSize: '0.8rem', opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} /> {dest.region}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: 10, fontSize: '0.8rem', opacity: 0.7 }}>
          <span><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} /> {b.durationDays}d × {b.travelers}p</span>
          <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#A2D729' }}>
            NPR {Number(b.pricing?.totalCost || 0).toLocaleString('en-IN')}
          </span>
        </div>
        {/* Guide / Hotel assigned — tap to view their profile */}
        {(b.assignedGuide || b.assignedHotel) && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {b.assignedGuide && (
              <a href={`/profile/${b.assignedGuide.userId?._id || b.assignedGuide._id || b.assignedGuide}`} style={{ fontSize: '0.72rem', color: '#059D72', border: '1px solid rgba(5,157,114,0.35)', borderRadius: 99, padding: '2px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                👤 {b.assignedGuide.guideName || b.assignedGuide.username || 'Guide'} ↗
              </a>
            )}
            {b.assignedHotel && (
              <a href={`/profile/${b.assignedHotel.userId?._id || b.assignedHotel.userId || b.assignedHotel._id || b.assignedHotel}`} style={{ fontSize: '0.72rem', color: '#F4A261', border: '1px solid rgba(244,162,97,0.35)', borderRadius: 99, padding: '2px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                🏨 {b.assignedHotel.name || 'Hotel'} ↗
              </a>
            )}
          </div>
        )}

        {/* Review display — if the traveler has rated this trip, show it here */}
        {hasReview && (
          <div style={{ marginTop: 12, padding: '0.7rem 0.9rem', background: 'rgba(162,215,41,0.05)', border: '1px solid rgba(162,215,41,0.2)', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ color: n <= b.review.rating ? '#A2D729' : 'rgba(255,255,255,0.18)', fontSize: '0.85rem' }}>★</span>
              ))}
              <span style={{ fontSize: '0.7rem', opacity: 0.55, marginLeft: 6 }}>your review</span>
            </div>
            {b.review.comment && (
              <p style={{ fontSize: '0.78rem', opacity: 0.85, fontStyle: 'italic', lineHeight: 1.4 }}>"{b.review.comment}"</p>
            )}
          </div>
        )}

        {(canCancel || canReview) && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            {canReview && (
              <button
                onClick={() => setReviewOpen(true)}
                style={{
                  background: 'rgba(162,215,41,0.1)',
                  border: '1px solid #A2D729',
                  color: '#A2D729',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ★ Leave a review
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(b)}
                disabled={cancelling}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,77,77,0.5)',
                  color: cancelling ? '#A6A180' : '#ff6b6b',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 6,
                  cursor: cancelling ? 'wait' : 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {cancelling ? 'Cancelling…' : 'Cancel booking'}
              </button>
            )}
          </div>
        )}
      </div>

      {reviewOpen && (
        <ReviewModal
          booking={b}
          onClose={() => setReviewOpen(false)}
          onSubmitted={(updated) => {
            setReviewOpen(false);
            if (typeof onReview === 'function') onReview(updated);
          }}
        />
      )}
    </>
  );
};

/* ----------  TRIP REVIEW MODAL  ---------- */

const ReviewModal = ({ booking, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (rating < 1 || rating > 5) { setErr('Pick a star rating from 1 to 5.'); return; }
    setBusy(true);
    setErr(null);
    try {
      const { data } = await api.post(`/bookings/${booking._id}/review`, { rating, comment });
      onSubmitted?.(data);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Could not submit review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--obsidian, #0D0A02)', border: '1px solid var(--hill-green, #059D72)', borderRadius: 12, padding: '1.75rem', maxWidth: 460, width: '100%', color: 'var(--himalayan-mist, #F4F2F3)' }}
      >
        <p style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#A2D729', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
          Trip review
        </p>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          How was {booking.destination?.name || 'your trip'}?
        </h2>
        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '1.25rem' }}>
          Your honest take helps fellow travelers, and lets the guide/hotel know how they did.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Star picker */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hover || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: active ? '#A2D729' : 'rgba(255,255,255,0.2)',
                    fontSize: '2rem', padding: 0, lineHeight: 1, transition: 'color 0.1s',
                  }}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >★</button>
              );
            })}
            <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: 8 }}>
              {rating ? `${rating} / 5` : 'click to rate'}
            </span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: what stood out? What could've been better? (max 1000 chars)"
            rows={4}
            maxLength={1000}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />

          {err && <p style={{ fontSize: '0.78rem', color: '#ff6b6b' }}>{err}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#A6A180', padding: '0.55rem 1rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || rating < 1}
              className="btn-primary-white"
              style={{ opacity: busy || rating < 1 ? 0.5 : 1, cursor: busy ? 'wait' : 'pointer' }}
            >
              {busy ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----- TAB 2: FAVORITES ----- */
const FavoritesTab = ({ user, navigate }) => {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = user?.profileData?.favoriteDestinations || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      setFavs([]);
      setLoading(false);
      return;
    }
    api.get('/destinations')
      .then(({ data }) => {
        const idSet = new Set(ids.map(String));
        setFavs((data || []).filter(d => idSet.has(String(d._id))));
      })
      .catch(() => setFavs([]))
      .finally(() => setLoading(false));
  }, [user?.profileData?.favoriteDestinations]);

  if (loading) return <p style={{ opacity: 0.5 }}>Loading favourites…</p>;

  if (!Array.isArray(favs) || favs.length === 0) {
    return (
      <EmptyState
        title="Your favorite trails are empty."
        body="Explore destinations to build your list!"
        cta="Browse destinations"
        onClick={() => navigate('/destinations')}
      />
    );
  }

  return (
    <div style={cardGrid}>
      {favs.map(d => (
        <button
          key={d._id}
          onClick={() => navigate(`/destination/${d._id}`)}
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: 0,
            overflow: 'hidden',
            cursor: 'pointer',
            color: 'white',
            textAlign: 'left',
          }}
        >
          {d.imageURL && <img src={d.imageURL} alt={d.name} style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover' }} />}
          <div style={{ padding: '0.85rem 1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 4 }}>{d.name}</h3>
            <p style={{ fontSize: '0.75rem', opacity: 0.55 }}>{d.region} · {d.terrainType}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

/* ----- TAB 3: SETTINGS ----- */
const SettingsTab = ({ user, setUser }) => {
  const fileRef = useRef(null);
  const [draft, setDraft] = useState({
    username: user.username || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    bio: user.bio || '',
    avatar: user.avatar || '',
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const pickAvatar = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Avatar must be under 5MB'); return; }
    setError(null);
    try {
      // Compress to 480p + <1MB BEFORE Base64 encoding — keeps the User doc tiny
      // and avoids hitting the 16MB BSON ceiling under continuous avatar churn.
      const compressed = await compressImage(f);
      const base64 = await convertToBase64(compressed);
      setDraft(d => ({ ...d, avatar: base64 }));
    } catch (err) { setError('Could not read file'); }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.put('/users/profile', {
        avatar: draft.avatar,
        bio: draft.bio,
      });
      if (typeof setUser === 'function') setUser({ ...user, ...data });
      setSavedAt(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: '2rem' }}>
      {/* Avatar */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1.25rem', textAlign: 'center' }}>
        <div style={{
          width: 140, height: 140, borderRadius: '50%', margin: '0 auto 1rem',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(5,157,114,0.25), rgba(162,215,41,0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {draft.avatar
            ? <img src={draft.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#059D72' }}>{(user.username || '?').slice(0, 2).toUpperCase()}</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} style={{ display: 'none' }} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            background: 'none', border: '1px solid #A2D729', color: '#A2D729',
            padding: '0.55rem 1rem', borderRadius: 6, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.8rem', fontWeight: 700,
          }}
        >
          <Camera size={14} /> Upload avatar
        </button>
        <p style={{ fontSize: '0.7rem', opacity: 0.45, marginTop: 10, lineHeight: 1.4 }}>
          Image is compressed and stored inline on your account (Base64).
        </p>
      </div>

      {/* Form */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1.5rem' }}>
        <h2 style={sectionTitle}>Account details</h2>

        <SettingsRow label="Username" hint="Read-only — contact support to change">
          <input value={draft.username} disabled style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }} />
        </SettingsRow>

        <SettingsRow label="Email" hint="Read-only — contact support to change">
          <input value={draft.email} disabled style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }} />
        </SettingsRow>

        <SettingsRow label="Bio">
          <textarea
            value={draft.bio}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
            rows={3}
            placeholder="Tell other Yaatris about yourself"
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </SettingsRow>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary-white"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {savedAt && <span style={{ fontSize: '0.75rem', color: '#A2D729' }}>Saved at {savedAt.toLocaleTimeString()}</span>}
          {error && <span style={{ fontSize: '0.75rem', color: '#E63946' }}>{error}</span>}
        </div>
      </div>
    </div>
  );
};

const SettingsRow = ({ label, hint, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.6, marginBottom: 4, display: 'block' }}>{label}</label>
    {children}
    {hint && <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: 4 }}>{hint}</p>}
  </div>
);

const EmptyState = ({ title, body, cta, onClick }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
    <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{title}</p>
    <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: cta ? 16 : 0 }}>{body}</p>
    {cta && onClick && (
      <button onClick={onClick} style={{ background: '#A2D729', color: '#0D0A02', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
        {cta}
      </button>
    )}
  </div>
);

const sectionTitle = {
  fontSize: '0.75rem',
  letterSpacing: 3,
  textTransform: 'uppercase',
  fontWeight: 700,
  color: '#A2D729',
  marginBottom: '1rem',
};

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '1rem',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
  padding: '0.6rem 0.85rem',
  borderRadius: 6,
  fontSize: '0.9rem',
  outline: 'none',
};

/* ----------  FEEDBACK MODAL  ---------- */
// Inline 3-type feedback form. Posts to /api/queries (the same support pipeline
// as the public Contact page) so feedback lands in the admin Messages queue.

const FEEDBACK_TYPES = [
  { id: 'bug_report',    label: 'Bug report',       Icon: AlertTriangle, accent: '#ff6b6b' },
  { id: 'suggestion',    label: 'Suggestion',       Icon: Lightbulb,     accent: '#A2D729' },
  { id: 'account_issue', label: 'Account issue',    Icon: UserX,         accent: '#F4A261' },
];

const FeedbackModal = ({ user, onClose }) => {
  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (submitting || message.trim().length < 5) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const subject = `[Dashboard ${type}] from @${user?.username || 'user'}`;
      const { data } = await api.post('/queries', {
        email: user?.email || 'dashboard-user@yaatri.local',
        subject,
        type,
        message,
      });
      setStatus({ kind: 'ok', text: `Thanks — ticket ${String(data?.ticketId || '').slice(-8).toUpperCase()} filed. Our team will follow up.` });
      setMessage('');
      setTimeout(() => onClose?.(), 1800);
    } catch (err) {
      setStatus({ kind: 'err', text: err?.response?.data?.message || 'Could not send. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
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
          padding: '1.75rem',
          maxWidth: 480,
          width: '100%',
          color: 'var(--himalayan-mist, #F4F2F3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#F4A261', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
              Quick feedback
            </p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>What's on your mind?</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#A6A180', cursor: 'pointer', padding: 4 }}
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Type chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {FEEDBACK_TYPES.map(({ id, label, Icon, accent }) => {
              const active = type === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  style={{
                    background: active ? `${accent}1f` : 'rgba(0,0,0,0.25)',
                    border: `1px solid ${active ? accent : 'rgba(255,255,255,0.08)'}`,
                    color: active ? accent : 'rgba(255,255,255,0.7)',
                    padding: '0.55rem 0.5rem',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Icon size={12} /> {label}
                </button>
              );
            })}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's working, what's broken, or what would help (min 5 chars)"
            rows={5}
            maxLength={2000}
            required
            minLength={5}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />

          {status && (
            <p style={{ fontSize: '0.8rem', color: status.kind === 'ok' ? '#A2D729' : '#ff6b6b' }}>
              {status.text}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#A6A180',
                padding: '0.55rem 1rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || message.trim().length < 5}
              className="btn-primary-white"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: submitting || message.trim().length < 5 ? 0.5 : 1 }}
            >
              {submitting ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
        </form>

        <p style={{ fontSize: '0.7rem', opacity: 0.45, marginTop: '1rem' }}>
          Sending as <strong>@{user?.username}</strong> · routes to /admin/messages
        </p>
      </div>
    </div>
  );
};

export default UserDashboard;
