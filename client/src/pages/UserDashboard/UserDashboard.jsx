import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import {
  Menu, Map, Heart, Settings, LogOut, Camera, Save, Loader, MapPin, Calendar, Tag,
} from 'lucide-react';
import GoogleMapView from '../../components/Common/GoogleMapView';
import './UserDashboard.css';

const TABS = [
  { id: 'trips',     label: 'Overview & My Trips',       Icon: Map },
  { id: 'favorites', label: 'My Favorites',              Icon: Heart },
  { id: 'settings',  label: 'Account & Profile Settings', Icon: Settings },
];

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

  const [activeTab, setActiveTab] = useState('trips');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

          {TABS.map(({ id, label, Icon }) => {
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
          <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#A2D729', fontWeight: 700, textTransform: 'uppercase' }}>Dashboard</p>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Namaste, {user.username}</h1>
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.4, fontFamily: 'monospace' }}>
              [TAB: {activeTab.toUpperCase()}]
            </span>
          </header>

          {activeTab === 'trips' && <TripsTab user={user} navigate={navigate} />}
          {activeTab === 'favorites' && <FavoritesTab user={user} navigate={navigate} />}
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
            {upcoming.map(b => <BookingCard key={b._id} b={b} onCancel={handleCancel} cancelling={cancellingId === b._id} />)}
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
            {past.map(b => <BookingCard key={b._id} b={b} />)}
          </div>
        )}
      </section>
    </div>
  );
};

const BookingCard = ({ b, onCancel, cancelling }) => {
  const dest = b.destination || {};
  // Status colour: lime for completed, hill-green for active, muted red for cancelled.
  const statusColors = {
    completed: { bg: 'rgba(162,215,41,0.15)', fg: '#A2D729' },
    cancelled: { bg: 'rgba(255,77,77,0.12)', fg: '#ff6b6b' },
    default:   { bg: 'rgba(5,157,114,0.15)', fg: '#059D72' },
  };
  const c = statusColors[b.status] || statusColors.default;
  const canCancel = ['pending', 'confirmed'].includes(b.status) && typeof onCancel === 'function';

  return (
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
      {canCancel && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
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
        </div>
      )}
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
      const base64 = await convertToBase64(f);
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

export default UserDashboard;
