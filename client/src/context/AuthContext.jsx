import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('yaatri_token');
      if (token) {
        try {
          const { data } = await axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(data);
        } catch (err) {
          localStorage.removeItem('yaatri_token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (payload) => {
    const { data } = await axios.post('http://localhost:5000/api/auth/login', payload);
    localStorage.setItem('yaatri_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('yaatri_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};