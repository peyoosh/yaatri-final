import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Send, Check, Tag, MessageSquare, AlertCircle, Lightbulb, Smile, ArrowLeft } from 'lucide-react';

const QUERY_TYPES = [
  { value: 'Report Issue',    label: 'Report Issue',     Icon: AlertCircle, color: '#E63946' },
  { value: 'Suggestion',      label: 'Suggestion',       Icon: Lightbulb,   color: '#A2D729' },
  { value: 'General Feedback', label: 'General Feedback', Icon: Smile,       color: '#059D72' },
];

const Support = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: user?.email || '',
    subject: '',
    type: 'General Feedback',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [ticketId, setTicketId] = useState(null);

  useEffect(() => {
    if (user?.email && !form.email) setForm(f => ({ ...f, email: user.email }));
  }, [user?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await api.post('/queries', form);
      setTicketId(data.ticketId);
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Could not submit your query.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setTicketId(null);
    setForm({ email: user?.email || '', subject: '', type: 'General Feedback', message: '' });
    setSubmitError(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian, #0D0A02)', color: 'white' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '3rem 6%' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#A2D729', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <header style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: 3, fontWeight: 700, color: '#A2D729', textTransform: 'uppercase', marginBottom: 8 }}>
            Support
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Mail size={28} style={{ color: '#A2D729' }} /> How can we help?
          </h1>
          <p style={{ opacity: 0.65, maxWidth: 620, lineHeight: 1.6 }}>
            File a ticket — bug, idea, or just feedback. Every ticket lands on the admin desk with the original message attached.
          </p>
        </header>

        {ticketId ? (
          <div style={{ background: 'rgba(162,215,41,0.06)', border: '1px solid #A2D729', borderRadius: 12, padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: '50%', background: '#A2D729', color: '#0D0A02', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Ticket #{String(ticketId).slice(-6).toUpperCase()} received</h2>
            <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>We'll reply to <strong>{form.email}</strong> within one business day.</p>
            <button onClick={reset} className="btn-primary-white">Submit another query</button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '2rem',
              display: 'grid',
              gap: '1.25rem',
            }}
          >
            {/* Email */}
            <Field label="Your Email" icon={Mail}>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </Field>

            {/* Subject */}
            <Field label="Subject" icon={Tag}>
              <input
                type="text"
                required
                maxLength={200}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="What's the gist?"
                style={inputStyle}
              />
            </Field>

            {/* Query Type */}
            <div>
              <label style={labelStyle}>Query Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                {QUERY_TYPES.map((q) => {
                  const active = form.type === q.value;
                  const Icon = q.Icon;
                  return (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: q.value })}
                      style={{
                        background: active ? 'rgba(162,215,41,0.12)' : 'rgba(0,0,0,0.25)',
                        border: `1px solid ${active ? q.color : 'rgba(255,255,255,0.08)'}`,
                        color: active ? q.color : '#A6A180',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Icon size={14} /> {q.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <Field label="Message" icon={MessageSquare}>
              <textarea
                required
                rows={6}
                minLength={5}
                maxLength={4000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Walk us through it…"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                {form.message.length} / 4000
              </p>
            </Field>

            {submitError && (
              <p style={{ color: '#E63946', fontSize: '0.85rem' }}>{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-white"
              style={{ width: 'fit-content', padding: '0.85rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: submitting ? 0.6 : 1 }}
            >
              <Send size={14} /> {submitting ? 'Sending…' : 'Send query'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label style={labelStyle}>
      {Icon && <Icon size={12} style={{ display: 'inline', marginRight: 6 }} />} {label}
    </label>
    {children}
  </div>
);

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: 2,
  color: '#A6A180',
  marginBottom: 6,
  fontWeight: 700,
};

const inputStyle = {
  width: '100%',
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
  padding: '0.75rem 1rem',
  borderRadius: 6,
  fontSize: '0.9rem',
  outline: 'none',
};

export default Support;
