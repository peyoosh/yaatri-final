import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const Auth = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ username: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const getAuthMode = () => {
    if (location.pathname === '/register') return 'signup';
    if (location.pathname === '/login') return 'login';
    return searchParams.get('mode') || 'login';
  };

  const [isLogin, setIsLogin] = useState(getAuthMode() === 'login');

  useEffect(() => {
    setIsLogin(getAuthMode() === 'login');
    // Clear form data on mode toggle so credentials don't leak from signup→login (or vice versa)
    setFormData({ username: '', email: '', phoneNumber: '', password: '' });
    setError('');
  }, [location.pathname, searchParams]);

  const switchMode = () => {
    if (isLogin) {
      navigate('/register');
    } else {
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? 'login' : 'register';
    const payload = isLogin
      ? { identifier: formData.email, password: formData.password }
      : formData;

    try {
      if (isLogin) {
        await login(payload);
        navigate('/');
      } else {
        await api.post(`/${endpoint}`, payload);
        navigate('/login');
        alert('REGISTRATION_COMPLETE: Please log in to continue.');
      }
    } catch (err) {
      // Log a sanitized summary only — never the full axios error (config carries the Authorization header).
      console.error('AUTH_ERROR', {
        status: err.response?.status || null,
        code: err.code || null,
        message: err.response?.data?.message || err.message,
      });

      const errorMsg = err.response?.data?.message
        || err.response?.data?.error
        || err.response?.data?.errorCode
        || err.message
        || 'UPLINK_FAILED: Server unreachable.';

      setError(errorMsg);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', background: 'var(--obsidian)' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '450px', background: 'var(--obsidian)', border: '1px solid rgba(255,255,255,0.1)', padding: '3rem 2.5rem', borderRadius: '8px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'white', letterSpacing: '4px', fontWeight: '900', fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>YAATRI</h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0.5rem 0' }}>{isLogin ? 'Sign in' : 'Create your account'}</h2>
          <p style={{ fontSize: '1rem', opacity: 0.8, margin: '0.5rem 0 2rem 0' }}>{isLogin ? 'Use your Yaatri Account' : 'Continue to Yaatri Hub'}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              className="yaatri-search-input"
              style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '13px 15px', borderRadius: '4px' }}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          )}
          <input
            type="text"
            placeholder={isLogin ? "Email or phone" : "Email address"}
            className="yaatri-search-input"
            style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '13px 15px', borderRadius: '4px' }}
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="Phone number"
              className="yaatri-search-input"
              style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '13px 15px', borderRadius: '4px' }}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              required
            />
          )}
          <input
            type="password"
            placeholder="Enter your password"
            className="yaatri-search-input"
            style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '13px 15px', borderRadius: '4px' }}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          {error && <p style={{ color: '#ff4d4d', fontSize: '0.7rem', textAlign: 'center' }}>[!] {error}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem' }}>
            <button 
              type="button"
              onClick={switchMode}
              style={{ background: 'none', border: 'none', color: 'var(--hill-green)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
            >
              {isLogin ? 'Create account' : 'Sign in instead'}
            </button>
            <button type="submit" className="btn-primary-white" style={{ padding: '0.6rem 1.5rem', borderRadius: '4px', fontSize: '0.85rem', minWidth: '100px' }}>
              {isLogin ? 'Sign in' : 'Register'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.2 }}>
          <ShieldCheck size={14} style={{ display: 'inline' }} /> <span style={{ fontSize: '0.6rem' }}>ENCRYPTION_ACTIVE: LALITPUR_V2</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;