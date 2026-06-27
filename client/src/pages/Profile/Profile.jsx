import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompression';
import {
  Edit3, Save, Camera, MapPin, ShieldCheck, Languages, Banknote, BookOpen,
  Hotel, Star, ListChecks, Compass, Heart, Award, ArrowLeft
} from 'lucide-react';

// Convert a File → Base64 data URL for inline storage on the user document.
const convertToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

// Map legacy enum values to the spec triple. Falls through to 'user' for unknown.
const normalizeRole = (r) => {
  if (r === 'guide') return 'guide';
  if (r === 'hotel' || r === 'hotel_owner') return 'hotel';
  if (r === 'admin') return 'admin';
  return 'user';
};

const roleBadgeMap = {
  user:  { label: 'Yaatri Explorer',        color: '#2563EB' },
  guide: { label: 'Verified Local Guide',    color: '#10B981' },
  hotel: { label: 'Hotel Partner',           color: '#F59E0B' },
  admin: { label: 'System Administrator',    color: '#DB2777' },
};

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, setUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [profileUser, setProfileUser] = useState(null);
  const [guideRecord, setGuideRecord] = useState(null);   // Guide collection doc
  const [hotelRecord, setHotelRecord] = useState(null);   // Hotel collection doc
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const isOwnProfile = !!authUser && (String(authUser._id) === String(id));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setProfileUser(res.data);
        setDraft({
          bio: res.data.bio || '',
          avatar: res.data.avatar || '',
          role: normalizeRole(res.data.role),
          ...res.data.profileData,
        });
        // Fetch role-specific collection record to show richer public data
        const r = normalizeRole(res.data.role);
        if (r === 'guide') {
          api.get('/guides').then(({ data }) => {
            const match = data.find(g => String(g.userId?._id || g.userId) === String(res.data._id));
            if (match) setGuideRecord(match);
          }).catch(() => {});
        }
        if (r === 'hotel') {
          api.get('/hotels').then(({ data }) => {
            const match = data.find(h => String(h.userId?._id || h.userId) === String(res.data._id));
            if (match) setHotelRecord(match);
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to fetch user profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const role = useMemo(() => normalizeRole(profileUser?.role), [profileUser]);
  const badge = roleBadgeMap[role] || roleBadgeMap.user;

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Avatar must be under 5MB. Try a smaller image.');
      return;
    }
    try {
      // Compress to 480p + <1MB before Base64 — protects MongoDB doc size.
      const compressed = await compressImage(file);
      const base64 = await convertToBase64(compressed);
      setDraft((prev) => ({ ...prev, avatar: base64 }));
      setSaveError(null);
    } catch (err) {
      setSaveError('Could not read the selected file.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        avatar: draft.avatar,
        bio: draft.bio,
        role: draft.role,
        // role-specific:
        hotelName: draft.hotelName,
        amenities: draft.amenities,
        baseRoomRate: typeof draft.baseRoomRate === 'string' ? Number(draft.baseRoomRate) : draft.baseRoomRate,
        languages: draft.languages,
        ratePerDay: typeof draft.ratePerDay === 'string' ? Number(draft.ratePerDay) : draft.ratePerDay,
        licenseNumber: draft.licenseNumber,
      };
      const { data } = await api.put('/users/profile', payload);
      setProfileUser(data);
      if (typeof setUser === 'function') setUser(data);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 pt-28 text-gray-400 text-sm">Loading profile…</div>;
  if (!profileUser) return <div className="p-8 pt-28 text-gray-400 text-sm">User not found.</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '5rem 6% 2rem' }}>

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* STATIC BRAND HEADER */}
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr auto',
            gap: '2rem',
            alignItems: 'center',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Arched avatar mask */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 160,
                height: 200,
                borderTopLeftRadius: 80,
                borderTopRightRadius: 80,
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(16,185,129,0.08))',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {(editing ? draft.avatar : profileUser.avatar) ? (
                <img
                  src={editing ? draft.avatar : profileUser.avatar}
                  alt={profileUser.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '3rem', fontWeight: 900, color: '#059D72', letterSpacing: 1 }}>
                  {(profileUser.username || '?').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {isOwnProfile && editing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarPick}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 8, right: 8,
                    background: '#A2D729', color: '#0D0A02',
                    width: 36, height: 36, borderRadius: '50%',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Upload new avatar"
                >
                  <Camera size={16} />
                </button>
              </>
            )}
          </div>

          {/* Identity column */}
          <div>
            <p style={{ fontSize: '0.7rem', letterSpacing: 3, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
              @{profileUser.username}
            </p>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12, color: '#0f172a' }}>
              {profileUser.username}
            </h1>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px',
                borderRadius: 999,
                background: '#f8fafc',
                border: `1px solid ${badge.color}`,
                color: badge.color,
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              <ShieldCheck size={12} /> {badge.label}
            </span>

            {/* Bio */}
            {editing ? (
              <textarea
                value={draft.bio || ''}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                placeholder="Tell other Yaatris about yourself…"
                rows={2}
                style={{
                  display: 'block', marginTop: '1rem',
                  width: '100%', maxWidth: 560,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            ) : (
              <p style={{ marginTop: 12, fontSize: '0.95rem', maxWidth: 560, lineHeight: 1.55, color: '#475569' }}>
                {profileUser.bio || 'No bio yet.'}
              </p>
            )}
          </div>

          {/* Edit / Save toggle */}
          {isOwnProfile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: '#2563EB', color: 'white',
                      border: 'none', padding: '0.65rem 1.1rem',
                      borderRadius: 10, cursor: saving ? 'wait' : 'pointer',
                      fontWeight: 700, fontSize: '0.85rem',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setSaveError(null); }}
                    style={{
                      background: 'none', color: '#94a3b8', border: '1px solid #e2e8f0',
                      padding: '0.6rem 1rem', borderRadius: 10, cursor: 'pointer', fontSize: '0.8rem',
                    }}
                  >Cancel</button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    background: 'none', color: '#2563EB',
                    border: '1px solid #2563EB', padding: '0.65rem 1.1rem',
                    borderRadius: 10, cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.85rem',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
              {saveError && (
                <p style={{ color: '#E63946', fontSize: '0.75rem', maxWidth: 200 }}>{saveError}</p>
              )}
            </div>
          )}
        </header>

        {/* DUAL-PANEL LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', color: '#0f172a' }} className="profile-grid">
          {/* LEFT PANEL — role-adaptive */}
          <main style={{ minHeight: 400 }}>
            {role === 'user' && (
              <UserPanel
                user={profileUser}
                editing={isOwnProfile && editing}
                draft={draft}
                setDraft={setDraft}
              />
            )}
            {role === 'guide' && (
              <GuidePanel
                user={profileUser}
                guideRecord={guideRecord}
                editing={isOwnProfile && editing}
                draft={draft}
                setDraft={setDraft}
              />
            )}
            {role === 'hotel' && (
              <HotelPanel
                user={profileUser}
                hotelRecord={hotelRecord}
                editing={isOwnProfile && editing}
                draft={draft}
                setDraft={setDraft}
              />
            )}
            {role === 'admin' && (
              <AdminPanel user={profileUser} />
            )}
          </main>

          {/* RIGHT SIDEBAR — role-adaptive */}
          <aside>
            {role === 'user' && <UserSidebar user={profileUser} />}
            {role === 'guide' && <GuideSidebar user={profileUser} />}
            {role === 'hotel' && <HotelSidebar user={profileUser} />}
            {role === 'admin' && <AdminSidebar />}
          </aside>
        </div>
      </div>
    </div>
  );
};

