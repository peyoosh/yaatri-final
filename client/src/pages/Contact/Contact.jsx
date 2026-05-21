import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, Clock, Globe2 } from 'lucide-react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: '', email: '', message: '' });
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
              We answer every message within one business day.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
              />
              <input
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '0.9rem',
                }}
              />
              <textarea
                placeholder="What's on your mind?"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  outline: 'none',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                className="btn-primary-white"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}
              >
                <Send size={14} /> Send message
              </button>
              {submitted && (
                <p className="text-sm" style={{ color: 'var(--hill-green, #059D72)' }}>
                  Message received — we'll get back to you shortly.
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
