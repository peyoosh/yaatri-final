import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, User as UserIcon, Phone, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);

  const resolveMode = (pathname, params) => {
    if (pathname === '/register') return 'register';
    if (pathname === '/login') return 'login';
    return params.get('mode') === 'signup' ? 'register' : 'login';
  };

  const [mode, setMode] = useState(() => resolveMode(location.pathname, searchParams));
  const [formData, setFormData] = useState({ username: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(resolveMode(location.pathname, searchParams));
    setFormData({ username: '', email: '', phoneNumber: '', password: '' });
    setError('');
  }, [location.pathname, searchParams]);

  const switchMode = () => navigate(mode === 'login' ? '/register' : '/login');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login({ identifier: formData.email, password: formData.password });
        navigate('/');
      } else {
        await api.post('/register', formData);
        navigate('/login');
        alert('REGISTRATION_COMPLETE: Please sign in to continue.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Server unreachable.';
      setError(msg);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="w-full min-h-screen bg-slate-900 flex items-center justify-center p-6 relative">
      {/* Dot grid background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-800 border border-slate-700/60 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col gap-6"
      >
        {/* Logo + header */}
        <div className="text-center">
          <span className="text-2xl font-black tracking-[0.25em] text-white">
            YAATRI<span className="text-brand-blue">HUB</span>
          </span>
          <p className="text-[10px] font-bold text-brand-saffron tracking-[0.2em] uppercase mt-1">REBORN SECURE</p>
          <h2 className="text-xl font-bold text-white tracking-tight mt-6">
            {isLogin ? 'Sign in' : 'Create your account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isLogin ? 'Use your Yaatri Account to continue' : 'Join the premier Nepal travel cooperative'}
          </p>
        </div>

        {/* Error bar */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2 text-xs font-mono"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>[!] {error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <InputField
                icon={<UserIcon className="w-4 h-4 text-slate-400" />}
                label="Username"
                type="text"
                placeholder="e.g. climber_pemba"
                value={formData.username}
                onChange={v => setFormData(p => ({ ...p, username: v }))}
                required
              />
              <InputField
                icon={<Phone className="w-4 h-4 text-slate-400" />}
                label="Phone Number"
                type="tel"
                placeholder="+977 984XXXXXXX"
                value={formData.phoneNumber}
                onChange={v => setFormData(p => ({ ...p, phoneNumber: v }))}
                required
              />
            </>
          )}

          <InputField
            icon={<Mail className="w-4 h-4 text-slate-400" />}
            label={isLogin ? 'Email / phone / username' : 'Email address'}
            type="text"
            placeholder="peyoosh1@gmail.com"
            value={formData.email}
            onChange={v => setFormData(p => ({ ...p, email: v }))}
            required
          />

          <InputField
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            label="Secure Password"
            type="password"
            placeholder="••••••••••••"
            value={formData.password}
            onChange={v => setFormData(p => ({ ...p, password: v }))}
            required
          />

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
            <button
              type="button"
              onClick={switchMode}
              className="text-xs text-brand-blue hover:underline cursor-pointer font-bold"
            >
              {isLogin ? 'Create an account?' : 'Switch to sign in'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{isLogin ? 'Sign in' : 'Join Yaatri'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Encryption footer */}
        <div className="text-center mt-2">
          <p className="font-mono text-[8px] text-slate-500 tracking-wider flex items-center justify-center gap-1 select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
            ENCRYPTION_ACTIVE: LALITPUR_V2
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function InputField({ icon, label, type, placeholder, value, onChange, required }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-300 block mb-1.5">{label}</label>
      <div className="flex items-center bg-slate-700/50 border border-slate-700 rounded-xl px-3.5 py-2.5 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/10 transition-all">
        <span className="mr-2 shrink-0">{icon}</span>
        <input
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none text-xs focus:outline-none placeholder-slate-500 font-semibold text-white"
        />
      </div>
    </div>
  );
}
