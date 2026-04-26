import axios from 'axios';

// 1. FOOLPROOF URL NORMALIZER: 
// Strips trailing slashes and guarantees '/api' is attached, 
// protecting against typos in your .env deployment variables.
let rawBaseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
if (!rawBaseURL.endsWith('/api')) {
  rawBaseURL += '/api';
}

const api = axios.create({
  baseURL: rawBaseURL,
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('yaatri_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. FOOLPROOF SESSION MANAGEMENT:
// Automatically catches expired or invalid tokens and forces a clean logout.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('yaatri_token');
      localStorage.removeItem('yaatri_user');
      window.location.href = '/auth?mode=login';
    }
    return Promise.reject(error);
  }
);

export default api;