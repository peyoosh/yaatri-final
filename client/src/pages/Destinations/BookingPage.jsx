import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Compass, CheckCircle2, UserCheck, Timer, Users, Calendar,
  Building, CreditCard, ChevronDown, ChevronUp, Check, ArrowRight, Star, Loader,
} from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const STATE_TAX = 0.04;
const GST = 0.12;
const DEFAULT_BASE = 2500;

const fmtNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
};

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [dest, setDest] = useState(null);
  const [guides, setGuides] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [travelers, setTravelers] = useState(2);
  const [duration, setDuration] = useState(5);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const endDate = useMemo(() => {
    const d = new Date(startDate);
    if (isNaN(d)) return '';
    d.setDate(d.getDate() + duration);
    return fmtDate(d.toISOString());
  }, [startDate, duration]);

  const [hasGuide, setHasGuide] = useState(false);
  const [hasHotel, setHasHotel] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);
  const [hasMeals, setHasMeals] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [showGuides, setShowGuides] = useState(false);
  const [showHotels, setShowHotels] = useState(false);

  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([api.get(`/destinations/${id}`), api.get('/guides'), api.get('/hotels')])
      .then(([dr, gr, hr]) => {
        setDest(dr.data);
        setGuides(Array.isArray(gr.data) ? gr.data : []);
        setHotels(Array.isArray(hr.data) ? hr.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const selectedGuide = guides.find(g => g._id === selectedGuideId);
  const selectedHotel = hotels.find(h => h._id === selectedHotelId);

  const pricing = useMemo(() => {
    const base = DEFAULT_BASE * travelers * duration;
    const gFee = hasGuide && selectedGuide ? (selectedGuide.dailyFee || 1500) * duration : 0;
    const hFee = hasHotel && selectedHotel ? (selectedHotel.basePrice || 2000) * duration : 0;
    const tFee = hasTransport ? 800 * travelers : 0;
    const mFee = hasMeals ? 600 * travelers * duration : 0;
    const before = base + gFee + hFee + tFee + mFee;
    const st = Math.round(before * STATE_TAX);
    const gst = Math.round(before * GST);
    return { base, gFee, hFee, tFee, mFee, before, st, gst, total: before + st + gst };
  }, [travelers, duration, hasGuide, hasHotel, hasTransport, hasMeals, selectedGuide, selectedHotel]);

  const addOns = [
    ...(hasGuide ? ['guide'] : []),
    ...(hasHotel ? ['premium-lodging'] : []),
    ...(hasTransport ? ['transport'] : []),
    ...(hasMeals ? ['meals'] : []),
  ];

  const handleConfirm = async () => {
    setSubmitting(true); setSubmitError(null);
    try {
      const { data } = await api.post('/bookings', {
        destination: id,
        travelers,
        durationDays: duration,
        addOns,
        baseRate: DEFAULT_BASE,
        startDate,
        assignedGuideId: hasGuide && selectedGuideId ? selectedGuideId : undefined,
        assignedHotelId: hasHotel && selectedHotelId ? selectedHotelId : undefined,
      });
      setConfirmedBooking(data);
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Could not confirm booking.');
    } finally { setSubmitting(false); }
  };

  const handleMarkPaid = async () => {
    if (!confirmedBooking) return;
    setPaying(true);
    try {
      const { data } = await api.patch(`/bookings/${confirmedBooking._id}/confirm-payment`);
      setConfirmedBooking(data);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not confirm payment.');
    } finally { setPaying(false); }
  };

  if (loading) return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400"><Loader className="w-5 h-5 animate-spin" /><span className="text-sm font-semibold">Loading destination…</span></div>
    </div>
  );

  if (!dest) return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-bold text-brand-slate mb-4">Destination not found.</p>
        <button onClick={() => navigate('/destinations')} className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl cursor-pointer">Browse Destinations</button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 pt-28 pb-20 px-6 lg:px-12 xl:px-20">
      <div className="w-full">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-blue transition-colors cursor-pointer mb-6 group">
          <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <header className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue mb-2">RESERVE YOUR TRIP</p>
          <h1 className="text-3xl font-extrabold text-brand-slate tracking-tight">{dest.name}</h1>
          <p className="text-sm text-gray-400 font-medium mt-1 flex items-center gap-1">
            <Compass className="w-4 h-4 text-brand-blue" /> {dest.region} · {dest.terrainType}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {!confirmedBooking ? (
            <motion.div key="configurator" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* LEFT — Configurator */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest block">STEP-BY-STEP CHECKOUT</span>
                    <h2 className="text-2xl font-extrabold text-brand-slate tracking-tight mt-1">Configure your journey</h2>
                  </div>

                  {/* Travelers + Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-50">
                    <div>
                      <label className="text-xs font-bold text-brand-slate block mb-2 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-brand-blue" /> Number of Travelers
                      </label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setTravelers(v => Math.max(1, v - 1))} className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer">−</button>
                        <span className="w-12 text-center text-sm font-extrabold text-brand-slate">{travelers}</span>
                        <button onClick={() => setTravelers(v => Math.min(30, v + 1))} className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer">+</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-brand-slate block mb-2 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-blue" /> Trek Start Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-brand-blue font-semibold text-sm"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                  </div>

                  {/* Duration + Date summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-brand-slate block mb-2 flex items-center gap-1.5">
                        <Timer className="w-4 h-4 text-brand-blue" /> Expedition Duration
                      </label>
                      <select value={duration} onChange={e => setDuration(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-brand-blue font-semibold text-sm bg-white cursor-pointer"
                      >
                        {[3, 5, 7, 10, 12, 14, 21].map(d => (
                          <option key={d} value={d}>{d} Days</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Calculated Window</p>
                      <p className="text-xs font-semibold text-brand-slate mt-1">
                        Arrives {startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        <br />Returns <strong className="text-brand-blue">{endDate}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Add-ons & Enhancements</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'guide', label: 'Local Guide', sub: 'From NPR 1,500/day', Icon: UserCheck, active: hasGuide, toggle: () => { setHasGuide(v => !v); if (hasGuide) { setSelectedGuideId(''); setShowGuides(false); } else setShowGuides(true); }, activeColor: 'border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue/30', iconColor: 'text-brand-blue' },
                        { key: 'hotel', label: 'Premium Lodging', sub: 'From NPR 2,000/night', Icon: Building, active: hasHotel, toggle: () => { setHasHotel(v => !v); if (hasHotel) { setSelectedHotelId(''); setShowHotels(false); } else setShowHotels(true); }, activeColor: 'border-brand-saffron bg-brand-saffron/5 ring-1 ring-brand-saffron/30', iconColor: 'text-brand-saffron' },
                        { key: 'transport', label: 'Direct Transport', sub: 'NPR 800 flat/guest', Icon: Compass, active: hasTransport, toggle: () => setHasTransport(v => !v), activeColor: 'border-brand-pink bg-brand-pink/5 ring-1 ring-brand-pink/30', iconColor: 'text-brand-pink' },
                        { key: 'meals', label: 'Full Board Meals', sub: 'NPR 600/day', Icon: ShieldCheck, active: hasMeals, toggle: () => setHasMeals(v => !v), activeColor: 'border-brand-green bg-brand-green/5 ring-1 ring-brand-green/30', iconColor: 'text-brand-green' },
                      ].map(({ key, label, sub, Icon, active, toggle, activeColor, iconColor }) => (
                        <button key={key} onClick={toggle}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 cursor-pointer transition-all ${active ? activeColor : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                        >
                          <Icon className={`w-6 h-6 ${active ? iconColor : 'text-gray-400'}`} />
                          <div>
                            <h4 className="text-xs font-bold text-brand-slate">{label}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guide picker */}
                  <AnimatePresence>
                    {hasGuide && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Select Your Sherpa Guide</span>
                          <button onClick={() => setShowGuides(v => !v)} className="text-gray-400 cursor-pointer">
                            {showGuides ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                        {showGuides && (
                          <div className="flex flex-col gap-3">
                            {guides.length === 0 ? (
                              <p className="text-xs text-gray-400">No guides available yet. We'll assign one closer to your trip.</p>
                            ) : guides.map(g => {
                              const picked = selectedGuideId === g._id;
                              return (
                                <div key={g._id} onClick={() => setSelectedGuideId(picked ? '' : g._id)}
                                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${picked ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center text-sm border-2 border-brand-blue/20">
                                      {(g.guideName || g.username || 'G').slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="text-xs font-bold text-brand-slate">{g.guideName || g.username}</h4>
                                        {g.isVerified && <span className="px-1 py-0.5 bg-brand-green/10 text-brand-green text-[7px] font-bold rounded">VERIFIED</span>}
                                        {picked && <Check className="w-3 h-3 text-brand-blue" />}
                                      </div>
                                      {g.expertise?.length > 0 && <p className="text-[9px] text-gray-400 line-clamp-1">{g.expertise.join(' · ')}</p>}
                                      <p className="text-[9px] text-gray-400">{g.completedTours || 0} tours completed {g.rating > 0 ? `· ${g.rating}★` : ''}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-extrabold text-brand-slate shrink-0">
                                    {fmtNPR(g.dailyFee || 1500)}/day
                                  </span>
                                </div>
                              );
                            })}
                            {!selectedGuideId && <p className="text-[10px] text-gray-400 italic">No guide selected — we'll pair you with whoever is free.</p>}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hotel picker */}
                  <AnimatePresence>
                    {hasHotel && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold text-brand-saffron uppercase tracking-wider">Select Premium Accommodation</span>
                          <button onClick={() => setShowHotels(v => !v)} className="text-gray-400 cursor-pointer">
                            {showHotels ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                        {showHotels && (
                          <div className="flex flex-col gap-3">
                            {hotels.length === 0 ? (
                              <p className="text-xs text-gray-400">No hotels registered yet. We'll arrange accommodation.</p>
                            ) : hotels.map(h => {
                              const picked = selectedHotelId === h._id;
                              const avail = (h.totalRooms || 0) - (h.bookedRooms || 0);
                              return (
                                <div key={h._id} onClick={() => setSelectedHotelId(picked ? '' : h._id)}
                                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${picked ? 'border-brand-saffron bg-brand-saffron/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-saffron/10 text-brand-saffron flex items-center justify-center">
                                      <Building className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="text-xs font-bold text-brand-slate">{h.name}</h4>
                                        {picked && <Check className="w-3 h-3 text-brand-saffron" />}
                                        <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${avail > 0 ? 'bg-brand-saffron/10 text-brand-saffron' : 'bg-red-100 text-red-500'}`}>
                                          {avail > 0 ? `${avail} rooms` : 'Full'}
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-gray-400">{h.features?.slice(0, 2).join(' · ') || 'Premium lodging'}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-extrabold text-brand-slate shrink-0">
                                    {fmtNPR(h.basePrice || 2000)}/night
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT — Sticky cost breakdown */}
              <div className="lg:col-span-5">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm sticky top-28 flex flex-col gap-6">
                  <div>
                    <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">COST BREAKDOWN</h2>
                    <div className="p-3.5 bg-brand-green/5 rounded-xl border border-brand-green/10 flex flex-col gap-1.5 mt-3">
                      <p className="text-[10px] font-bold text-brand-green uppercase tracking-wider flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5" /> Checked Travel Window
                      </p>
                      <p className="text-xs font-semibold text-brand-slate leading-none">
                        {startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'Choose Start'} → {endDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 font-semibold text-xs text-slate-500 border-b border-slate-50 pb-4">
                    <div className="flex justify-between"><span>Base rate ({travelers}p × {duration}d):</span><span className="text-brand-slate">{fmtNPR(pricing.base)}</span></div>
                    {pricing.gFee > 0 && <div className="flex justify-between"><span className="text-brand-blue">Local Guide:</span><span className="text-brand-slate">{fmtNPR(pricing.gFee)}</span></div>}
                    {pricing.hFee > 0 && <div className="flex justify-between"><span className="text-brand-saffron">Premium Lodging:</span><span className="text-brand-slate">{fmtNPR(pricing.hFee)}</span></div>}
                    {pricing.tFee > 0 && <div className="flex justify-between"><span className="text-brand-pink">Direct Transport:</span><span className="text-brand-slate">{fmtNPR(pricing.tFee)}</span></div>}
                    {pricing.mFee > 0 && <div className="flex justify-between"><span className="text-brand-green">Meals (full board):</span><span className="text-brand-slate">{fmtNPR(pricing.mFee)}</span></div>}
                    <div className="flex justify-between border-t border-slate-50 pt-3"><span>Himalayan State Tax (4%):</span><span className="text-brand-slate">{fmtNPR(pricing.st)}</span></div>
                    <div className="flex justify-between"><span>Nepal Tourism GST (12%):</span><span className="text-brand-slate">{fmtNPR(pricing.gst)}</span></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aggregate total</p>
                      <p className="text-3xl font-black text-brand-green leading-none mt-1">{fmtNPR(pricing.total)}</p>
                    </div>
                    <span className="px-2.5 py-1.5 bg-brand-green/10 text-brand-green rounded-lg text-[10px] font-bold uppercase">NPR</span>
                  </div>

                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full py-4 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-blue/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? <><Loader className="w-4 h-4 animate-spin" /> Confirming…</> : <>Confirm Booking <ArrowRight className="w-4 h-4" /></>}
                  </button>

                  {submitError && <p className="text-xs text-red-500 text-center">{submitError}</p>}

                  <p className="text-center font-mono text-[9px] text-gray-400">Payment processed via secure escrow cooperative.</p>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-around text-[10px] font-bold text-gray-400">
                    <div className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-brand-green" /><span>Secure Booking</span></div>
                    <div className="flex items-center gap-1"><Check className="w-4 h-4 text-brand-blue" /><span>Verified Partners</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full flex justify-center"
            >
              <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-2xl flex flex-col gap-6 p-8" style={{ maxWidth: '52rem' }}>
                {(confirmedBooking.status === 'pending_payment' || confirmedBooking.status === 'pending') ? (
                  <>
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-full bg-brand-saffron/10 text-brand-saffron flex items-center justify-center animate-pulse">
                        <CreditCard className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 bg-brand-saffron/10 text-brand-saffron text-[9px] font-bold rounded-full uppercase tracking-widest">PENDING PAYMENT</span>
                      <h2 className="text-2xl font-extrabold text-brand-slate tracking-tight">Booking Placed — Awaiting Payment</h2>
                      <p className="text-xs text-gray-500 font-medium max-w-md">
                        Wire the exact amount to the escrow account below, OR scan the eSewa QR on your phone. Then click confirm.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl font-mono text-[11px] text-left border border-slate-800 flex flex-col gap-2 shadow-inner">
                        <div className="flex justify-between border-b border-slate-800 pb-1.5 text-white font-semibold"><span>YAATRI ESCROW CO-OP CORP</span></div>
                        <div>BANK: Global IME Bank Limited, Lalitpur</div>
                        <div>A/C: 43-2009-8800-43</div>
                        <div>REF: {String(confirmedBooking._id).slice(-8).toUpperCase()}</div>
                        <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1 text-brand-green font-bold">
                          <span>WIRE VALUE:</span><span>{fmtNPR(confirmedBooking.pricing?.totalCost)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center gap-3 p-5 bg-white rounded-2xl border border-slate-200">
                        <img
                          src="/esewa-qr.png"
                          alt="eSewa QR"
                          className="w-36 h-36 object-contain"
                          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="hidden w-36 h-36 items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-300 text-[10px] text-gray-400 text-center font-medium p-3">
                          Place esewa-qr.png in client/public/
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-brand-green font-bold text-sm">e</span>
                          <span className="text-xs font-bold text-slate-700">Sewa</span>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center">Scan with eSewa app to pay {fmtNPR(confirmedBooking.pricing?.totalCost)}</p>
                      </div>
                    </div>

                    {submitError && <p className="text-xs text-red-500 text-center">{submitError}</p>}

                    <button
                      onClick={handleMarkPaid}
                      disabled={paying}
                      className="w-full py-3.5 bg-brand-saffron hover:bg-brand-saffron/95 text-white font-extrabold text-sm rounded-xl shadow-md shadow-brand-saffron/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {paying ? <><Loader className="w-4 h-4 animate-spin" /> Confirming…</> : <><CheckCircle2 className="w-4 h-4" /> I have paid — Confirm</>}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-[9px] font-bold rounded-full uppercase tracking-widest self-center">ESCROW_FUNDS_HELD</span>
                      <h2 className="text-2xl font-extrabold text-brand-slate tracking-tight">Payment received · awaiting admin approval</h2>
                      <p className="text-xs text-gray-500 font-medium max-w-md">Your payment is safely locked in Yaatri's escrow. An invoice has been emailed to you.</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl w-full text-left flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-500">Booking REF:</span>
                      <strong className="font-mono text-brand-slate">{String(confirmedBooking._id).slice(-8).toUpperCase()}</strong>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 w-full border-t border-slate-100 pt-4">
                  <button onClick={() => navigate('/dashboard')} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">
                    View in dashboard
                  </button>
                  <button onClick={() => navigate('/destinations')} className="py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-blue/15 cursor-pointer">
                    Book another
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
