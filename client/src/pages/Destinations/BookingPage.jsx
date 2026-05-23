import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import {
  Users, Calendar, MapPin, Loader, Check, X, CreditCard, ChevronLeft, ShieldCheck, Sparkles,
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    let cancelled = false;
    api.get(`/destinations/${id}`)
      .then(({ data }) => { if (!cancelled) setDestination(data); })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load destination', err);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, user, navigate]);

  // Pricing matrix — recomputed on every change. Same formulae the server enforces.
  const pricing = useMemo(() => {
    const baseRate = DEFAULT_BASE_RATE;
    const t = Math.max(1, Number(travelers) || 1);
    const d = Math.max(1, Number(durationDays) || 1);
    const subtotal = baseRate * t * d;
    const addOnPerPersonPerDay = addOns.reduce((sum, id) => {
      const a = ADDONS.find(x => x.id === id);
      return sum + (a ? a.rate : 0);
    }, 0);
    const addOnTotal = addOnPerPersonPerDay * t * d;
    const beforeTax = subtotal + addOnTotal;
    const stateTax = Math.round(beforeTax * STATE_TAX_RATE);
    const gst = Math.round(beforeTax * GST_RATE);
    const totalCost = beforeTax + stateTax + gst;
    return { baseRate, subtotal, addOnTotal, beforeTax, stateTax, gst, totalCost };
  }, [travelers, durationDays, addOns]);

  const toggleAddon = (id) => {
    setAddOns((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const today = new Date();
      const end = new Date(today);
      end.setDate(end.getDate() + Number(durationDays));
      const { data } = await api.post('/bookings', {
        destination: id,
        travelers: Number(travelers),
        durationDays: Number(durationDays),
        addOns,
        baseRate: DEFAULT_BASE_RATE,
        startDate: today.toISOString(),
        endDate: end.toISOString(),
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
            </div>

            {/* RIGHT: live total */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '2rem', height: 'fit-content', position: 'sticky', top: 100 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#A2D729', marginBottom: '1.5rem' }}>
                <CreditCard size={14} style={{ display: 'inline', marginRight: 6 }} /> Cost Breakdown
              </h2>

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

const ConfirmationCard = ({ booking, onDashboard, onAgain }) => (
  <div style={{ background: 'rgba(162,215,41,0.06)', border: '1px solid #A2D729', borderRadius: 12, padding: '2.5rem', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
    <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: '50%', background: '#A2D729', color: '#0D0A02', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Check size={28} />
    </div>
    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 8 }}>Booking confirmed</h2>
    <p style={{ opacity: 0.7, marginBottom: '0.5rem' }}>Your trip to {booking.destination?.name} is on the books. Total: <strong style={{ color: '#A2D729' }}>NPR {Number(booking.pricing?.totalCost || 0).toLocaleString('en-IN')}</strong></p>
    <p style={{ opacity: 0.55, fontSize: '0.8rem', marginBottom: '1.5rem' }}>A detailed invoice has been emailed to your registered address. Check your inbox (and spam folder) in a minute or two.</p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <button onClick={onDashboard} className="btn-primary-white">View in dashboard</button>
      <button onClick={onAgain} style={{ background: 'none', border: '1px solid #A2D729', color: '#A2D729', padding: '0.7rem 1.2rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
        <Sparkles size={14} style={{ display: 'inline', marginRight: 6 }} /> Book another
      </button>
    </div>
  </div>
);

export default BookingPage;
