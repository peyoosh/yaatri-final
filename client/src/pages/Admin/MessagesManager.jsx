import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Mail, AlertCircle, Lightbulb, Smile, Inbox, Loader, UserX, Banknote,
  ChevronDown, ChevronUp, Check, Trash2, Clock, RefreshCw, ArrowUpRight,
} from 'lucide-react';

// Type metadata — both canonical (snake_case) and legacy (human-readable) values
// are recognised so old tickets still render correctly.
const TYPE_META = {
  // Canonical (per marketplace spec)
  bug_report:         { Icon: AlertCircle, color: '#E63946', tint: 'rgba(230,57,70,0.12)', label: 'BUG REPORT' },
  suggestion:         { Icon: Lightbulb,   color: '#A2D729', tint: 'rgba(162,215,41,0.12)', label: 'SUGGESTION' },
  account_issue:      { Icon: UserX,       color: '#F4A261', tint: 'rgba(244,162,97,0.12)', label: 'ACCOUNT' },
  // Legacy human-readable values — kept so historical tickets still display nicely.
  'Report Issue':     { Icon: AlertCircle, color: '#E63946', tint: 'rgba(230,57,70,0.12)', label: 'REPORT' },
  'Suggestion':       { Icon: Lightbulb,   color: '#A2D729', tint: 'rgba(162,215,41,0.12)', label: 'SUGGESTION' },
  'General Feedback': { Icon: Smile,       color: '#059D72', tint: 'rgba(5,157,114,0.12)', label: 'FEEDBACK' },
};

const STATUS_META = {
  // Canonical
  pending:     { label: 'Pending',     color: '#A2D729' },
  open:        { label: 'Open',        color: '#F4A261' },
  escalated:   { label: 'Escalated',   color: '#ff6b6b' },
  closed:      { label: 'Closed',      color: '#059D72' },
  // Legacy
  new:         { label: 'New',         color: '#A2D729' },
  in_progress: { label: 'In Progress', color: '#F4A261' },
  resolved:    { label: 'Resolved',    color: '#059D72' },
  dismissed:   { label: 'Dismissed',   color: '#A6A180' },
};

// Detect a payout-request ticket — used for the dedicated filter chip + row highlight.
const isPayoutRequest = (m) => m?.type === 'account_issue' && typeof m?.subject === 'string' && m.subject.startsWith('[PAYOUT REQUEST]');

