import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('yaatri_token');
      if (token) {
        try {
          const { data } = await api.get('/me');
          setUser(data);
        } catch (err) {
          localStorage.removeItem('yaatri_token');
          localStorage.removeItem('yaatri_user');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (payload) => {
    try {
      const { data } = await api.post('/login', payload);
      localStorage.setItem('yaatri_token', data.token);
      localStorage.setItem('yaatri_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('DEBUG LOGIN ERROR:', err.response?.data || err.message, err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('yaatri_token');
    localStorage.removeItem('yaatri_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};