/* ----------  SHARED UI HELPERS  ---------- */

const Card = ({ title, icon: Icon, children, accent = '#2563EB' }) => (
  <section style={{
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '1.5rem',
    marginBottom: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
      {Icon && <Icon size={16} style={{ color: accent }} />}
      <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: accent }}>
        {title}
      </h3>
    </div>
    {children}
  </section>
);

const TextInput = ({ label, value, onChange, type = 'text', placeholder }) => (
  <label style={{ display: 'block', marginBottom: '0.85rem' }}>
    <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 4, fontWeight: 600 }}>
      {label}
    </span>
    <input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      style={{
        width: '100%',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#0f172a',
        padding: '0.6rem 0.85rem',
        borderRadius: 8,
        fontSize: '0.9rem',
        outline: 'none',
      }}
    />
  </label>
);

const ChipList = ({ items, onRemove, onAdd, addLabel = 'Add', editing }) => {
  const [next, setNext] = useState('');
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: editing ? '0.75rem' : 0 }}>
        {(items || []).length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None yet.</span>}
        {(items || []).map((tag, i) => (
          <span key={`${tag}-${i}`} style={{
            background: 'rgba(37,99,235,0.08)',
            color: '#2563EB',
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {tag}
            {editing && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
              >×</button>
            )}
          </span>
        ))}
      </div>
      {editing && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder={addLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && next.trim()) { e.preventDefault(); onAdd(next.trim()); setNext(''); }
            }}
            style={{
              flex: 1,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              padding: '0.5rem 0.75rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => { if (next.trim()) { onAdd(next.trim()); setNext(''); } }}
            style={{
              background: '#2563EB', color: 'white',
              border: 'none', padding: '0.5rem 0.9rem',
              borderRadius: 6, cursor: 'pointer',
              fontWeight: 700, fontSize: '0.8rem',
            }}
          >+</button>
        </div>
      )}
    </div>
  );
};

