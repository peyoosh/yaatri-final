import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { MessageCircle, X, Send, Loader, MapPin, Maximize2, ExternalLink } from 'lucide-react';

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
import { motion, AnimatePresence } from 'framer-motion';

const AIChatbox = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Namaste! I'm your Yaatri guide. Ask me about treks (EBC, ABC, Mustang), the best seasons, what to pack, costs, or which destination fits your travel style. What's on your mind?",
      timestamp: new Date(),
      suggestedDestinations: []
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbox opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: userInput,
      timestamp: new Date(),
      suggestedDestinations: []
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Build a compact history payload for Gemini's startChat. We map the local
      // chat model {type: 'user'|'bot'} → Gemini's {role: 'user'|'model'} and keep
      // only the last ~12 messages so prompt size stays bounded.
      const history = messages.slice(-12).map((m) => ({
        role: m.type === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text || '').slice(0, 2000) }],
      }));

      // 45s timeout (vs the default 15s) — Gemini occasionally takes 8–12s and
      // Render's free tier cold-starts the backend after 15 min idle.
      const response = await api.post('/ai/chat', { query: userInput, history }, { timeout: 45_000 });
      const { reply, redirectTo, suggestedDestinations } = response.data || {};

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: reply,
        timestamp: new Date(),
        suggestedDestinations: suggestedDestinations || [],
        redirectTo: redirectTo || null,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const isNetwork = !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED' || error.message === 'Network Error');
      const isTimeout = error.code === 'ECONNABORTED';

      if (isNetwork) {
        // Render free tier cold-starts take ~30s — show a friendly waiting message then auto-retry once
        const waitMsg = {
          id: Date.now() + 1,
          type: 'bot',
          text: "The guide is waking up from sleep — this takes about 30 seconds on the free server. Retrying automatically...",
          timestamp: new Date(),
          suggestedDestinations: [],
        };
        setMessages(prev => [...prev, waitMsg]);
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 12000));
        try {
          const history = messages.slice(-12).map((m) => ({
            role: m.type === 'user' ? 'user' : 'model',
            parts: [{ text: String(m.text || '').slice(0, 2000) }],
          }));
          const retry = await api.post('/ai/chat', { query: userInput || userMessage.text, history }, { timeout: 60_000 });
          const { reply, redirectTo, suggestedDestinations } = retry.data || {};
          setMessages(prev => [
            ...prev.filter(m => m.id !== waitMsg.id),
            { id: Date.now() + 2, type: 'bot', text: reply, timestamp: new Date(), suggestedDestinations: suggestedDestinations || [], redirectTo: redirectTo || null }
          ]);
          return;
        } catch {
          setMessages(prev => prev.map(m => m.id === waitMsg.id
            ? { ...m, text: "Still waking up — please try again in a moment." }
            : m
          ));
        }
      } else {
        const text = isTimeout
          ? "That took too long to respond. Try a shorter question, or try again."
          : "Something went wrong on my end. Please try again.";
        setMessages(prev => [...prev, {
          id: Date.now() + 1, type: 'bot', text, timestamp: new Date(), suggestedDestinations: []
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestinationClick = (destinationId) => {
    setIsOpen(false);
    navigate(`/destination/${destinationId}`);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        text: 'Welcome to Yaatri AI Guide! 🏔️ Tell me about your ideal travel experience. What kind of destination are you looking for? (e.g., high altitude, cultural, adventure, peaceful)',
        timestamp: new Date(),
        suggestedDestinations: []
      }
    ]);
  };

  return (
    <>
      {/* FLOATING CHATBOX WIDGET */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed bottom-24 left-6 w-96 max-w-[calc(100vw-2rem)] max-h-[600px] bg-gradient-to-br from-teal-steel to-obsidian border border-hill-green/30 rounded-2xl shadow-2xl shadow-hill-green/20 flex flex-col overflow-hidden z-40"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-hill-green to-[#047D57] p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-white" />
                <h3 className="text-white font-bold">Yaatri AI Guide</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Hand off the current conversation + draft input to the full-page Explore view.
                    navigate('/explore', { state: { messages, userInput } });
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                  title="Open in full screen"
                  aria-label="Open in full screen"
                >
                  <Maximize2 size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* MESSAGES AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-obsidian/50 scrollbar-thin scrollbar-thumb-[#059D72]/50 scrollbar-track-transparent">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="w-full">
                    <div
                      className={`max-w-xs px-4 py-3 rounded-xl ${
                        msg.type === 'user'
                          ? 'bg-hill-green text-white rounded-br-none ml-auto'
                          : 'bg-teal-steel/60 text-[#E8E3D6] rounded-bl-none border border-hill-green/20'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    </div>

                    {/* REDIRECT BUTTON — user-initiated, never auto-fires */}
                    {msg.redirectTo && (
                      <div className="mt-2 ml-0">
                        <button
                          onClick={() => { setIsOpen(false); navigate(msg.redirectTo); }}
                          className="flex items-center gap-1.5 text-xs bg-hill-green/20 hover:bg-hill-green/40 border border-hill-green/50 text-toxic-lime rounded-lg px-3 py-1.5 transition-all"
                        >
                          <ExternalLink size={12} />
                          {ROUTE_LABELS[msg.redirectTo] || msg.redirectTo}
                        </button>
                      </div>
                    )}

                    {/* SUGGESTED DESTINATIONS CARDS */}
                    {msg.suggestedDestinations && msg.suggestedDestinations.length > 0 && (
                      <div className="mt-3 space-y-2 ml-0">
                        {msg.suggestedDestinations.map((dest) => (
                          <motion.button
                            key={dest._id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleDestinationClick(dest._id)}
                            className="w-full text-left bg-hill-green/20 hover:bg-hill-green/40 border border-hill-green/50 rounded-lg p-3 transition-all cursor-pointer"
                          >
                            <div className="flex items-start gap-2">
                              <MapPin size={14} className="text-toxic-lime flex-shrink-0 mt-1" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-white truncate">
                                  {dest.name}
                                </p>
                                <p className="text-xs text-terai-harvest truncate">
                                  {dest.region} • {dest.terrainType}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-teal-steel/60 border border-hill-green/20 text-[#E8E3D6] px-4 py-3 rounded-xl flex items-center gap-2">
                    <Loader size={16} className="animate-spin text-hill-green" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className="border-t border-hill-green/20 p-3 bg-teal-steel/40 space-y-2">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about destinations..."
                  disabled={isLoading}
                  className="flex-1 bg-obsidian/60 border border-hill-green/30 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-hill-green transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !userInput.trim()}
                  className="bg-hill-green hover:bg-[#047D57] disabled:bg-gray-600 text-white rounded-lg p-2 transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
              <button
                onClick={clearChat}
                className="w-full text-xs text-terai-harvest hover:text-hill-green transition-colors py-1"
              >
                Clear Chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BUTTON */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 bg-gradient-to-br from-hill-green to-[#047D57] hover:from-toxic-lime hover:to-[#8BC34A] text-white rounded-full p-4 shadow-lg shadow-hill-green/30 hover:shadow-toxic-lime/30 transition-all z-40 border border-white/10"
        title={isOpen ? 'Close AI Guide' : 'Open AI Guide'}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
        )}
      </motion.button>
    </>
  );
};

export default AIChatbox;
