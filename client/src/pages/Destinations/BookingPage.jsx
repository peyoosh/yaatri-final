import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import {
  Users, Calendar, MapPin, Loader, Check, X, CreditCard, ChevronLeft, ShieldCheck, Sparkles,
  Star, Building2, UserCheck, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';

// Two-tier tax structure per the Yaatri invoicing spec.
const STATE_TAX_RATE = 0.04; // 4%
const GST_RATE = 0.12;       // 12%
const DEFAULT_BASE_RATE = 2500; // NPR per person per day

const ADDONS = [
  { id: 'guide', label: 'Local Guide', rate: 1500, description: 'Verified Yaatri guide accompanies your route' },
  { id: 'premium-lodging', label: 'Premium Lodging', rate: 2000, description: 'Upgraded heated rooms with private bathroom' },
  { id: 'transport', label: 'Transport', rate: 800, description: 'Round-trip from Kathmandu / Pokhara' },
  { id: 'meals', label: 'Full Board Meals', rate: 600, description: '3 meals/day, hot drinks unlimited' },
];

const formatNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  const [travelers, setTravelers] = useState(2);
  const [durationDays, setDurationDays] = useState(5);
  const [addOns, setAddOns] = useState([]);
  const [assignedGuideId, setAssignedGuideId] = useState('');
  const [assignedHotelId, setAssignedHotelId] = useState('');

  const [guides, setGuides] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [showGuides, setShowGuides] = useState(false);
  const [showHotels, setShowHotels] = useState(false);

  // Date picker — defaults to tomorrow so the user has a clear "starts on" expectation.
  // `min` on the input enforces no past dates client-side (server re-validates).
  const todayStr = (() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  })();
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const [startDate, setStartDate] = useState(tomorrowStr);

  // Derived end date — purely display; the server recomputes from startDate + durationDays.
  const endDateStr = (() => {
    const d = new Date(startDate);
    if (Number.isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + Number(durationDays || 0));
    return d.toISOString().slice(0, 10);
  })();
  const fmtPretty = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    let cancelled = false;
    Promise.all([
      api.get(`/destinations/${id}`),
      api.get('/guides'),
      api.get('/hotels'),
    ]).then(([destRes, guidesRes, hotelsRes]) => {
      if (cancelled) return;
      setDestination(destRes.data);
      setGuides(Array.isArray(guidesRes.data) ? guidesRes.data : []);
      setHotels(Array.isArray(hotelsRes.data) ? hotelsRes.data : []);
    }).catch((err) => {
      if (!cancelled) console.error('Failed to load booking data', err);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, user, navigate]);

  // Pricing matrix — recomputed on every change. Same formulae the server enforces.
  const pricing = useMemo(() => {
    const baseRate = DEFAULT_BASE_RATE;
    const t = Math.max(1, Number(travelers) || 1);
    const d = Math.max(1, Number(durationDays) || 1);
    const subtotal = baseRate * t * d;
    const selectedGuide = guides.find(g => g._id === assignedGuideId);
    const selectedHotel = hotels.find(h => h._id === assignedHotelId);
    const addOnPerPersonPerDay = addOns.reduce((sum, id) => {
      if (id === 'guide') return sum + (selectedGuide?.dailyFee || 1500);
      if (id === 'premium-lodging') return sum + (selectedHotel?.basePrice || 2000);
      const a = ADDONS.find(x => x.id === id);
      return sum + (a ? a.rate : 0);
    }, 0);
    const addOnTotal = addOnPerPersonPerDay * t * d;
    const beforeTax = subtotal + addOnTotal;
    const stateTax = Math.round(beforeTax * STATE_TAX_RATE);
    const gst = Math.round(beforeTax * GST_RATE);
    const totalCost = beforeTax + stateTax + gst;
    return { baseRate, subtotal, addOnTotal, beforeTax, stateTax, gst, totalCost };
  }, [travelers, durationDays, addOns, assignedGuideId, assignedHotelId, guides, hotels]);

  const toggleAddon = (id) => {
    const isOn = addOns.includes(id);
    setAddOns((prev) => isOn ? prev.filter(x => x !== id) : [...prev, id]);
    if (!isOn) {
      if (id === 'guide') setShowGuides(true);
      if (id === 'premium-lodging') setShowHotels(true);
    } else {
      if (id === 'guide') { setAssignedGuideId(''); setShowGuides(false); }
      if (id === 'premium-lodging') { setAssignedHotelId(''); setShowHotels(false); }
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await api.post('/bookings', {
        destination: id,
        travelers: Number(travelers),
        durationDays: Number(durationDays),
        addOns,
        baseRate: DEFAULT_BASE_RATE,
        startDate, // server re-derives endDate from startDate + durationDays
        // Only send the guide id when the guide add-on is active AND a specific guide was picked.
        assignedGuideId: addOns.includes('guide') && assignedGuideId ? assignedGuideId : undefined,
        assignedHotelId: addOns.includes('premium-lodging') && assignedHotelId ? assignedHotelId : undefined,
      });
      setConfirmed(data);
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Could not confirm booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <Loader className="animate-spin" /> &nbsp; Loading destination…
      </div>
    );
  }

  if (!destination) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <p>Destination not found.</p>
        <button onClick={() => navigate('/destinations')} className="btn-primary-white">Browse destinations</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian, #0D0A02)', color: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 6%' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#A2D729', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <ChevronLeft size={14} /> Back
        </button>

        <header style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: 3, fontWeight: 700, color: 'var(--hill-green, #059D72)', textTransform: 'uppercase', marginBottom: 8 }}>
            Reserve your trip
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>{destination.name}</h1>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: 0.7, fontSize: '0.9rem' }}>
            <MapPin size={14} /> {destination.region} · {destination.terrainType}
          </p>
        </header>

        {/* CONFIRMATION PANEL */}
        {confirmed ? (
          <ConfirmationCard booking={confirmed} onDashboard={() => navigate('/dashboard')} onAgain={() => setConfirmed(null)} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.4fr) minmax(280px, 1fr)', gap: '2rem' }}>
            {/* LEFT: configurator */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Configure your journey</h2>

              {/* Travelers */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 2, color: '#A6A180', marginBottom: 8 }}>
                  <Users size={12} style={{ display: 'inline', marginRight: 6 }} /> Travelers
                </label>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '4px 4px' }}>
                  <button
                    type="button"
                    onClick={() => setTravelers(v => Math.max(1, Number(v) - 1))}
                    style={{ background: 'none', border: 'none', color: 'white', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem' }}
                  >−</button>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: 28, textAlign: 'center' }}>{travelers}</span>
                  <button
                    type="button"
                    onClick={() => setTravelers(v => Math.min(30, Number(v) + 1))}
                    style={{ background: 'none', border: 'none', color: 'white', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem' }}
                  >+</button>
                </div>
              </div>

              {/* Start date — calendar picker. Min = today so past dates are blocked at the browser. */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 2, color: '#A6A180', marginBottom: 8 }}>
                  <Calendar size={12} style={{ display: 'inline', marginRight: 6 }} /> Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
                <p style={{ fontSize: '0.7rem', opacity: 0.55, marginTop: 6 }}>
                  Trip arrives <strong style={{ color: '#A2D729' }}>{fmtPretty(startDate)}</strong> · returns <strong>{fmtPretty(endDateStr)}</strong> (auto-completes after this date)
                </p>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 2, color: '#A6A180', marginBottom: 8 }}>
                  <Calendar size={12} style={{ display: 'inline', marginRight: 6 }} /> Duration
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 6,
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  {[3, 5, 7, 10, 14, 21].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>

              {/* Add-ons */}
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 2, color: '#A6A180', marginBottom: 8 }}>
                  Optional add-ons
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {ADDONS.map(a => {
                    const active = addOns.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAddon(a.id)}
                        style={{
                          background: active ? 'rgba(162,215,41,0.12)' : 'rgba(0,0,0,0.25)',
                          border: `1px solid ${active ? '#A2D729' : 'rgba(255,255,255,0.08)'}`,
                          color: active ? '#A2D729' : '#A6A180',
                          padding: '0.7rem 0.85rem',
                          borderRadius: 6,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span>{a.label}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.65 }}>+{formatNPR(a.rate)}/day</span>
                        </div>
                        <p style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 400, lineHeight: 1.4 }}>{a.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GUIDE PICKER */}
              {addOns.includes('guide') && (
                <div style={{ marginTop: '1.25rem', background: 'rgba(162,215,41,0.05)', border: '1px solid rgba(162,215,41,0.25)', borderRadius: 8, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setShowGuides(v => !v)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.1rem', background: 'none', border: 'none', color: '#A2D729', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', letterSpacing: 2, textTransform: 'uppercase' }}
                  >
                    <span><UserCheck size={13} style={{ display: 'inline', marginRight: 6 }} />
                      {assignedGuideId ? `Guide: ${guides.find(g => g._id === assignedGuideId)?.guideName || 'Selected'}` : 'Choose a guide'}
                    </span>
                    {showGuides ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showGuides && (
                    <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {guides.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No guides available yet. We'll assign one closer to your trip.</p>
                      ) : guides.map(g => {
                        const picked = assignedGuideId === g._id;
                        return (
                          <div key={g._id} style={{ background: picked ? 'rgba(162,215,41,0.12)' : 'rgba(0,0,0,0.3)', border: `1px solid ${picked ? '#A2D729' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '0.75rem 0.9rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button type="button" onClick={() => setAssignedGuideId(picked ? '' : g._id)} style={{ flex: 1, background: 'none', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 2 }}>
                                    {picked && <span style={{ color: '#A2D729', marginRight: 6 }}>✓</span>}
                                    {g.guideName}
                                    {g.isVerified && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: 'rgba(162,215,41,0.2)', color: '#A2D729', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>VERIFIED</span>}
                                  </p>
                                  <p style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: 2 }}>{g.bio || 'Professional local guide'}</p>
                                  {g.expertise?.length > 0 && <p style={{ fontSize: '0.68rem', color: '#A2D729', opacity: 0.8 }}>{g.expertise.slice(0, 3).join(' · ')}</p>}
                                  <p style={{ fontSize: '0.68rem', opacity: 0.5, marginTop: 2 }}>{g.completedTours || 0} tours completed · {g.rating > 0 ? `${g.rating}★` : 'New'}</p>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#A2D729', fontWeight: 800, whiteSpace: 'nowrap', marginLeft: 12 }}>{formatNPR(g.dailyFee)}/day</span>
                              </div>
                            </button>
                            {g.userId?._id && (
                              <a href={`/profile/${g.userId._id}`} target="_blank" rel="noreferrer" title="View profile" style={{ color: '#A6A180', flexShrink: 0 }}>
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                      {!assignedGuideId && <p style={{ fontSize: '0.7rem', opacity: 0.45, marginTop: 2 }}>No guide selected — we'll pair you with whoever is free.</p>}
                    </div>
                  )}
                </div>
              )}

              {/* HOTEL PICKER */}
              {addOns.includes('premium-lodging') && (
                <div style={{ marginTop: '1.25rem', background: 'rgba(162,215,41,0.05)', border: '1px solid rgba(162,215,41,0.25)', borderRadius: 8, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setShowHotels(v => !v)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.1rem', background: 'none', border: 'none', color: '#A2D729', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', letterSpacing: 2, textTransform: 'uppercase' }}
                  >
                    <span><Building2 size={13} style={{ display: 'inline', marginRight: 6 }} />
                      {assignedHotelId ? `Hotel: ${hotels.find(h => h._id === assignedHotelId)?.name || 'Selected'}` : 'Choose a hotel'}
                    </span>
                    {showHotels ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showHotels && (
                    <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {hotels.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No hotels registered yet. We'll arrange accommodation.</p>
                      ) : hotels.map(h => {
                        const picked = assignedHotelId === h._id;
                        const available = (h.totalRooms || 0) - (h.bookedRooms || 0);
                        return (
                          <div key={h._id} style={{ background: picked ? 'rgba(162,215,41,0.12)' : 'rgba(0,0,0,0.3)', border: `1px solid ${picked ? '#A2D729' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '0.75rem 0.9rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button type="button" onClick={() => setAssignedHotelId(picked ? '' : h._id)} style={{ flex: 1, background: 'none', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 2 }}>
                                    {picked && <span style={{ color: '#A2D729', marginRight: 6 }}>✓</span>}
                                    {h.name}
                                    <span style={{ marginLeft: 8, fontSize: '0.65rem', background: available > 0 ? 'rgba(162,215,41,0.2)' : 'rgba(231,76,60,0.2)', color: available > 0 ? '#A2D729' : '#e74c3c', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>{available > 0 ? `${available} rooms free` : 'Full'}</span>
                                  </p>
                                  {h.features?.length > 0 && <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 2 }}>{h.features.slice(0, 3).join(' · ')}</p>}
                                  <p style={{ fontSize: '0.68rem', opacity: 0.5 }}>Managed by {h.username || h.userId?.username || 'Yaatri Partner'}</p>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#A2D729', fontWeight: 800, whiteSpace: 'nowrap', marginLeft: 12 }}>{formatNPR(h.basePrice)}/night</span>
                              </div>
                            </button>
                            {h.userId?._id && (
                              <a href={`/profile/${h.userId._id}`} target="_blank" rel="noreferrer" title="View profile" style={{ color: '#A6A180', flexShrink: 0 }}>
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                      {!assignedHotelId && <p style={{ fontSize: '0.7rem', opacity: 0.45, marginTop: 2 }}>No hotel selected — we'll arrange accommodation for you.</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: live total */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '2rem', height: 'fit-content', position: 'sticky', top: 100 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#A2D729', marginBottom: '1.5rem' }}>
                <CreditCard size={14} style={{ display: 'inline', marginRight: 6 }} /> Cost Breakdown
              </h2>

              {/* Date summary at top of breakdown so the user always sees what they're committing to. */}
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '0.75rem 0.9rem', marginBottom: '1rem', border: '1px solid rgba(162,215,41,0.18)' }}>
                <p style={{ fontSize: '0.65rem', letterSpacing: 2, color: '#A2D729', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Travel window</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4 }}>
                  {fmtPretty(startDate)}
                </p>
                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                  → returns {fmtPretty(endDateStr)} · {durationDays} day{durationDays > 1 ? 's' : ''}
                </p>
              </div>

              <Row label={`Base × ${travelers} traveler${travelers > 1 ? 's' : ''} × ${durationDays} days`} value={formatNPR(pricing.subtotal)} />
              {addOns.length > 0 && <Row label={`Add-ons × ${travelers} × ${durationDays}`} value={formatNPR(pricing.addOnTotal)} />}
              <Row label="State Tax (4%)" value={formatNPR(pricing.stateTax)} muted />
              <Row label="GST / Local VAT (12%)" value={formatNPR(pricing.gst)} muted />

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.25rem 0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.75rem', letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase' }}>Total</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#A2D729', letterSpacing: '-0.01em' }}>{formatNPR(pricing.totalCost)}</span>
              </div>

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="btn-primary-white"
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting ? <><Loader size={14} className="animate-spin" /> Confirming…</> : <><ShieldCheck size={14} /> Confirm Booking</>}
              </button>

              {submitError && (
                <p style={{ color: '#E63946', fontSize: '0.8rem', marginTop: 12 }}>{submitError}</p>
              )}

              <p style={{ marginTop: 12, fontSize: '0.7rem', opacity: 0.5, lineHeight: 1.5 }}>
                Confirming saves a pending booking to your Yaatri account. Payment is collected on arrival.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value, muted }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', fontSize: '0.85rem', opacity: muted ? 0.65 : 1 }}>
    <span>{label}</span>
    <span style={{ fontWeight: 700 }}>{value}</span>
  </div>
);

const ConfirmationCard = ({ booking, onDashboard, onAgain }) => {
  const [b, setB] = useState(booking);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const stage = b.status;
  const isAwaitingPayment = stage === 'pending_payment' || stage === 'pending';
  const isInEscrow = stage === 'escrow_held';

  const markAsPaid = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const { data } = await api.patch(`/bookings/${b._id}/confirm-payment`);
      setB(data);
    } catch (err) {
      setPayError(err?.response?.data?.message || 'Could not confirm payment. Try again.');
    } finally {
      setPaying(false);
    }
  };

  const total = fmtPayTotal(b.pricing);

  return (
    <div style={{ background: 'rgba(162,215,41,0.06)', border: '1px solid #A2D729', borderRadius: 12, padding: '2.5rem', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: '50%', background: isAwaitingPayment ? '#F4A261' : '#A2D729', color: '#0D0A02', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={28} />
      </div>

      {isAwaitingPayment && (
        <>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>Booking placed — awaiting payment</h2>
          <p style={{ opacity: 0.75, marginBottom: '0.75rem' }}>
            Your seat for <strong>{b.destination?.name}</strong> is held. Pay <strong style={{ color: '#A2D729' }}>{total}</strong> by bank transfer to the Yaatri account, then click below to notify us.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1.1rem', borderRadius: 6, fontSize: '0.78rem', maxWidth: 460, margin: '0 auto 1rem', textAlign: 'left' }}>
            <p style={{ opacity: 0.6, marginBottom: 4 }}>Bank transfer details</p>
            <p style={{ fontFamily: 'monospace' }}>YAATRI HUB · NIC ASIA BANK · 1234 5678 9012 3456</p>
            <p style={{ fontFamily: 'monospace', opacity: 0.7 }}>Ref: {String(b._id).slice(-8).toUpperCase()}</p>
          </div>
          {payError && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginBottom: 12 }}>{payError}</p>}
          <button
            onClick={markAsPaid}
            disabled={paying}
            className="btn-primary-white"
            style={{ marginBottom: 12, opacity: paying ? 0.6 : 1, cursor: paying ? 'wait' : 'pointer' }}
          >
            {paying ? 'Confirming…' : 'I have paid — confirm'}
          </button>
        </>
      )}

      {isInEscrow && (
        <>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>Payment received · awaiting admin approval</h2>
          <p style={{ opacity: 0.75, marginBottom: '1rem' }}>
            Thanks. We've logged your payment of <strong style={{ color: '#A2D729' }}>{total}</strong> for <strong>{b.destination?.name}</strong>. An admin will verify and approve the booking within a few hours. You'll get an email when it's approved.
          </p>
        </>
      )}

      {!isAwaitingPayment && !isInEscrow && (
        <>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>Booking confirmed</h2>
          <p style={{ opacity: 0.7, marginBottom: '0.5rem' }}>Your trip to {b.destination?.name} is on the books. Total: <strong style={{ color: '#A2D729' }}>{total}</strong></p>
        </>
      )}

      <p style={{ opacity: 0.55, fontSize: '0.8rem', marginBottom: '1.5rem' }}>
        A detailed invoice has been emailed to your registered address. Check your inbox (and spam folder) in a minute or two.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onDashboard} className="btn-primary-white">View in dashboard</button>
        <button onClick={onAgain} style={{ background: 'none', border: '1px solid #A2D729', color: '#A2D729', padding: '0.7rem 1.2rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
          <Sparkles size={14} style={{ display: 'inline', marginRight: 6 }} /> Book another
        </button>
      </div>
    </div>
  );
};

const fmtPayTotal = (pricing) => {
  const v = Number(pricing?.grossTotal || pricing?.totalCost || 0);
  return `NPR ${v.toLocaleString('en-IN')}`;
};

export default BookingPage;
