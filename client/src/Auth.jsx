import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';

const Auth = ({ onLoginSuccess }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [formData, setFormData] = useState({ username: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get('mode');
    setIsLogin(mode !== 'signup');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? 'login' : 'register';
    
    // If login, we send email/phone as 'identifier' to match the server logic
    const payload = isLogin 
      ? { identifier: formData.email, password: formData.password }
      : formData;

    try {
      const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);
      if (isLogin) {
        localStorage.setItem('yaatri_token', res.data.token);
        onLoginSuccess(res.data.user);
        navigate('/');
      } else {
        setSearchParams({ mode: 'login' });
        alert("REGISTRATION_COMPLETE: Please login to verify uplink.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "UPLINK_FAILED");
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
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required 
            />
          )}
          <input 
            type="text" 
            placeholder={isLogin ? "Email or phone" : "Email address"} 
            className="yaatri-search-input" 
            style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '13px 15px', borderRadius: '4px' }}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Phone number" 
              className="yaatri-search-input" 
              style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '13px 15px', borderRadius: '4px' }}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              required 
            />
          )}
          <input 
            type="password" 
            placeholder="Enter your password" 
            className="yaatri-search-input" 
            style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '13px 15px', borderRadius: '4px' }}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required 
          />

          {error && <p style={{ color: '#ff4d4d', fontSize: '0.7rem', textAlign: 'center' }}>[!] {error}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem' }}>
            <button 
              type="button"
              onClick={() => setSearchParams({ mode: isLogin ? 'signup' : 'login' })}
              style={{ background: 'none', border: 'none', color: 'var(--hill-green)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
            >
              {isLogin ? "Create account" : "Sign in instead"}
            </button>
            <button type="submit" className="btn-primary-white" style={{ padding: '0.6rem 1.5rem', borderRadius: '4px', fontSize: '0.85rem', minWidth: '100px' }}>
              {isLogin ? 'Next' : 'Register'}
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