/* ----------  USER (Traveler) ---------- */

const UserPanel = ({ user }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blogs').then(({ data }) => {
      const mine = (data || []).filter(b => b.authorId?._id === user._id || b.authorId === user._id);
      setBlogs(mine);
    }).catch(() => setBlogs([])).finally(() => setLoading(false));
  }, [user._id]);

  return (
    <>
      <Card title="Published Journals" icon={BookOpen}>
        {loading ? (
          <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>Loading…</p>
        ) : blogs.length === 0 ? (
          <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No journals published yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {blogs.map(b => (
              <div key={b._id} style={{ background: '#f8fafc', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {b.image && <img src={b.image} alt={b.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />}
                <div style={{ padding: '0.6rem 0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>{b.title}</p>
                  <p style={{ fontSize: '0.7rem', opacity: 0.55 }}>
                    {b.locationId?.name || 'Unspecified'} · ♥ {b.likeCount || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Favorite Destinations" icon={Heart} accent="#E63946">
        {(user.profileData?.favoriteDestinations || []).length === 0 ? (
          <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No favorites saved. Star destinations to build your shortlist.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {user.profileData.favoriteDestinations.map((d, i) => (
              <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                {d.name || d}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
};

const UserSidebar = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // /api/users/:id/bookings returns public booking history for any user
    api.get(`/users/${user._id}/bookings`).then(({ data }) => {
      setBookings(Array.isArray(data) ? data : []);
    }).catch(() => setBookings([])).finally(() => setLoading(false));
  }, [user._id]);

  const upcoming = bookings.filter(b => ['pending','confirmed','escrow_held','approved'].includes(b.status));
  const past = bookings.filter(b => ['completed','cancelled'].includes(b.status));

  return (
    <>
      <Card title="Active trips" icon={Compass}>
        {loading ? <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>Loading…</p>
        : upcoming.length === 0 ? <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No active trips.</p>
        : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {upcoming.slice(0, 4).map(b => (
              <li key={b._id} style={{ padding: '0.55rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{b.destination?.name || 'Destination'}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.55 }}>{b.startDate ? new Date(b.startDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) : '—'} · {b.travelers}p · {b.status}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {past.length > 0 && (
        <Card title="Past trips" icon={Award} accent="#F4A261">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {past.slice(0, 4).map(b => (
              <li key={b._id} style={{ padding: '0.55rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{b.destination?.name || 'Destination'}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.55 }}>{b.durationDays}d · {b.status} · NPR {Number(b.pricing?.totalCost||0).toLocaleString('en-IN')}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
};

/* ----------  GUIDE  ---------- */

const GuidePanel = ({ user, guideRecord, editing, draft, setDraft }) => {
  const languages = (editing ? draft.languages : user.profileData?.languages) || [];
  const rate = guideRecord?.dailyFee || (editing ? draft.ratePerDay : user.profileData?.ratePerDay);
  const license = editing ? draft.licenseNumber : user.profileData?.licenseNumber;
  const bio = guideRecord?.bio || user.bio;
  const expertise = guideRecord?.expertise || [];

  return (
    <>
      <Card title="Guide Profile" icon={Award}>
        {bio && <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>{bio}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {editing ? (
            <>
              <TextInput label="License No." value={draft.licenseNumber} onChange={(v) => setDraft({ ...draft, licenseNumber: v })} placeholder="NTB-12345" />
              <TextInput label="Rate / day (NPR)" type="number" value={draft.ratePerDay} onChange={(v) => setDraft({ ...draft, ratePerDay: v })} placeholder="5000" />
            </>
          ) : (
            <>
              <Stat label="License No." value={license || '—'} />
              <Stat label="Rate / day" value={rate ? `NPR ${Number(rate).toLocaleString()}` : '—'} icon={Banknote} />
            </>
          )}
          <Stat label="Tours completed" value={guideRecord?.completedTours ?? '—'} icon={Compass} />
          <Stat label="Rating" value={guideRecord?.rating > 0 ? `${guideRecord.rating} ★` : 'New'} accent="#F59E0B" />
          <Stat label="Verified" value={(guideRecord?.isVerified || user.profileData?.isVerified) ? 'Yes ✓' : 'Pending'} accent={(guideRecord?.isVerified || user.profileData?.isVerified) ? '#10B981' : '#F59E0B'} />
          <Stat label="Member since" value={new Date(user.joinDate || Date.now()).getFullYear()} />
        </div>
        {expertise.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Expertise</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {expertise.map((e, i) => <span key={i} style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB', padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>{e}</span>)}
            </div>
          </div>
        )}
      </Card>

      <Card title="Languages" icon={Languages}>
        <ChipList items={languages} editing={editing} addLabel="Add a language (e.g. Nepali)"
          onAdd={(v) => setDraft({ ...draft, languages: [...(draft.languages || []), v] })}
          onRemove={(i) => setDraft({ ...draft, languages: draft.languages.filter((_, idx) => idx !== i) })}
        />
      </Card>
    </>
  );
};

const GuideSidebar = ({ user }) => {
  // Live engagement data — polls /api/users/:id/role-stats every 60s so newly placed
  // bookings on the guide's assigned destinations show up without a page refresh.
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState(null); // { count, averageRating, reviews[] }

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const { data } = await api.get(`/users/${user._id}/role-stats`);
        if (!cancelled) setStats(data);
      } catch (_) { /* keep previous snapshot */ }
      finally { if (!cancelled) setLoading(false); }
    };
    pull();
    const id = setInterval(pull, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?._id]);

  // Reviews for this guide — refreshes once on mount (not polled, reviews are slow-moving).
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    api.get(`/users/${user._id}/reviews`)
      .then(({ data }) => { if (!cancelled) setReviews(data); })
      .catch(() => { if (!cancelled) setReviews({ count: 0, averageRating: null, reviews: [] }); });
    return () => { cancelled = true; };
  }, [user?._id]);

  const upcoming = stats?.upcomingEngagements || [];
  const past = stats?.pastEngagements || [];
  const totalEngagements = stats?.totalEngagements ?? 0;
  const totalEarnings = stats?.totalEarnings ?? 0;
  const assignedDestinations = stats?.assignedDestinations || [];

  return (
    <>
      <Card title="Earnings (estimated)" icon={Banknote} accent="#A2D729">
        <p style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#10B981' }}>
          NPR {Number(totalEarnings).toLocaleString('en-IN')}
        </p>
        <p style={{ fontSize: '0.7rem', opacity: 0.55, marginTop: 4 }}>
          {totalEngagements} engagement{totalEngagements === 1 ? '' : 's'} across {assignedDestinations.length} destination{assignedDestinations.length === 1 ? '' : 's'} · NPR 1,500/traveller/day
        </p>
      </Card>

      <Card title="Upcoming engagements" icon={Compass}>
        {loading ? (
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Loading…</p>
        ) : upcoming.length === 0 ? (
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>No upcoming engagements. New bookings on your assigned destinations will appear here.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {upcoming.slice(0, 5).map((b) => (
              <li key={b._id} style={{ padding: '0.55rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {b.destination?.name || 'Destination'} · {b.travelers}p × {b.durationDays}d
                </p>
                <p style={{ fontSize: '0.7rem', opacity: 0.55 }}>
                  @{b.user?.username || 'traveler'} · {b.startDate ? new Date(b.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'date TBD'} · {b.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Recent engagements" icon={Star} accent="#F4A261">
        {past.length === 0 ? (
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>No completed engagements yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {past.slice(0, 4).map((b) => (
              <li key={b._id} style={{ padding: '0.55rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '0.78rem' }}>{b.destination?.name || 'Destination'} · @{b.user?.username || 'traveler'}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.55 }}>{b.status} · NPR {Number(b.pricing?.totalCost || 0).toLocaleString('en-IN')}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ReviewsCard reviews={reviews} />
    </>
  );
};

/* ----------  HOTEL  ---------- */

const HotelPanel = ({ user, hotelRecord, editing, draft, setDraft }) => {
  const presetAmenities = ['WiFi', 'AC', 'Breakfast included', 'Parking', 'Hot Water', 'Laundry'];
  const current = (editing ? draft.amenities : user.profileData?.amenities) || [];

  const toggleAmenity = (a) => {
    if (!editing) return;
    const exists = (draft.amenities || []).includes(a);
    setDraft({
      ...draft,
      amenities: exists
        ? draft.amenities.filter(x => x !== a)
        : [...(draft.amenities || []), a],
    });
  };

  return (
    <>
      <Card title="Hotel Details" icon={Hotel}>
        {editing ? (
          <>
            <TextInput label="Hotel Name" value={draft.hotelName} onChange={(v) => setDraft({ ...draft, hotelName: v })} placeholder="Mountain View Lodge" />
            <TextInput label="Base Room Rate (NPR / night)" type="number" value={draft.baseRoomRate} onChange={(v) => setDraft({ ...draft, baseRoomRate: v })} placeholder="2500" />
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <Stat label="Hotel Name" value={hotelRecord?.name || user.profileData?.hotelName || '—'} />
            <Stat label="Base Rate / night" value={hotelRecord?.basePrice ? `NPR ${Number(hotelRecord.basePrice).toLocaleString()}` : user.profileData?.baseRoomRate ? `NPR ${Number(user.profileData.baseRoomRate).toLocaleString()}` : '—'} icon={Banknote} />
            <Stat label="Total rooms" value={hotelRecord?.totalRooms ?? '—'} />
            <Stat label="Available" value={hotelRecord ? `${(hotelRecord.totalRooms||0) - (hotelRecord.bookedRooms||0)} free` : '—'} accent={hotelRecord && (hotelRecord.totalRooms - hotelRecord.bookedRooms) > 0 ? '#10B981' : '#ef4444'} />
          </div>
        )}
      </Card>

      <Card title="Amenities Matrix" icon={ListChecks}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {presetAmenities.map((a) => {
            const active = current.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                disabled={!editing}
                style={{
                  background: active ? 'rgba(37,99,235,0.1)' : '#f8fafc',
                  border: `1px solid ${active ? '#2563EB' : '#e2e8f0'}`,
                  color: active ? '#2563EB' : '#94a3b8',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 6,
                  cursor: editing ? 'pointer' : 'default',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{
                  width: 14, height: 14,
                  borderRadius: 3,
                  border: `1px solid ${active ? '#2563EB' : '#e2e8f0'}`,
                  background: active ? '#2563EB' : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0D0A02', fontSize: 10, fontWeight: 900,
                }}>{active ? '✓' : ''}</span>
                {a}
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
};

const HotelSidebar = ({ user }) => {
  // Live booking stream — polls /api/users/:id/role-stats every 60s so the hotel
  // owner sees new reservations on their assigned destinations in near-real-time.
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [reviews, setReviews] = useState(null);

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
      } catch (_) { /* keep previous snapshot */ }
      finally { if (!cancelled) setLoading(false); }
    };
    pull();
    const id = setInterval(pull, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?._id]);

  // Reviews fetch — one-shot, reviews are slow-moving so no need to poll.
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    api.get(`/users/${user._id}/reviews`)
      .then(({ data }) => { if (!cancelled) setReviews(data); })
      .catch(() => { if (!cancelled) setReviews({ count: 0, averageRating: null, reviews: [] }); });
    return () => { cancelled = true; };
  }, [user?._id]);

  const upcoming = stats?.upcomingReservations || [];
  const past = stats?.pastReservations || [];
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalBookings = stats?.totalBookings ?? 0;
  const assignedDestinations = stats?.assignedDestinations || [];

  return (
    <>
      <Card title="Revenue (live)" icon={Banknote} accent="#A2D729">
        <p style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#10B981' }}>
          NPR {Number(totalRevenue).toLocaleString('en-IN')}
        </p>
        <p style={{ fontSize: '0.7rem', opacity: 0.55, marginTop: 4 }}>
          {totalBookings} booking{totalBookings === 1 ? '' : 's'} across {assignedDestinations.length} destination{assignedDestinations.length === 1 ? '' : 's'} · net of cancellations
        </p>
        {lastSync && (
          <p style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 6, fontFamily: 'monospace' }}>
            ● synced {lastSync.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </Card>

      <Card title="Upcoming reservations" icon={Compass}>
        {loading ? (
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Loading…</p>
        ) : upcoming.length === 0 ? (
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>
            No upcoming reservations. New bookings on destinations assigned to your hotel will appear here automatically.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {upcoming.slice(0, 5).map((b) => (
              <li key={b._id} style={{ padding: '0.55rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{b.destination?.name || 'Destination'}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.55 }}>
                  @{b.user?.username || 'guest'} · {b.travelers}p × {b.durationDays}d · {b.startDate ? new Date(b.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'date TBD'}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700, marginTop: 2 }}>
                  NPR {Number(b.pricing?.totalCost || 0).toLocaleString('en-IN')} · {b.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Recent stays" icon={Star} accent="#F4A261">
        {past.length === 0 ? (
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>No completed or cancelled stays yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {past.slice(0, 4).map((b) => (
              <li key={b._id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '0.78rem' }}>{b.destination?.name || 'Destination'} · @{b.user?.username || 'guest'}</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.55 }}>
                  {b.status} · NPR {Number(b.pricing?.totalCost || 0).toLocaleString('en-IN')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ReviewsCard reviews={reviews} />
    </>
  );
};

/* ----------  REVIEWS CARD (shared between guide + hotel sidebars)  ---------- */

const ReviewsCard = ({ reviews }) => {
  const list = reviews?.reviews || [];
  const avg = reviews?.averageRating;
  const count = reviews?.count || 0;
  return (
    <Card title="What travelers say" icon={Star} accent="#A2D729">
      {list.length === 0 ? (
        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>
          No reviews yet. Trips you complete with travelers will collect reviews here.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ color: n <= Math.round(avg || 0) ? '#F59E0B' : '#e2e8f0', fontSize: '1rem' }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F59E0B' }}>{avg}</span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({count} review{count === 1 ? '' : 's'})</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.slice(0, 5).map((r) => (
              <li key={r._id} style={{ padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #2563EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{r.destination}</span>
                </div>
                {r.comment && (
                  <p style={{ fontSize: '0.78rem', fontStyle: 'italic', opacity: 0.85, lineHeight: 1.45, marginBottom: 4 }}>
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
                <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>— @{r.author}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
};

/* ----------  ADMIN (light)  ---------- */

const AdminPanel = ({ user }) => (
  <Card title="Administrator" icon={ShieldCheck} accent="#E63946">
    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
      {user.username} has system administrator privileges. Use the /admin route for management.
    </p>
  </Card>
);
const AdminSidebar = () => (
  <Card title="System" icon={ShieldCheck} accent="#E63946">
    <p style={{ fontSize: '0.8rem', opacity: 0.65 }}>All operational tooling lives in the Admin Dashboard.</p>
  </Card>
);

/* ----------  STAT TILE  ---------- */

const Stat = ({ label, value, icon: Icon, accent = '#2563EB' }) => (
  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.85rem 1rem', border: '1px solid #e2e8f0' }}>
    <p style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>{label}</p>
    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: accent, display: 'flex', alignItems: 'center', gap: 6 }}>
      {Icon && <Icon size={14} />} {value}
    </p>
  </div>
);

export default Profile;
