import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader, MapPin, Maximize2, ExternalLink, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ROUTE_LABELS = {
  '/destinations': 'Browse Destinations',
  '/explore': 'Open AI Explorer',
  '/blog': 'Read Blog',
  '/support': 'Get Support',
  '/login': 'Sign In',
  '/register': 'Create Account',
  '/dashboard': 'My Dashboard',
  '/contact': 'Contact Us',
};

const AIChatbox = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Namaste! I'm your Yaatri AI guide. Ask me about treks, best seasons, what to pack, or which destination fits your style.",
      suggestedDestinations: [],
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', text: userInput, suggestedDestinations: [] };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-12).map(m => ({
        role: m.type === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text || '').slice(0, 2000) }],
      }));

      const { data } = await api.post('/ai/chat', { query: userMsg.text, history }, { timeout: 45_000 });
      const { reply, redirectTo, suggestedDestinations } = data || {};

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: reply || "Ask me about treks, seasons, or which destination fits your style.",
        suggestedDestinations: suggestedDestinations || [],
        redirectTo: redirectTo || null,
      }]);
    } catch (error) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.reply;
      const isNetwork = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');

      if (status === 429 && serverMsg) {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: serverMsg, suggestedDestinations: [] }]);
      } else if (isNetwork) {
        const waitMsg = { id: Date.now() + 1, type: 'bot', text: "The guide is waking up — retrying in 15 seconds…", suggestedDestinations: [] };
        setMessages(prev => [...prev, waitMsg]);
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 15000));
        try {
          const retryHistory = messages.slice(-6).map(m => ({ role: m.type === 'user' ? 'user' : 'model', parts: [{ text: String(m.text || '').slice(0, 800) }] }));
          const { data } = await api.post('/ai/chat', { query: userMsg.text, history: retryHistory }, { timeout: 60_000 });
          const { reply, redirectTo, suggestedDestinations } = data || {};
          setMessages(prev => [...prev.filter(m => m.id !== waitMsg.id), { id: Date.now() + 2, type: 'bot', text: reply, suggestedDestinations: suggestedDestinations || [], redirectTo: redirectTo || null }]);
        } catch {
          setMessages(prev => prev.map(m => m.id === waitMsg.id ? { ...m, text: "Still waking up — please try again." } : m));
        }
      } else {
        const text = error.code === 'ECONNABORTED' ? "That took too long. Try a shorter question." : "Something went wrong. Please try again.";
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text, suggestedDestinations: [] }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="fixed bottom-24 left-6 w-96 max-w-[calc(100vw-2rem)] max-h-145 bg-white rounded-2xl shadow-2xl shadow-brand-blue/10 border border-slate-100 flex flex-col overflow-hidden z-40"
          >
            {/* Header */}
            <div className="bg-brand-blue px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-none">Yaatri AI Guide</h3>
                  <p className="text-blue-200 text-[10px] font-medium mt-0.5">✦ Explore Engine</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/explore', { state: { messages, userInput } });
                  }}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                  title="Open full screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 no-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="w-full">
                    <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.type === 'user'
                        ? 'bg-brand-blue text-white rounded-br-sm ml-auto'
                        : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100 shadow-sm font-medium'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Redirect button */}
                    {msg.redirectTo && ROUTE_LABELS[msg.redirectTo] && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => { setIsOpen(false); navigate(msg.redirectTo); }}
                          className="flex items-center gap-1.5 text-[11px] bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/20 text-brand-blue rounded-lg px-3 py-1.5 transition-all cursor-pointer font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {ROUTE_LABELS[msg.redirectTo]}
                        </button>
                      </div>
                    )}

                    {/* Suggested destination cards */}
                    {msg.suggestedDestinations?.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        {msg.suggestedDestinations.map(dest => (
                          <motion.button
                            key={dest._id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => { setIsOpen(false); navigate(`/destination/${dest._id}`); }}
                            className="w-full text-left bg-white hover:bg-slate-50 border border-slate-100 rounded-xl p-3 transition-all cursor-pointer shadow-sm flex items-center gap-3 group"
                          >
                            <img src={dest.imageURL} alt={dest.name} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-100" />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-brand-slate group-hover:text-brand-blue truncate transition-colors">{dest.name}</p>
                              <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 text-brand-pink shrink-0" />
                                <span className="truncate">{dest.region} · {dest.terrainType}</span>
                              </p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 shadow-sm text-slate-500 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                    <Loader className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                    <span className="text-xs font-medium">Thinking…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-3 bg-white">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Ask about destinations…"
                  disabled={isLoading}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-gray-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !userInput.trim()}
                  className="bg-brand-blue hover:bg-brand-blue/90 disabled:bg-gray-200 text-white rounded-xl p-2.5 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <button
                onClick={() => setMessages([{ id: 1, type: 'bot', text: "Namaste! Ask me about Nepal treks, seasons, or which destination fits your style.", suggestedDestinations: [] }])}
                className="w-full text-[10px] text-gray-400 hover:text-brand-blue transition-colors py-1.5 cursor-pointer"
              >
                Clear chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BUTTON */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-2xl p-4 shadow-xl shadow-brand-blue/25 hover:shadow-brand-blue/40 transition-all z-40 border border-brand-blue/20"
        title={isOpen ? 'Close AI Guide' : 'Open AI Guide'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles className="w-5 h-5 fill-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
};

export default AIChatbox;