const MessagesManager = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all | new | in_progress | resolved | dismissed
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/queries');
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not fetch messages.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateStatus = async (id, status) => {
    setBusyId(id);
    try {
      const { data } = await api.patch(`/queries/${id}/status`, { status });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status: data.status } : m)));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not update status.');
    } finally {
      setBusyId(null);
    }
  };

  // 'payout_requests' is a virtual filter — it segments by ticket SHAPE (account_issue + PAYOUT REQUEST subject)
  // rather than status. Everything else filters on status (canonical or legacy).
  const filtered = (() => {
    if (filter === 'all') return messages;
    if (filter === 'payout_requests') return messages.filter(isPayoutRequest);
    // Treat 'pending' and 'new' as equivalent for the filter chip experience.
    if (filter === 'pending') return messages.filter((m) => m.status === 'pending' || m.status === 'new');
    if (filter === 'open') return messages.filter((m) => m.status === 'open' || m.status === 'in_progress');
    return messages.filter((m) => m.status === filter);
  })();
  const newCount = messages.filter((m) => m.status === 'new' || m.status === 'pending').length;
  const payoutCount = messages.filter(isPayoutRequest).length;

  const escalateTicket = async (id) => {
    setBusyId(id);
    try {
      const { data } = await api.patch(`/queries/${id}/escalate`);
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, ...data } : m)));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not escalate ticket.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <h2 className="page-title">SUPPORT_QUEUE</h2>

      {/* Header strip — counts + filter + refresh */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.45rem 0.9rem',
                background: 'rgba(162,215,41,0.10)',
                border: '1px solid rgba(162,215,41,0.35)',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: 1.5,
                color: '#A2D729',
              }}
            >
              <Inbox size={14} /> {messages.length} total · {newCount} unread
            </span>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: `New (${newCount})` },
                { id: 'open', label: 'Open' },
                { id: 'escalated', label: 'Escalated' },
                { id: 'resolved', label: 'Resolved' },
                { id: 'payout_requests', label: `💸 Payout requests${payoutCount ? ` (${payoutCount})` : ''}`, accent: '#F4A261' },
              ].map((f) => {
                const active = filter === f.id;
                const accent = f.accent || '#A2D729';
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    style={{
                      background: active ? `${accent}26` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? accent : 'rgba(255,255,255,0.08)'}`,
                      color: active ? accent : 'var(--text-muted, #A6A180)',
                      padding: '0.4rem 0.85rem',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#A2D729',
              padding: '0.5rem 0.9rem',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </section>

      {/* Body */}
      <section className="table-section">
        <h3 className="section-title">All Tickets</h3>
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #A6A180)' }}>
              <Loader size={20} className="animate-spin" />
              <p style={{ fontSize: '0.8rem', marginTop: 8 }}>Loading messages…</p>
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#E63946' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>RECEIVED</th>
                  <th>TYPE</th>
                  <th>FROM</th>
                  <th>SUBJECT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const t = TYPE_META[m.type] || TYPE_META.suggestion;
                  const s = STATUS_META[m.status] || STATUS_META.pending;
                  const Icon = t.Icon;
                  const isExpanded = expanded.has(m._id);
                  const isPayout = isPayoutRequest(m);
                  const isAlreadyEscalated = m.isEscalated === true || m.status === 'escalated';
                  return (
                    <React.Fragment key={m._id}>
                      <tr
                        style={{
                          cursor: 'pointer',
                          // Highlight payout-request rows so admins spot them at a glance.
                          background: isPayout ? 'rgba(244,162,97,0.06)' : undefined,
                          borderLeft: isPayout ? '3px solid #F4A261' : (isAlreadyEscalated ? '3px solid #ff6b6b' : undefined),
                        }}
                        onClick={() => toggleExpand(m._id)}
                      >
                        <td style={{ width: 36 }}>
                          {isExpanded
                            ? <ChevronUp size={14} style={{ color: '#A2D729' }} />
                            : <ChevronDown size={14} style={{ opacity: 0.5 }} />}
                        </td>
                        <td style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                          {new Date(m.createdAt).toLocaleDateString()}<br />
                          <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 10px',
                              borderRadius: 999,
                              background: t.tint,
                              color: t.color,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              letterSpacing: 0.5,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Icon size={12} /> {t.label || m.type}
                          </span>
                          {isPayout && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                marginLeft: 6,
                                padding: '2px 6px',
                                borderRadius: 999,
                                background: 'rgba(244,162,97,0.15)',
                                color: '#F4A261',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                letterSpacing: 1,
                              }}
                            >
                              <Banknote size={10} /> PAYOUT
                            </span>
                          )}
                          {isAlreadyEscalated && !isPayout && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                marginLeft: 6,
                                padding: '2px 6px',
                                borderRadius: 999,
                                background: 'rgba(255,107,107,0.15)',
                                color: '#ff6b6b',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                letterSpacing: 1,
                              }}
                            >
                              ESCALATED
                            </span>
                          )}
                        </td>
                        <td className="highlight-text" style={{ fontSize: '0.8rem' }}>{m.email}</td>
                        <td style={{ fontSize: '0.85rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.subject}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'var(--obsidian, #0D0A02)',
                              color: s.color,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                              border: `1px solid ${s.color}`,
                            }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          {m.status === 'new' && (
                            <button
                              disabled={busyId === m._id}
                              onClick={() => updateStatus(m._id, 'in_progress')}
                              className="action-btn"
                              style={{ background: 'rgba(244,162,97,0.15)', color: '#F4A261', border: '1px solid #F4A261', padding: '4px 10px', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer', marginRight: 4 }}
                            >
                              <Clock size={11} style={{ display: 'inline', marginRight: 4 }} /> Take
                            </button>
                          )}
                          {['new', 'in_progress'].includes(m.status) && (
                            <button
                              disabled={busyId === m._id}
                              onClick={() => updateStatus(m._id, 'resolved')}
                              className="action-btn"
                              style={{ background: 'rgba(5,157,114,0.15)', color: '#059D72', border: '1px solid #059D72', padding: '4px 10px', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer', marginRight: 4 }}
                            >
                              <Check size={11} style={{ display: 'inline', marginRight: 4 }} /> Resolve
                            </button>
                          )}
                          {m.status !== 'dismissed' && m.status !== 'resolved' && (
                            <button
                              disabled={busyId === m._id}
                              onClick={() => updateStatus(m._id, 'dismissed')}
                              className="action-btn"
                              style={{ background: 'rgba(166,161,128,0.1)', color: '#A6A180', border: '1px solid rgba(166,161,128,0.5)', padding: '4px 10px', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                              <Trash2 size={11} style={{ display: 'inline', marginRight: 4 }} /> Dismiss
                            </button>
                          )}
                          {/* FORWARD TO ADMIN — support staff hands off tough tickets to admin via the escalate endpoint */}
                          {!isAlreadyEscalated && (
                            <button
                              disabled={busyId === m._id}
                              onClick={() => escalateTicket(m._id)}
                              className="action-btn"
                              title="Forward this ticket to the system administrator"
                              style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '4px 10px', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer', marginRight: 4 }}
                            >
                              <ArrowUpRight size={11} style={{ display: 'inline', marginRight: 4 }} /> Forward
                            </button>
                          )}
                          {m.status === 'resolved' || m.status === 'dismissed' || m.status === 'closed' ? (
                            <button
                              disabled={busyId === m._id}
                              onClick={() => updateStatus(m._id, 'new')}
                              className="action-btn"
                              style={{ background: 'none', color: '#A2D729', border: '1px solid rgba(162,215,41,0.5)', padding: '4px 10px', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                              Reopen
                            </button>
                          ) : null}
                        </td>
                      </tr>

                      {/* Inline expanded detail */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ background: 'rgba(0,0,0,0.25)', padding: '1.5rem 2rem', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)', gap: '2rem' }}>
                              <div>
                                <p style={{ fontSize: '0.65rem', letterSpacing: 2, color: '#A2D729', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                                  Message
                                </p>
                                <p style={{ fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', opacity: 0.85, color: 'var(--himalayan-mist, #F4F2F3)' }}>
                                  {m.message}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: '0.65rem', letterSpacing: 2, color: '#A2D729', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                                  Mail Template
                                </p>
                                <pre
                                  style={{
                                    background: 'var(--obsidian, #0D0A02)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 6,
                                    padding: '1rem',
                                    fontSize: '0.72rem',
                                    fontFamily: 'monospace',
                                    color: 'var(--text-muted, #A6A180)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    maxHeight: 280,
                                    overflowY: 'auto',
                                    margin: 0,
                                  }}
                                >
{m.mailRendered || '(no mail snapshot saved)'}
                                </pre>
                                <button
                                  onClick={() => {
                                    if (m.mailRendered) {
                                      navigator.clipboard?.writeText(m.mailRendered);
                                    }
                                  }}
                                  style={{
                                    marginTop: 8,
                                    background: 'none',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--text-muted, #A6A180)',
                                    fontSize: '0.7rem',
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Copy template
                                </button>
                              </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.7rem', opacity: 0.55, fontFamily: 'monospace' }}>
                              <span>ID: {m._id}</span>
                              <a
                                href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                                style={{ color: '#A2D729', textDecoration: 'none' }}
                              >
                                <Mail size={11} style={{ display: 'inline', marginRight: 4 }} /> Reply via email
                              </a>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
};

const EmptyState = ({ filter }) => (
  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted, #A6A180)' }}>
    <Inbox size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
    <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>
      {filter === 'all' ? 'No support tickets yet' : `No ${filter.replace('_', ' ')} tickets`}
    </p>
    <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
      Tickets land here as soon as users submit the form at <code>/support</code>.
    </p>
  </div>
);

export default MessagesManager;
