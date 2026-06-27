import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, ClipboardList, TrendingUp, Sparkles, Plus, Heart,
  CheckCircle2, AlertTriangle, Clock, Landmark, UserCheck, Loader,
  Save, Camera, LogOut, Send, Lightbulb, UserX, MessageSquare,
} from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompression';
import GoogleMapView from '../../components/Common/GoogleMapView';

const fmtNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function StatusBadge({ status }) {
  const map = {
    pending_payment: { bg: 'bg-brand-saffron/10 text-brand-saffron', Icon: Clock,         label: 'PENDING PAYMENT' },
    pending:         { bg: 'bg-brand-saffron/10 text-brand-saffron', Icon: Clock,         label: 'PENDING' },
    escrow_held:     { bg: 'bg-brand-green/10 text-brand-green',     Icon: Landmark,      label: 'FUNDS IN ESCROW' },
    approved:        { bg: 'bg-brand-blue/10 text-brand-blue',       Icon: UserCheck,     label: 'APPROVED' },
    confirmed:       { bg: 'bg-brand-blue/10 text-brand-blue',       Icon: UserCheck,     label: 'CONFIRMED' },
    in_progress:     { bg: 'bg-purple-100 text-purple-600',          Icon: TrendingUp,    label: 'IN PROGRESS' },
    completed:       { bg: 'bg-gray-100 text-gray-500',              Icon: CheckCircle2,  label: 'COMPLETED' },
    expired:         { bg: 'bg-orange-100 text-orange-500',          Icon: AlertTriangle, label: 'EXPIRED' },
    cancelled:       { bg: 'bg-red-100 text-red-500',                Icon: AlertTriangle, label: 'CANCELLED' },
  };
  const cfg = map[status] || map.pending_payment;
  const Icon = cfg.Icon;
  return (
    <span className={`px-2.5 py-1 ${cfg.bg} font-bold text-[10px] rounded uppercase flex items-center gap-1 whitespace-nowrap`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   TRAVELER DASHBOARD
═══════════════════════════════════════════ */
function TravelerDashboard({ user }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [favDests, setFavDests] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/bookings/me'),
      api.get('/destinations'),
    ]).then(([bRes, dRes]) => {
      const bks = bRes.status === 'fulfilled' ? bRes.value.data || [] : [];
      const dests = dRes.status === 'fulfilled' ? dRes.value.data || [] : [];
      setBookings(bks);
      const favIds = new Set((user?.profileData?.favoriteDestinations || []).map(String));
      setFavDests(dests.filter(d => favIds.has(String(d._id))));
    }).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (bk) => {
    if (!window.confirm(`Cancel booking for ${bk.destination?.name || 'this trip'}? This cannot be undone.`)) return;
    setCancellingId(bk._id);
    try {
      const { data } = await api.patch(`/bookings/${bk._id}/cancel`);
      setBookings(prev => prev.map(b => b._id === bk._id ? { ...b, ...data, destination: b.destination } : b));
    } catch (err) { alert(err?.response?.data?.message || 'Failed to cancel.'); }
    finally { setCancellingId(null); }
  };

  const upcoming = bookings.filter(b => ['pending', 'pending_payment', 'escrow_held', 'confirmed', 'approved'].includes(b.status));
  const past     = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  const tripDests = (() => {
    const byId = {};
    bookings.forEach(b => { const d = b.destination; if (d && d._id && !byId[String(d._id)]) byId[String(d._id)] = d; });
    return Object.values(byId);
  })();

  if (loading) return <div className="flex items-center justify-center py-20"><Loader className="w-6 h-6 text-brand-blue animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT — bookings */}
      <div className="lg:col-span-8 flex flex-col gap-6">

        {tripDests.length > 0 && (
          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-sm font-extrabold text-brand-slate tracking-tight mb-3">Journey Map</h2>
            <p className="text-xs text-gray-400 font-medium mb-4">
              {tripDests.length} destination{tripDests.length !== 1 ? 's' : ''} across your {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </p>
            <GoogleMapView destinations={tripDests} height={280} onMarkerClick={d => navigate(`/destination/${d._id}`)} />
          </section>
        )}

        <section>
          <h2 className="text-lg font-extrabold text-brand-slate tracking-tight mb-4">Active Expedition Bookings</h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center gap-3">
              <ClipboardList className="w-10 h-10 text-gray-300" />
              <div>
                <h3 className="font-bold text-brand-slate text-base">No active bookings</h3>
                <p className="text-gray-400 text-xs mt-1">Head to the catalog to register your spot.</p>
              </div>
              <button onClick={() => navigate('/destinations')} className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg mt-1 cursor-pointer hover:bg-brand-blue/90">
                Explore Destinations
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {upcoming.map(bk => {
                const dest = bk.destination || {};
                return (
                  <div key={bk._id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row gap-5 items-start justify-between">
                    <div className="flex gap-4 items-start">
                      {dest.imageURL && <img src={dest.imageURL} alt={dest.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-brand-slate text-base">{dest.name || 'Destination'}</h3>
                          <StatusBadge status={bk.status} />
                        </div>
                        <p className="text-xs text-gray-400 font-semibold mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-pink" />
                          {dest.region} · {bk.durationDays} Days · {bk.travelers}p
                        </p>
                        <p className="font-mono text-[10px] text-gray-400 mt-2">
                          DEPARTURE: {fmtDate(bk.startDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col gap-2 items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                        <p className="text-lg font-black text-brand-green leading-none mt-1">{fmtNPR(bk.pricing?.totalCost)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {(bk.status === 'pending_payment' || bk.status === 'pending') && (
                          <button onClick={() => navigate(`/destinations/book/${dest._id}`)}
                            className="px-3.5 py-1.5 bg-brand-saffron hover:bg-brand-saffron/90 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer">
                            Process Payment
                          </button>
                        )}
                        {!['completed', 'cancelled'].includes(bk.status) && (
                          <button
                            onClick={() => handleCancel(bk)}
                            disabled={cancellingId === bk._id}
                            className="px-2.5 py-1.5 border border-red-100 text-red-500 hover:bg-red-50 text-[10px] font-bold rounded-lg cursor-pointer disabled:opacity-50"
                          >
                            {cancellingId === bk._id ? 'Cancelling…' : 'Cancel Trip'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-brand-slate tracking-tight mb-4">Trip History</h2>
            <div className="flex flex-col gap-4">
              {past.map(bk => {
                const dest = bk.destination || {};
                return (
                  <div key={bk._id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-start justify-between opacity-80">
                    <div className="flex gap-3 items-center">
                      {dest.imageURL && <img src={dest.imageURL} alt={dest.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                      <div>
                        <h3 className="font-extrabold text-brand-slate text-sm">{dest.name || 'Destination'}</h3>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{dest.region} · {bk.durationDays}d · {fmtDate(bk.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={bk.status} />
                      <span className="text-sm font-bold text-brand-slate">{fmtNPR(bk.pricing?.totalCost)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* RIGHT — sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Stats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-brand-blue" /> Traveler Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[9px] font-bold text-gray-400 uppercase">Trips Booked</p>
              <p className="text-xl font-bold text-brand-slate mt-1">{bookings.length}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[9px] font-bold text-gray-400 uppercase">Favourites</p>
              <p className="text-xl font-bold text-brand-slate mt-1">{(user?.profileData?.favoriteDestinations || []).length}</p>
            </div>
          </div>
        </div>

        {/* Verified member banner */}
        <div className="text-white p-5 rounded-2xl shadow-md relative overflow-hidden" style={{ background: 'linear-gradient(to right, #2563EB, #1d4ed8)' }}>
          <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-16 h-16" /></div>
          <span className="text-[9px] font-bold text-brand-saffron uppercase tracking-widest block">MEMBERSHIP PORTAL</span>
          <h4 className="text-base font-extrabold mt-1">Escrow Backed Account</h4>
          <p className="text-[11px] text-blue-100 leading-relaxed mt-2">All payments you wire are placed securely inside our cooperative bank escrow.</p>
        </div>

        {/* Favourites */}
        {favDests.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-brand-pink" /> Saved Destinations
            </h3>
            <div className="flex flex-col gap-2">
              {favDests.slice(0, 4).map(d => (
                <button key={d._id} onClick={() => navigate(`/destination/${d._id}`)}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left">
                  <img src={d.imageURL} alt={d.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-brand-slate">{d.name}</p>
                    <p className="text-[10px] text-gray-400">{d.region}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   VENDOR DASHBOARD (GUIDE + HOTEL)
═══════════════════════════════════════════ */
function VendorDashboard({ user }) {
  const navigate = useNavigate();
  const isGuide = user.role === 'guide';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${user._id}/role-stats`)
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user._id]);

  const bookings = isGuide ? (stats?.pastEngagements || []).concat(stats?.upcomingEngagements || []) : (stats?.pastReservations || []).concat(stats?.upcomingReservations || []);
  const earnings = isGuide ? stats?.totalEarnings : stats?.totalRevenue;
  const upcoming = isGuide ? stats?.upcomingEngagements : stats?.upcomingReservations;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader className="w-6 h-6 text-brand-blue animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* KPI row */}
      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accrued Earnings</p>
          <p className="text-2xl font-black text-brand-green mt-2">{fmtNPR(earnings)}</p>
          <div className="w-full bg-slate-100 h-1 rounded mt-4 overflow-hidden">
            <div className="bg-brand-green h-full w-3/5" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Bookings</p>
          <p className="text-2xl font-black text-brand-slate mt-2">{bookings.length}</p>
          <p className="text-[9px] text-gray-400 font-semibold mt-1">Across {(stats?.assignedDestinations || []).length} destination{(stats?.assignedDestinations || []).length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Escrow Security</p>
          <div className="flex items-center gap-1.5 text-brand-green mt-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>SECURE_ESCROW_ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <h2 className="text-lg font-extrabold text-brand-slate tracking-tight">Active Client Roster</h2>
        {(upcoming || []).length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center gap-3">
            <ClipboardList className="w-10 h-10 text-gray-300 animate-pulse" />
            <div>
              <h3 className="font-bold text-brand-slate text-base">No assigned clients found</h3>
              <p className="text-gray-400 text-xs mt-1">New bookings on your assigned destinations will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(upcoming || []).map(bk => (
              <div key={bk._id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue text-[9px] font-bold rounded">YAATRI CLIENT</span>
                    <span className="font-mono text-xs text-gray-400">REF: {String(bk._id).slice(-6).toUpperCase()}</span>
                  </div>
                  <h4 className="font-extrabold text-brand-slate text-sm mt-1.5">{bk.destination?.name || 'Destination'}</h4>
                  <p className="text-xs text-gray-400 mt-1">Starting {fmtDate(bk.startDate)} · {bk.travelers}p · {bk.durationDays}d</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-sm font-extrabold text-brand-green">{fmtNPR(bk.pricing?.totalCost)}</p>
                  <StatusBadge status={bk.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[9px] font-bold text-brand-saffron uppercase block">COOPERATIVE LEDGER</span>
          <h4 className="text-sm font-bold text-white mt-1">Request Bank Settlement?</h4>
          <div className="flex flex-col gap-1.5 font-mono text-[11px] text-slate-400 mt-3">
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span>Pending Payout:</span>
              <span className="text-brand-green font-bold">{fmtNPR(user.vendorLedger?.pendingPayout)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span>Total Earned:</span>
              <span className="text-white font-bold">{fmtNPR(user.vendorLedger?.totalEarned)}</span>
            </div>
            <div className="flex justify-between">
              <span>Already Paid:</span>
              <span className="text-white font-bold">{fmtNPR(user.vendorLedger?.totalWithdrawn)}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed mt-3 font-medium">Once a trek is completed, escrow locks decrypt. Funds wire to Kathmandu cooperative branch.</p>
          <button
            onClick={async () => {
              const amount = Number(user.vendorLedger?.pendingPayout || 0);
              if (amount <= 0) { alert('No pending balance to request.'); return; }
              try {
                await api.post('/vendors/payout-request', { amount, note: 'Requesting full pending payout.' });
                alert('Payout request filed! An admin will review and process it shortly.');
              } catch (err) { alert(err.response?.data?.message || 'Failed to file payout request.'); }
            }}
            className="w-full py-2 bg-brand-pink text-white font-bold text-[10px] rounded-xl hover:bg-brand-pink/90 transition-all mt-4 cursor-pointer uppercase text-center"
          >
            Initiate Settlement
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SETTINGS TAB
═══════════════════════════════════════════ */
function SettingsTab({ user, setUser }) {
  const fileRef = useRef(null);
  const [draft, setDraft] = useState({ bio: user.bio || '', avatar: user.avatar || '' });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const pickAvatar = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Avatar must be under 5MB'); return; }
    setError(null);
    try {
      const compressed = await compressImage(f);
      const reader = new FileReader();
      reader.readAsDataURL(compressed);
      reader.onload = () => setDraft(d => ({ ...d, avatar: reader.result }));
    } catch { setError('Could not read file'); }
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const { data } = await api.put('/users/profile', { avatar: draft.avatar, bio: draft.bio });
      if (typeof setUser === 'function') setUser(prev => ({ ...prev, ...data }));
      setSavedAt(new Date());
    } catch (err) { setError(err.response?.data?.message || 'Could not save profile.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Avatar */}
      <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center gap-4 h-fit">
        <div className="w-36 h-36 rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-100" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(16,185,129,0.08) 100%)' }}>
          {draft.avatar ? (
            <img src={draft.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-black text-brand-blue">{(user.username || '?').slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 border border-brand-blue text-brand-blue text-xs font-bold rounded-xl hover:bg-brand-blue/5 cursor-pointer transition-colors">
          <Camera className="w-4 h-4" /> Upload avatar
        </button>
        <p className="text-[10px] text-gray-400 leading-tight">Compressed and stored securely on your account.</p>
      </div>

      {/* Form */}
      <div className="lg:col-span-9 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Account Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[
            { label: 'Username', value: user.username, disabled: true },
            { label: 'Email', value: user.email, disabled: true },
          ].map(({ label, value, disabled }) => (
            <div key={label}>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">{label}</label>
              <input value={value || ''} disabled={disabled} readOnly
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 opacity-60 cursor-not-allowed font-semibold" />
              {disabled && <p className="text-[10px] text-gray-400 mt-1">Contact support to change</p>}
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Bio</label>
          <textarea
            value={draft.bio}
            onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
            rows={3}
            placeholder="Tell other Yaatris about yourself"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-brand-blue resize-none font-medium"
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-60 transition-colors">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {savedAt && <span className="text-xs text-brand-green font-semibold">Saved at {savedAt.toLocaleTimeString()}</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FEEDBACK MODAL
═══════════════════════════════════════════ */
function FeedbackModal({ user, onClose }) {
  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const types = [
    { id: 'bug_report', label: 'Bug report', Icon: AlertTriangle, accent: '#ff6b6b' },
    { id: 'suggestion', label: 'Suggestion', Icon: Lightbulb, accent: '#A2D729' },
    { id: 'account_issue', label: 'Account issue', Icon: UserX, accent: '#F4A261' },
  ];

  const send = async (e) => {
    e?.preventDefault?.();
    if (submitting || message.trim().length < 5) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/queries', {
        email: user?.email || 'dashboard-user@yaatri.local',
        subject: `[Dashboard ${type}] from @${user?.username || 'user'}`,
        type, message,
      });
      setStatus({ ok: true, text: `Thanks — ticket ${String(data?.ticketId || '').slice(-8).toUpperCase()} filed.` });
      setMessage('');
      setTimeout(() => onClose?.(), 1800);
    } catch (err) {
      setStatus({ ok: false, text: err?.response?.data?.message || 'Could not send. Try again.' });
    } finally { setSubmitting(false); }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-brand-saffron uppercase tracking-widest">Quick Feedback</p>
            <h2 className="text-lg font-extrabold text-brand-slate mt-0.5">What's on your mind?</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl font-bold">×</button>
        </div>

        <form onSubmit={send} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {types.map(({ id, label, Icon, accent }) => (
              <button key={id} type="button" onClick={() => setType(id)}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer border transition-all ${
                  type === id ? 'text-white border-transparent' : 'bg-slate-50 border-slate-100 text-gray-600'
                }`}
                style={type === id ? { background: accent, borderColor: accent } : {}}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>

          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Tell us what's working, what's broken, or what would help (min 5 chars)"
            rows={5} maxLength={2000} required minLength={5}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-blue resize-none text-slate-800 font-medium"
          />

          {status && <p className={`text-xs font-semibold ${status.ok ? 'text-brand-green' : 'text-red-500'}`}>{status.text}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting || message.trim().length < 5}
              className="px-5 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer flex items-center gap-2">
              {submitting ? <Loader className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {submitting ? 'Sending…' : 'Send Feedback'}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-gray-400">Sending as <strong>@{user?.username}</strong></p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD SHELL
═══════════════════════════════════════════ */
export default function UserDashboard({ user: userProp }) {
  const navigate = useNavigate();
  const { user: authUser, setUser, logout } = useContext(AuthContext);
  const user = userProp || authUser;

  const isGuide = user?.role === 'guide';
  const isHotel = user?.role === 'hotel' || user?.role === 'hotel_owner';

  const tabs = isGuide || isHotel
    ? [{ id: 'engagements', label: isGuide ? 'My Engagements' : 'Reservations' }, { id: 'settings', label: 'Account & Profile' }]
    : [{ id: 'trips', label: 'Overview & My Trips' }, { id: 'settings', label: 'Account & Profile' }];

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-20">
      <p className="text-gray-400">Please sign in to view your dashboard.</p>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 pt-24 pb-20 px-6 lg:px-12 xl:px-20">
      <div className="w-full flex flex-col gap-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest block">
              COOPERATIVE WORKSPACE // @{user.username}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1 text-brand-slate">
              {isGuide ? 'Guide Ops — ' : isHotel ? 'Hotel Ops — ' : 'Namaste, '}{user.username}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase border border-slate-100 bg-white text-brand-blue">
              Role: {user.role}
            </span>
            <button onClick={() => setFeedbackOpen(true)}
              className="px-4 py-2 bg-brand-saffron/10 border border-brand-saffron/30 text-brand-saffron text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 hover:bg-brand-saffron/20 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> Feedback
            </button>
            {!(isGuide || isHotel) && (
              <button onClick={() => navigate('/destinations')}
                className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1 hover:bg-brand-blue/90 transition-colors">
                <Plus className="w-4 h-4" /> Book New Trip
              </button>
            )}
            <button onClick={() => { logout && logout(); navigate('/login'); }}
              className="p-2.5 border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 rounded-xl cursor-pointer transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-gray-500 hover:text-brand-blue'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'trips' && <TravelerDashboard user={user} />}
        {activeTab === 'engagements' && <VendorDashboard user={user} />}
        {activeTab === 'settings' && <SettingsTab user={user} setUser={setUser} />}
      </div>

      {feedbackOpen && <FeedbackModal user={user} onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
