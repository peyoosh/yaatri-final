import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, Clock, Globe2, AlertTriangle, Lightbulb, UserX, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';

const TYPE_OPTIONS = [
  { id: 'bug_report',    label: 'Report a bug',              Icon: AlertTriangle, accent: '#ef4444' },
  { id: 'suggestion',    label: 'Suggestion',                Icon: Lightbulb,     accent: '#2563EB' },
  { id: 'account_issue', label: 'Account issue',             Icon: UserX,         accent: '#F59E0B' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', type: 'suggestion', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setStatus(null);
    setSubmitting(true);
    try {
      const subject = form.subject?.trim() || `[${form.type}] from ${form.name || form.email}`;
      const { data } = await api.post('/queries', { email: form.email, subject, type: form.type, message: form.message });
      setStatus({ kind: 'ok', text: 'Message received — our support team will get back to you within one business day.', ticketId: data?.ticketId });
      setForm({ name: '', email: '', type: 'suggestion', subject: '', message: '' });
    } catch (err) {
      setStatus({ kind: 'err', text: err?.response?.data?.message || err?.message || 'Could not send. Please try again.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatus(null), 8000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pt-20">

      {/* HERO */}
      <section className="text-white px-6 py-20" style={{ backgroundColor: '#0f172a' }}>
        <div className="max-w-7xl mx-auto">
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest block mb-4">About Yaatri</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-5 leading-tight max-w-3xl">
            One who travels.
          </h1>
          <p className="text-base text-slate-300 leading-relaxed max-w-2xl mb-4">
            The word <em>Yaatri</em> originates from Sanskrit, deriving from <em>yātrā</em> (journey) and <em>yātrin</em> (traveler).
            We picked the name because the platform isn't really about destinations — it's about the people who keep finding new ones.
          </p>
          <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
            Yaatri is a Nepal-first travel network: a single place where independent guides, family-run lodges, and the travelers
            who want to find them can meet without the noise of big-platform intermediation. Built in Lalitpur, kept honest by the people who actually walk the trails.
          </p>
        </div>
      </section>

      {/* CONTACT INFO CARDS */}
      <section className="py-16 px-6 w-full">
        <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { Icon: MapPin,  label: 'Visit',            lines: ['Yaatri Core Systems', 'Lalitpur, Bagmati', 'Nepal — 44700'] },
            { Icon: Phone,   label: 'Call',             lines: ['+977 1-400-0000', 'Mon – Sat · 09:00 – 18:00 NPT'] },
            { Icon: Mail,    label: 'Write',            lines: ['support@yaatri.np', 'partners@yaatri.np'] },
            { Icon: Clock,   label: 'On-trail support', lines: ['24 / 7 satellite check-in', 'Active for booked trips'] },
          ].map(({ Icon, label, lines }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-blue" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</h3>
              {lines.map((l, i) => <p key={i} className="text-sm text-slate-700 font-medium leading-relaxed">{l}</p>)}
            </div>
          ))}
        </div>

        {/* FORM + COMMITMENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h2 className="text-2xl font-black tracking-tight text-brand-slate mb-1">Send us a note</h2>
            <p className="text-sm text-gray-500 mb-6">Our support team handles the queue and auto-routes admin-only issues.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Type picker */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Message type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map(({ id, label, Icon, accent }) => {
                    const active = form.type === id;
                    return (
                      <button key={id} type="button" onClick={() => setForm({ ...form, type: id })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${active ? 'text-white border-transparent' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                        style={active ? { background: accent, borderColor: accent } : {}}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {[
                { placeholder: 'Your name (optional)', value: form.name, onChange: v => setForm({ ...form, name: v }), type: 'text', required: false },
                { placeholder: 'Your email *', value: form.email, onChange: v => setForm({ ...form, email: v }), type: 'email', required: true },
                { placeholder: 'Subject (one short line)', value: form.subject, onChange: v => setForm({ ...form, subject: v }), type: 'text', required: false },
              ].map((f, i) => (
                <input key={i} type={f.type} required={f.required} placeholder={f.placeholder} value={f.value}
                  onChange={e => f.onChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
                />
              ))}

              <textarea placeholder="What's on your mind? (min 5 characters)" rows={5} value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })} required minLength={5} maxLength={4000}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all resize-none"
              />

              <button type="submit" disabled={submitting}
                className="self-start px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-blue/15 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Sending…' : 'Send message'}
              </button>

              {status && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`text-sm font-medium ${status.kind === 'ok' ? 'text-brand-green' : 'text-red-500'}`}
                >
                  {status.text}
                  {status.ticketId && <span className="font-mono text-xs opacity-60 block mt-0.5">Ref: {String(status.ticketId).slice(-8).toUpperCase()}</span>}
                </motion.p>
              )}
            </form>
          </div>

          {/* Commitment */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-5">
                <Globe2 className="w-6 h-6 text-brand-blue" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-brand-slate mb-4 leading-tight">
                Built around real people, not listings
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Every guide on Yaatri is verified in person. Every hotel is on the platform because a traveler vouched for it.
                We don't sell ad placements, and the search ranking can't be paid for.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                If something on the platform doesn't match reality, tell us — we keep a public log of corrections and act on them within the same week.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">LICENSE</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Yaatri's interface and aggregated terrain data are released under the Yaatri Open Intel Protocol.
                Commercial redistribution of individual destination records is restricted. © {new Date().getFullYear()} Yaatri Hub.
              </p>
            </div>
          </div>

        </div>
        </div>
      </section>
    </div>
  );
}
