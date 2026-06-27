import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Send, MapPin, Compass, ArrowUpRight, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const STARTER = {
  id: 1,
  type: 'bot',
  text: "Namaste! I'm your Yaatri AI guide. Ask me anything about trekking in Nepal — seasons, permits, what to pack, costs — or tell me what kind of trip you're after and I'll point you somewhere good.",
  suggestedDestinations: [],
};

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState(location.state?.messages || [STARTER]);
  const [userInput, setUserInput] = useState(location.state?.userInput || '');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const sendMessage = async (e) => {
    e?.preventDefault?.();
    if (!userInput.trim() || isLoading) return;

    const userMsg = { id: Date.now(), type: 'user', text: userInput, suggestedDestinations: [] };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].slice(-12).map(m => ({
        role: m.type === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text || '').slice(0, 2000) }],
      }));
      const priorHistory = history.slice(0, -1);

      const { data } = await api.post('/ai/chat', { query: userMsg.text, history: priorHistory }, { timeout: 45_000 });
      const { reply, redirectTo, suggestedDestinations } = data || {};

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: reply || "Ask me about treks, seasons, or which destination fits your style.",
        suggestedDestinations: suggestedDestinations || [],
        redirectTo: redirectTo || null,
      }]);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.reply;
      const isNetwork = !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error');

      if (status === 429 && serverMsg) {
        setMessages(prev => [...prev, { id: Date.now() + 2, type: 'bot', text: serverMsg, suggestedDestinations: [] }]);
      } else if (isNetwork) {
        const waitId = Date.now() + 2;
        setMessages(prev => [...prev, { id: waitId, type: 'bot', text: "The guide is waking up — retrying in 15 seconds…", suggestedDestinations: [] }]);
        await new Promise(r => setTimeout(r, 15000));
        try {
          const retryHistory = [...messages, userMsg].slice(-6).map(m => ({ role: m.type === 'user' ? 'user' : 'model', parts: [{ text: String(m.text || '').slice(0, 800) }] })).slice(0, -1);
          const { data } = await api.post('/ai/chat', { query: userMsg.text, history: retryHistory }, { timeout: 60_000 });
          const { reply, redirectTo, suggestedDestinations } = data || {};
          setMessages(prev => [...prev.filter(m => m.id !== waitId), { id: Date.now() + 3, type: 'bot', text: reply, suggestedDestinations: suggestedDestinations || [], redirectTo: redirectTo || null }]);
        } catch {
          setMessages(prev => prev.map(m => m.id === waitId ? { ...m, text: "Still waking up — please try again." } : m));
        }
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          type: 'bot',
          text: err.code === 'ECONNABORTED' ? "That took too long. Try a shorter question." : "Something went wrong. Please try again.",
          suggestedDestinations: [],
        }]);
      }
    } finally { setIsLoading(false); }
  };

  const prompts = [
    '🏔️ What gear do I need for Everest Base Camp?',
    '🎒 Tell me about Upper Mustang difficulty.',
    '🌧️ When is the monsoon season in Nepal?',
    '💰 How much does an EBC trek cost?',
  ];

  const ROUTE_LABELS = {
    '/destinations': 'Browse Destinations',
    '/blog': 'Read Blog',
    '/support': 'Get Support',
    '/login': 'Sign In',
    '/dashboard': 'My Dashboard',
    '/contact': 'Contact Us',
  };

  return (
    <div className="flex flex-col bg-slate-50" style={{ minHeight: 'calc(100vh - 80px)', marginTop: '80px' }}>

      {/* Header */}
      <header className="bg-white h-16 border-b border-slate-100 px-6 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 text-gray-500 hover:text-brand-slate transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[9px] font-bold text-brand-pink uppercase tracking-widest block">YAATRI HUB</span>
            <h1 className="text-sm font-extrabold text-brand-slate tracking-tight flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-brand-saffron fill-brand-saffron" />
              ✦ Explore AI Engine
            </h1>
          </div>
        </div>
        {user && (
          <span className="text-xs font-semibold text-gray-500 hidden sm:block">
            Consulting as: <strong className="text-brand-blue">@{user.username}</strong>
          </span>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
          {messages.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col max-w-[85%] ${m.type === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              {/* Bubble */}
              <div className={`p-4 text-sm leading-relaxed ${
                m.type === 'user'
                  ? 'bg-brand-blue text-white rounded-[20px] rounded-tr-sm shadow-md'
                  : 'bg-white text-slate-800 rounded-[20px] rounded-tl-sm border border-slate-100 shadow-sm font-medium'
              }`}>
                {m.text}
              </div>

              {/* Redirect button */}
              {m.redirectTo && ROUTE_LABELS[m.redirectTo] && (
                <button
                  onClick={() => navigate(m.redirectTo)}
                  className="mt-2 flex items-center gap-1.5 text-xs bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/30 text-brand-green rounded-lg px-3 py-1.5 transition-all cursor-pointer font-semibold"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  {ROUTE_LABELS[m.redirectTo]}
                </button>
              )}

              {/* Suggested destinations */}
              {m.suggestedDestinations?.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 w-full sm:w-80 self-start">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Related expedition files</p>
                  {m.suggestedDestinations.map(dest => (
                    <motion.div
                      key={dest._id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate(`/destination/${dest._id}`)}
                      className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-md shadow-slate-100 flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <img src={dest.imageURL} alt={dest.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        <div className="text-xs">
                          <h4 className="font-extrabold text-brand-slate group-hover:text-brand-blue line-clamp-1">{dest.name}</h4>
                          <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-brand-pink" />
                            {dest.region}
                          </p>
                        </div>
                      </div>
                      <div className="p-1.5 bg-brand-blue/5 text-brand-blue rounded-lg shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="self-start flex items-center gap-3 p-4 bg-white/70 border border-slate-100 rounded-[20px] rounded-tl-sm shadow-sm">
              <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
              <span className="text-xs font-semibold text-gray-400">Consulting Himalayan registers…</span>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Footer input */}
      <footer className="bg-white border-t border-slate-100 p-6 shrink-0">
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-4">

          {/* Quick prompts (only on first message) */}
          {messages.length <= 1 && !isLoading && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold text-gray-600">
              {prompts.map(p => (
                <button
                  key={p}
                  onClick={() => setUserInput(p.replace(/[-]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[‑-⛿]|\uD83E[\uDC00-\uDFFF]/g, '').trim())}
                  className="px-3.5 py-2 rounded-full border border-slate-100 hover:border-brand-blue bg-slate-50 hover:bg-brand-blue/5 transition-all shrink-0 cursor-pointer whitespace-nowrap"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/10 transition-all"
          >
            <Compass className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about weather, altitudes, or trekking gear…"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none text-sm text-brand-slate font-semibold focus:outline-none placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="p-2.5 rounded-full bg-brand-blue hover:bg-brand-blue/90 text-white disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </footer>

    </div>
  );
}
