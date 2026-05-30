import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { Check, X, RefreshCw, ChevronDown, ShieldCheck, Clock3, CreditCard } from 'lucide-react';

// Status palette — covers both canonical lifecycle and legacy aliases.
const STATUS_COLORS = {
  pending_payment: { bg: 'rgba(255,180,80,0.15)',  fg: '#FFB450', border: 'rgba(255,180,80,0.45)' },
  escrow_held:     { bg: 'rgba(244,162,97,0.15)',  fg: '#F4A261', border: 'rgba(244,162,97,0.45)' },
  approved:        { bg: 'rgba(162,215,41,0.15)',  fg: '#A2D729', border: 'rgba(162,215,41,0.5)' },
  completed:       { bg: 'rgba(5,157,114,0.18)',   fg: '#059D72', border: 'rgba(5,157,114,0.45)' },
  cancelled:       { bg: 'rgba(255,107,107,0.12)', fg: '#ff6b6b', border: 'rgba(255,107,107,0.45)' },
  // Legacy aliases
  pending:         { bg: 'rgba(255,180,80,0.15)',  fg: '#FFB450', border: 'rgba(255,180,80,0.45)' },
  confirmed:       { bg: 'rgba(162,215,41,0.15)',  fg: '#A2D729', border: 'rgba(162,215,41,0.5)' },
};

// Lifecycle stage helpers — describe where a booking is in the funnel.
const isAwaitingPayment = (s) => s === 'pending_payment' || s === 'pending';
const isInEscrow        = (s) => s === 'escrow_held';
const isActive          = (s) => s === 'approved' || s === 'confirmed';

const fmtNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const BookingsManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | confirmed | completed | cancelled
  const [actingId, setActingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bookings', err);
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Failed to load bookings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // Live-ish sync: poll every 60 s so newly-placed bookings and auto-completed trips appear without refresh.
    const id = setInterval(fetchBookings, 60_000);
    return () => clearInterval(id);
  }, []);

  const changeStatus = async (booking, nextStatus) => {
    const verb = nextStatus === 'confirmed' ? 'verify (confirm)' : nextStatus === 'cancelled' ? 'cancel' : `mark ${nextStatus}`;
    if (!window.confirm(`${verb.toUpperCase()} booking for ${booking.destination?.name || 'destination'} (@${booking.user?.username || 'user'})?`)) return;
    setActingId(booking._id);
    try {
      const { data } = await api.patch(`/bookings/${booking._id}/status`, { status: nextStatus });
      setBookings((prev) => prev.map((b) => (b._id === booking._id ? { ...b, ...data, destination: b.destination, user: b.user } : b)));
      setFeedback({ type: 'success', text: `Booking ${String(booking._id).slice(-6).toUpperCase()} → ${nextStatus.toUpperCase()}` });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Status update failed.' });
    } finally {
      setActingId(null);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings;
    if (filter === 'pending_payment') return bookings.filter((b) => isAwaitingPayment(b.status));
    if (filter === 'escrow_held') return bookings.filter((b) => isInEscrow(b.status));
    if (filter === 'approved') return bookings.filter((b) => isActive(b.status));
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const counts = useMemo(() => {
    const c = { all: bookings.length, pending_payment: 0, escrow_held: 0, approved: 0, completed: 0, cancelled: 0 };
    for (const b of bookings) {
      if (isAwaitingPayment(b.status)) c.pending_payment++;
      else if (isInEscrow(b.status)) c.escrow_held++;
      else if (isActive(b.status)) c.approved++;
      else if (b.status === 'completed') c.completed++;
      else if (b.status === 'cancelled') c.cancelled++;
    }
    return c;
  }, [bookings]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>BOOKINGS_MANAGER</h2>
        <button
          onClick={fetchBookings}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--hill-green, #059D72)',
            padding: '0.45rem 0.85rem',
            borderRadius: 999,
            cursor: loading ? 'wait' : 'pointer',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: 1.5,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> REFRESH
        </button>
      </div>

      {/* FILTER CHIPS — by lifecycle stage */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '1.25rem 0' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'pending_payment', label: 'Awaiting payment' },
          { id: 'escrow_held', label: 'In escrow' },
          { id: 'approved', label: 'Approved' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((s) => {
          const active = filter === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              style={{
                background: active ? '#A2D729' : 'rgba(255,255,255,0.04)',
                color: active ? '#0D0A02' : '#A6A180',
                border: `1px solid ${active ? '#A2D729' : 'rgba(255,255,255,0.08)'}`,
                padding: '0.4rem 0.85rem',
                borderRadius: 999,
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {s.label} · {counts[s.id] ?? 0}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 6,
          marginBottom: '1rem',
          background: feedback.type === 'success' ? 'rgba(162,215,41,0.12)' : 'rgba(255,107,107,0.12)',
          color: feedback.type === 'success' ? '#A2D729' : '#ff6b6b',
          border: `1px solid ${feedback.type === 'success' ? '#A2D729' : '#ff6b6b'}`,
          fontSize: '0.8rem',
        }}>
          [{feedback.type.toUpperCase()}] {feedback.text}
        </div>
      )}

      {/* TABLE */}
      <section className="table-section">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>REF</th>
                <th>USER</th>
                <th>DESTINATION</th>
                <th>WINDOW</th>
                <th>TOTAL</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading bookings…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {filter === 'all' ? 'No bookings in the system yet.' : `No bookings with status "${filter}".`}
                </td></tr>
              ) : (
                filtered.map((b) => {
                  const colors = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
                  const isExpanded = expandedId === b._id;
                  const acting = actingId === b._id;
                  return (
                    <React.Fragment key={b._id}>
                      <tr>
                        <td className="highlight-text" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {String(b._id).slice(-6).toUpperCase()}
                        </td>
                        <td>@{b.user?.username || '—'}</td>
                        <td>{b.destination?.name || '—'} <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>· {b.destination?.region}</span></td>
                        <td style={{ fontSize: '0.78rem' }}>
                          {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                          <br />
                          <span style={{ opacity: 0.55, fontSize: '0.7rem' }}>{b.travelers}p × {b.durationDays}d</span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#A2D729' }}>{fmtNPR(b.pricing?.totalCost)}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: '0.65rem',
                            letterSpacing: 1.5,
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            background: colors.bg,
                            color: colors.fg,
                            border: `1px solid ${colors.border}`,
                          }}>{b.status}</span>
                        </td>
                        <td className="actions-cell" style={{ whiteSpace: 'nowrap' }}>
                          {/* Awaiting payment → admin can chase, or directly mark paid on traveller's behalf */}
                          {isAwaitingPayment(b.status) && (
                            <button
                              onClick={() => changeStatus(b, 'escrow_held')}
                              disabled={acting}
                              className="action-btn"
                              title="Mark payment received — moves the booking into escrow for final approval"
                              style={{
                                background: '#FFB450', color: '#0D0A02', border: 'none',
                                padding: '0.3rem 0.7rem', borderRadius: 4, marginRight: 6,
                                fontWeight: 800, fontSize: '0.7rem', cursor: acting ? 'wait' : 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <CreditCard size={11} /> MARK PAID
                            </button>
                          )}
                          {/* In escrow → admin approves */}
                          {isInEscrow(b.status) && (
                            <button
                              onClick={() => changeStatus(b, 'approved')}
                              disabled={acting}
                              className="action-btn"
                              title="Approve — vendor sees the booking as confirmed and starts preparing"
                              style={{
                                background: '#A2D729', color: '#0D0A02', border: 'none',
                                padding: '0.3rem 0.7rem', borderRadius: 4, marginRight: 6,
                                fontWeight: 800, fontSize: '0.7rem', cursor: acting ? 'wait' : 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <ShieldCheck size={11} /> APPROVE
                            </button>
                          )}
                          {/* Any non-terminal state can be cancelled */}
                          {!['completed', 'cancelled'].includes(b.status) && (
                            <button
                              onClick={() => changeStatus(b, 'cancelled')}
                              disabled={acting}
                              className="action-btn danger"
                              style={{
                                background: 'rgba(255,107,107,0.08)', color: '#ff6b6b',
                                border: '1px solid rgba(255,107,107,0.45)',
                                padding: '0.3rem 0.7rem', borderRadius: 4, marginRight: 6,
                                fontWeight: 700, fontSize: '0.7rem', cursor: acting ? 'wait' : 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <X size={11} /> CANCEL
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : b._id)}
                            className="action-btn"
                            style={{
                              background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                              color: '#A6A180', padding: '0.3rem 0.7rem', borderRadius: 4,
                              fontSize: '0.7rem', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <ChevronDown size={11} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            DETAILS
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem' }}>
                              <div>
                                <p style={{ fontSize: '0.65rem', opacity: 0.55, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Base rate</p>
                                <p>{fmtNPR(b.pricing?.baseRate)} <span style={{ opacity: 0.5 }}>/ traveller / day</span></p>
                              </div>
                              <div>
                                <p style={{ fontSize: '0.65rem', opacity: 0.55, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Add-ons</p>
                                <p>{b.pricing?.addOns?.length ? b.pricing.addOns.join(', ') : '—'}</p>
                                <p style={{ opacity: 0.6, fontSize: '0.75rem' }}>{fmtNPR(b.pricing?.addOnTotal)}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: '0.65rem', opacity: 0.55, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Assigned guide</p>
                                {b.assignedGuide ? (
                                  <>
                                    <p style={{ fontWeight: 700 }}>@{b.assignedGuide.username}</p>
                                    <p style={{ opacity: 0.6, fontSize: '0.7rem' }}>{b.assignedGuide.profileData?.experience || 'Local guide'}</p>
                                  </>
                                ) : b.pricing?.addOns?.includes('guide') ? (
                                  <p style={{ opacity: 0.6, fontStyle: 'italic' }}>Guide add-on selected — to be assigned</p>
                                ) : (
                                  <p style={{ opacity: 0.4 }}>—</p>
                                )}
                              </div>
                              <div>
                                <p style={{ fontSize: '0.65rem', opacity: 0.55, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Tax breakdown</p>
                                <p style={{ opacity: 0.7 }}>State 4%: {fmtNPR(b.pricing?.stateTax)}</p>
                                <p style={{ opacity: 0.7 }}>GST 12%: {fmtNPR(b.pricing?.gst)}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: '0.65rem', opacity: 0.55, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>User contact</p>
                                <p>{b.user?.email || '—'}</p>
                                <p style={{ opacity: 0.55, fontSize: '0.7rem' }}>Created {fmtDate(b.createdAt)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default BookingsManager;
