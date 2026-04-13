import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', phoneNumber: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        onLoginSuccess(res.data);
        navigate('/');
      } else {
        setIsLogin(true);
        alert("REGISTRATION_COMPLETE: Please login to verify uplink.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "UPLINK_FAILED");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '3rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(5, 157, 114, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            {isLogin ? <LogIn className="text-[var(--hill-green)]" /> : <UserPlus className="text-[var(--hill-green)]" />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '4px' }}>{isLogin ? 'SYSTEM_ACCESS' : 'CREATE_IDENTITY'}</h2>
          <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>{isLogin ? 'ENTER_CREDENTIALS_TO_SYNC' : 'REGISTER_NEW_RESEARCH_NODE'}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="USERNAME" 
              className="yaatri-search-input" 
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required 
            />
          )}
          <input 
            type="text" 
            placeholder={isLogin ? "EMAIL_OR_PHONE" : "UPLINK_EMAIL"} 
            className="yaatri-search-input" 
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />
          {!isLogin && (
            <input 
              type="text" 
              placeholder="PHONE_NUMBER" 
              className="yaatri-search-input" 
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              required 
            />
          )}
          <input 
            type="password" 
            placeholder="ACCESS_PASSWORD" 
            className="yaatri-search-input" 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required 
          />

          {error && <p style={{ color: '#ff4d4d', fontSize: '0.7rem', textAlign: 'center' }}>[!] {error}</p>}

          <button type="submit" className="btn-primary-white" style={{ marginTop: '1rem' }}>
            {isLogin ? 'SIGN_IN' : 'SIGN_UP'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--terai-harvest)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? "NEED_AN_ACCOUNT? SIGN_UP" : "ALREADY_REGISTERED? SIGN_IN"}
          </button>
        </div>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.2 }}>
          <ShieldCheck size={14} style={{ display: 'inline' }} /> <span style={{ fontSize: '0.6rem' }}>ENCRYPTION_ACTIVE: LALITPUR_V2</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;