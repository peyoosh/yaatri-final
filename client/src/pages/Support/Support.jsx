import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Send, Check, Tag, MessageSquare, AlertCircle, Lightbulb, Smile, ArrowLeft, Loader } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const QUERY_TYPES = [
  { value: 'Report Issue',     label: 'Report Issue',     Icon: AlertCircle, color: '#ef4444' },
  { value: 'Suggestion',       label: 'Suggestion',       Icon: Lightbulb,   color: '#2563EB' },
  { value: 'General Feedback', label: 'General Feedback', Icon: Smile,       color: '#10B981' },
];

export default function Support() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({ email: user?.email || '', subject: '', type: 'General Feedback', message: '' });
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
    <div className="w-full min-h-screen bg-slate-50 pt-28 pb-20 px-6 lg:px-12 xl:px-20">
      <div className="w-full max-w-3xl">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-brand-blue hover:underline cursor-pointer mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-2">Support</p>
          <h1 className="text-3xl font-black tracking-tight text-brand-slate flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-brand-blue" />
            </div>
            How can we help?
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-3 max-w-lg leading-relaxed">
            File a ticket — bug, idea, or just feedback. Every ticket lands on the admin desk with the original message attached.
          </p>
        </div>

        {ticketId ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-brand-slate mb-2">
              Ticket #{String(ticketId).slice(-6).toUpperCase()} received
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              We'll reply to <strong className="text-brand-slate">{form.email}</strong> within one business day.
            </p>
            <button onClick={reset}
              className="px-6 py-3 bg-brand-blue text-white font-bold text-xs rounded-xl hover:bg-brand-blue/90 cursor-pointer transition-colors"
            >
              Submit another query
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col gap-5">

            {/* Email */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Your Email *
              </label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Subject *
              </label>
              <input type="text" required maxLength={200} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="What's the gist?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Query Type</label>
              <div className="grid grid-cols-3 gap-2">
                {QUERY_TYPES.map(({ value, label, Icon, color }) => {
                  const active = form.type === value;
                  return (
                    <button key={value} type="button" onClick={() => setForm({ ...form, type: value })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer border transition-all ${active ? 'text-white border-transparent' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                      style={active ? { background: color, borderColor: color } : {}}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Message *
              </label>
              <textarea required rows={6} minLength={5} maxLength={4000} value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Walk us through it…"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all resize-none"
              />
              <p className="text-[10px] text-gray-400 text-right mt-1">{form.message.length} / 4000</p>
            </div>

            {submitError && <p className="text-sm text-red-500 font-medium">{submitError}</p>}

            <button type="submit" disabled={submitting}
              className="self-start px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-brand-blue/15 transition-all"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Sending…' : 'Send query'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
