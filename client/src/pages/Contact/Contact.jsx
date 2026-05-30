import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, Clock, Globe2, AlertTriangle, Lightbulb, UserX, Loader } from 'lucide-react';
import api from '../../api/axios';

// Maps spec'd type tokens → label / icon / colour. Drives the dropdown options
// and the visual treatment of the active choice. These tokens land directly in
// the Query.type field on the server and feed the /admin/messages segmentation.
const TYPE_OPTIONS = [
  { id: 'bug_report',    label: 'Report a bug',         Icon: AlertTriangle, accent: '#ff6b6b' },
  { id: 'suggestion',    label: 'Suggestion',           Icon: Lightbulb,     accent: '#A2D729' },
  { id: 'account_issue', label: 'Something wrong with my account', Icon: UserX,         accent: '#F4A261' },
];

const inputStyle = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  outline: 'none',
  fontSize: '0.9rem',
};

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    type: 'suggestion', // default — the most common case
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState(null); // { kind: 'ok'|'err', text: string, ticketId?: string }
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setStatus(null);
    setSubmitting(true);
    try {
      // POST /api/queries — the support pipeline. Auto-routed to the support team
      // (assignedTo: 'support') unless escalated by an admin or support staff.
      const subject = form.subject?.trim() || `[${form.type}] from ${form.name || form.email}`;
      const { data } = await api.post('/queries', {
        email: form.email,
        subject,
        type: form.type,
        message: form.message,
      });
      setStatus({ kind: 'ok', text: 'Message received — our support team will get back to you within one business day.', ticketId: data?.ticketId });
      setForm({ name: '', email: '', type: 'suggestion', subject: '', message: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not send. Please try again.';
      setStatus({ kind: 'err', text: msg });
    } finally {
      setSubmitting(false);
      // Auto-dismiss success notice after 8s.
      setTimeout(() => setStatus(null), 8000);
    }
  };

  return (
    <div className="contact-page" style={{ background: 'var(--obsidian, #0D0A02)', minHeight: '100vh' }}>
      {/* HERO / ABOUT */}
      <section style={{ padding: '6rem 8% 4rem', maxWidth: 1400, margin: '0 auto' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--hill-green, #059D72)', marginBottom: '1rem' }}>
          About Yaatri
        </p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white" style={{ marginBottom: '1.25rem', lineHeight: 1.05, maxWidth: '780px' }}>
          One who travels.
        </h1>
        <p className="text-sm md:text-base text-white/75 leading-relaxed" style={{ maxWidth: '720px', marginBottom: '1.5rem' }}>
          The word <em>Yaatri</em> originates from Sanskrit, deriving from <em>yātrā</em> (journey) and <em>yātrin</em> (traveler).
          We picked the name because the platform isn't really about destinations — it's about the people who keep finding new ones.
        </p>
        <p className="text-sm md:text-base text-white/75 leading-relaxed" style={{ maxWidth: '720px' }}>
          Yaatri is a Nepal-first travel network: a single place where independent guides, family-run lodges, and the travelers
          who want to find them can meet without the noise of big-platform intermediation. Built in Lalitpur, kept honest by the people who actually walk the trails.
        </p>
      </section>

      {/* CONTACT GRID */}
      <section style={{ padding: '2rem 8% 4rem', maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gap: '2rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {[
            {
              Icon: MapPin,
              label: 'Visit',
              lines: ['Yaatri Core Systems', 'Lalitpur, Bagmati', 'Nepal — 44700'],
            },
            {
              Icon: Phone,
              label: 'Call',
              lines: ['+977 1-400-0000', 'Mon – Sat · 09:00 – 18:00 NPT'],
            },
            {
              Icon: Mail,
              label: 'Write',
              lines: ['support@yaatri.np', 'partners@yaatri.np'],
            },
            {
              Icon: Clock,
              label: 'On-trail support',
              lines: ['24 / 7 satellite check-in', 'Active for booked trips'],
            },
          ].map(({ Icon, label, lines }) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '1.5rem',
              }}
            >
              <Icon size={20} style={{ color: 'var(--hill-green, #059D72)', marginBottom: '1rem' }} />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/80" style={{ marginBottom: '0.75rem' }}>{label}</h3>
              {lines.map((l, i) => (
                <p key={i} className="text-sm text-white/65" style={{ lineHeight: 1.6 }}>{l}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* TWO-COLUMN: FORM + COMMITMENT */}
      <section style={{ padding: '2rem 8% 6rem', maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
            gap: '3rem',
          }}
          className="contact-split"
        >
          {/* FORM */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '2rem',
            }}
          >
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white" style={{ marginBottom: '0.5rem' }}>Send us a note</h2>
            <p className="text-sm text-white/65" style={{ marginBottom: '1.5rem' }}>
              Pick the kind of message — our support team handles the queue and forwards admin-only issues automatically.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* TYPE PICKER — drives Query.type on the backend. */}
              <div>
                <label className="text-xs text-white/55" style={{ display: 'block', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
                  Message type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {TYPE_OPTIONS.map(({ id, label, Icon, accent }) => {
                    const active = form.type === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setForm({ ...form, type: id })}
                        style={{
                          background: active ? `${accent}1f` : 'rgba(0,0,0,0.25)',
                          border: `1px solid ${active ? accent : 'rgba(255,255,255,0.08)'}`,
                          color: active ? accent : 'rgba(255,255,255,0.7)',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          textAlign: 'left',
                        }}
                      >
                        <Icon size={14} /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                type="text"
                placeholder="Your name (optional)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Subject (one short line)"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                maxLength={200}
                style={inputStyle}
              />
              <textarea
                placeholder="What's on your mind? (min 5 characters)"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                minLength={5}
                maxLength={4000}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary-white"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'wait' : 'pointer' }}
              >
                {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? 'Sending…' : 'Send message'}
              </button>
              {status && (
                <p className="text-sm" style={{ color: status.kind === 'ok' ? 'var(--hill-green, #059D72)' : '#ff6b6b', lineHeight: 1.5 }}>
                  {status.text}
                  {status.ticketId && <span style={{ opacity: 0.6, fontFamily: 'monospace', display: 'block', fontSize: '0.7rem' }}>Ref: {String(status.ticketId).slice(-8).toUpperCase()}</span>}
                </p>
              )}
            </form>
          </div>

          {/* COMMITMENT */}
          <div>
            <Globe2 size={28} style={{ color: 'var(--hill-green, #059D72)', marginBottom: '1.25rem' }} />
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white" style={{ marginBottom: '1rem', lineHeight: 1.1 }}>
              Built around real people, not listings
            </h2>
            <p className="text-sm md:text-base text-white/70 leading-relaxed" style={{ marginBottom: '1rem' }}>
              Every guide on Yaatri is verified in person. Every hotel is on the platform because a traveler vouched for it.
              We don't sell ad placements, and the search ranking can't be paid for.
            </p>
            <p className="text-sm md:text-base text-white/70 leading-relaxed" style={{ marginBottom: '1.5rem' }}>
              If something on the platform doesn't match reality, tell us — we keep a public log of corrections and act on them within the same week.
            </p>

            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '1.25rem',
                fontSize: '0.8rem',
                opacity: 0.55,
                lineHeight: 1.7,
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.4rem', letterSpacing: '2px', fontSize: '0.7rem' }}>
                LICENSE
              </strong>
              Yaatri's interface and aggregated terrain data are released under the Yaatri Open Intel Protocol.
              Commercial redistribution of individual destination records is restricted. © {new Date().getFullYear()} Yaatri Hub.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
