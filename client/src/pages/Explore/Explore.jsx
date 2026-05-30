import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Send, Loader, MapPin, Sparkles, ArrowLeft, ExternalLink } from 'lucide-react';

const ROUTE_LABELS = {
  '/destinations': 'Browse Destinations',
  '/blog': 'Read Blog',
  '/support': 'Get Support',
  '/login': 'Sign In',
  '/register': 'Create Account',
  '/dashboard': 'My Dashboard',
  '/contact': 'Contact Us',
};
import { motion } from 'framer-motion';

const STARTER = {
  id: 1,
  type: 'bot',
  text: "Namaste! I'm your Yaatri guide. Ask me anything about trekking in Nepal — seasons, permits, what to pack, food, costs — or tell me what kind of trip you're after and I'll point you somewhere good.",
  timestamp: new Date(),
  suggestedDestinations: [],
};

// Full-page version of the AI chat experience. Accepts `location.state.messages` and `location.state.userInput`
// from AIChatbox's expand button so the conversation continues seamlessly.
const Explore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState(location.state?.messages || [STARTER]);
  const [userInput, setUserInput] = useState(location.state?.userInput || '');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (e) => {
    e?.preventDefault?.();
    if (!userInput.trim()) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: userInput,
      timestamp: new Date(),
      suggestedDestinations: [],
    };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Send the running conversation as Gemini-flavoured history so the model
      // can reference prior turns ("the trek you mentioned earlier", etc.).
      const history = [...messages, userMsg].slice(-12).map((m) => ({
        role: m.type === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text || '').slice(0, 2000) }],
      }));
      // Drop the last entry (current message) — sendMessage handles it server-side.
      const priorHistory = history.slice(0, -1);
      // 45s timeout (vs default 15s) — see AIChatbox.jsx for rationale.
      const { data } = await api.post('/ai/chat', { query: userMsg.text, history: priorHistory }, { timeout: 45_000 });
      const { reply, redirectTo, suggestedDestinations } = data || {};
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: reply,
        timestamp: new Date(),
        suggestedDestinations: suggestedDestinations || [],
        redirectTo: redirectTo || null,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const isNetwork = !err.response && (err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED' || err.message === 'Network Error');
      const isTimeout = err.code === 'ECONNABORTED';

      if (isNetwork) {
        const waitId = Date.now() + 2;
        setMessages(prev => [...prev, {
          id: waitId,
          type: 'bot',
          text: "The guide is waking up from sleep — this takes about 30 seconds on the free server. Retrying automatically...",
          timestamp: new Date(),
          suggestedDestinations: [],
        }]);
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 12000));
        try {
          const retryHistory = [...messages, userMsg].slice(-12).map(m => ({
            role: m.type === 'user' ? 'user' : 'model',
            parts: [{ text: String(m.text || '').slice(0, 2000) }],
          })).slice(0, -1);
          const { data } = await api.post('/ai/chat', { query: userMsg.text, history: retryHistory }, { timeout: 60_000 });
          const { reply, redirectTo, suggestedDestinations } = data || {};
          setMessages(prev => [
            ...prev.filter(m => m.id !== waitId),
            { id: Date.now() + 3, type: 'bot', text: reply, timestamp: new Date(), suggestedDestinations: suggestedDestinations || [], redirectTo: redirectTo || null },
          ]);
        } catch {
          setMessages(prev => prev.map(m => m.id === waitId
            ? { ...m, text: "Still waking up — please try again in a moment." }
            : m
          ));
        }
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          type: 'bot',
          text: isTimeout
            ? "That took too long. Try a shorter question or try again."
            : "Something went wrong on my end. Please try again.",
          timestamp: new Date(),
          suggestedDestinations: [],
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const prompts = [
    'I want a 5-day cultural trek',
    'Show me destinations with hot springs',
    'Read travelers\' stories about Mustang',
    'Help me plan an itinerary',
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--obsidian, #0D0A02)', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1.5rem 6%', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#A6A180', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#A2D729', fontWeight: 700, textTransform: 'uppercase' }}>Yaatri</p>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: '#A2D729' }} /> Explore Engine
            </h1>
          </div>
        </div>
        {user && <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>signed in as @{user.username}</span>}
      </header>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 6%' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <div style={{ maxWidth: '70%' }}>
                <div
                  style={{
                    background: m.type === 'user' ? 'var(--hill-green, #059D72)' : 'rgba(255,255,255,0.04)',
                    color: m.type === 'user' ? 'white' : 'white',
                    border: m.type === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    padding: '0.9rem 1.1rem',
                    borderRadius: m.type === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    fontSize: '0.95rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}
                </div>

                {m.suggestedDestinations && m.suggestedDestinations.length > 0 && (
                  <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                    {m.suggestedDestinations.map((d) => (
                      <button
                        key={d._id}
                        onClick={() => navigate(`/destination/${d._id}`)}
                        style={{
                          textAlign: 'left',
                          background: 'rgba(5,157,114,0.12)',
                          border: '1px solid rgba(5,157,114,0.4)',
                          borderRadius: 8,
                          padding: '0.6rem 0.85rem',
                          cursor: 'pointer',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <MapPin size={14} style={{ color: '#A2D729' }} />
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{d.name}</p>
                          <p style={{ fontSize: '0.7rem', opacity: 0.55 }}>{d.region} · {d.terrainType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {m.redirectTo && (
                  <button
                    onClick={() => navigate(m.redirectTo)}
                    style={{
                      marginTop: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(5,157,114,0.15)',
                      border: '1px solid rgba(5,157,114,0.45)',
                      color: '#A2D729',
                      borderRadius: 8,
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <ExternalLink size={13} />
                    {ROUTE_LABELS[m.redirectTo] || m.redirectTo}
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#A2D729' }}>
              <Loader size={14} className="animate-spin" />
              <span style={{ fontSize: '0.85rem' }}>Thinking…</span>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* INPUT + QUICK PROMPTS */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 6%', flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          {messages.length <= 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setUserInput(p)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#A6A180',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 999,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask about destinations, journals, planning, or login…"
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                padding: '0.85rem 1rem',
                borderRadius: 8,
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              style={{
                background: '#A2D729',
                color: '#0D0A02',
                border: 'none',
                padding: '0.85rem 1.2rem',
                borderRadius: 8,
                cursor: isLoading || !userInput.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: isLoading || !userInput.trim() ? 0.5 : 1,
              }}
            >
              <Send size={14} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Explore;
