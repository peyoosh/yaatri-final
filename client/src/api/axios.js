import axios from 'axios';

// 1. FOOLPROOF URL NORMALIZER: 
// Strips trailing slashes and guarantees '/api' is attached, 
// protecting against typos in your .env deployment variables.

const normalizeApiUrl = (url) => {
  if (!url) return url;
  let normalized = url.trim().replace(/\/+$/g, '');

  if (!/^https?:\/\//i.test(normalized)) {
    if (normalized.startsWith(':')) {
      normalized = `http://localhost${normalized}`;
    } else if (/^localhost[:\/]/i.test(normalized) || /^127\.0\.0\.1[:\/]/.test(normalized)) {
      normalized = `http://${normalized}`;
    } else if (/^\d+$/.test(normalized)) {
      normalized = `http://localhost:${normalized}`;
    } else {
      normalized = `http://${normalized}`;
    }
  }

  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

// DYNAMIC FALLBACK: If Vite doesn't find an env variable, check the browser's URL.
const resolveBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL?.trim() || import.meta.env.VITE_API_BASE_URL?.trim();
  if (envURL) {
    return normalizeApiUrl(envURL);
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  return 'https://yaatri-backend.onrender.com/api';
};

const rawBaseURL = resolveBaseURL();
const api = axios.create({
  baseURL: rawBaseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let apiErrorHandler = null;

export const setApiErrorHandler = (handler) => {
  apiErrorHandler = typeof handler === 'function' ? handler : null;
};

const emitApiError = (error, meta = {}) => {
  if (typeof apiErrorHandler === 'function') {
    try {
      apiErrorHandler(error, meta);
    } catch (handlerError) {
      console.warn('API_ERROR_HANDLER_FAILED', handlerError);
    }
  }
};

const enrichAxiosError = (error, name, meta = {}) => {
  if (!error || typeof error !== 'object') return error;

  error.name = name;
  error.apiError = {
    source: name,
    stage: meta.stage || 'unknown',
    reason: meta.reason || null,
    url: meta.config?.url || null,
    method: meta.config?.method || null,
    baseURL: meta.config?.baseURL || null,
    status: error.response?.status || null,
    statusText: error.response?.statusText || null,
    responseData: error.response?.data || null,
    timestamp: new Date().toISOString(),
  };

  return error;
};

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('yaatri_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      enrichAxiosError(error, 'API_REQUEST_SETUP_ERROR', {
        stage: 'request',
        reason: 'Failed while attaching authorization token to request headers',
        config,
      });
      emitApiError(error, { stage: 'request', reason: 'Request setup failed', config });
      return Promise.reject(error);
    }
  },
  (error) => {
    enrichAxiosError(error, 'API_REQUEST_INTERCEPTOR_ERROR', {
      stage: 'request',
      reason: 'Axios request interceptor failed',
    });
    emitApiError(error, { stage: 'request', reason: 'Request interceptor error' });
    return Promise.reject(error);
  }
);

// 2. FOOLPROOF SESSION MANAGEMENT + ONE-SHOT NETWORK RETRY:
// - Auth failures (401/403) clear local tokens (routing decisions stay with AuthContext).
// - Transient network errors (backend restarting, brief outage) are retried ONCE after a 600ms delay.
//   The retry is marked on config._retried so we never loop infinitely.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const response = error.response;
    const isNetworkErr = !response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');

    // One-shot retry on connection refused / network drop. Skips POST mutations to avoid double-submit.
    if (isNetworkErr && !config._retried && (config.method || 'get').toLowerCase() === 'get') {
      config._retried = true;
      await new Promise((r) => setTimeout(r, 600));
      try {
        return await api.request(config);
      } catch (retryErr) {
        // fall through to the enrichment path below with the *original* error
      }
    }

    if (error.code === 'ECONNABORTED') {
      enrichAxiosError(error, 'API_TIMEOUT_ERROR', {
        stage: 'response',
        reason: 'The request timed out',
        config,
      });
    } else if (isNetworkErr) {
      enrichAxiosError(error, 'API_NETWORK_ERROR', {
        stage: 'response',
        reason: 'Backend unreachable — is your server running on port 5000?',
        config,
      });
    } else if (response) {
      if ([401, 403].includes(response.status)) {
        enrichAxiosError(error, 'API_AUTH_ERROR', {
          stage: 'response',
          reason: 'Authentication or authorization failed',
          config,
        });
      } else if (response.status === 404) {
        enrichAxiosError(error, 'API_NOT_FOUND_ERROR', {
          stage: 'response',
          reason: 'Requested endpoint not found',
          config,
        });
      } else if (response.status >= 500) {
        enrichAxiosError(error, 'API_SERVER_ERROR', {
          stage: 'response',
          reason: 'Server encountered an error',
          config,
        });
      } else if (response.status >= 400) {
        enrichAxiosError(error, 'API_CLIENT_ERROR', {
          stage: 'response',
          reason: 'Client request error',
          config,
        });
      } else {
        enrichAxiosError(error, 'API_RESPONSE_ERROR', {
          stage: 'response',
          reason: 'Unexpected response error',
          config,
        });
      }
    } else {
      enrichAxiosError(error, 'API_UNKNOWN_ERROR', {
        stage: 'response',
        reason: 'Unknown axios error without response',
        config,
      });
    }

    emitApiError(error, {
      stage: 'response',
      config,
      status: response?.status || null,
      statusText: response?.statusText || null,
    });

    // Clear stale credentials on auth failure, but DO NOT force-navigate from inside the interceptor.
    // Routing decisions belong to AuthContext / ProtectedRoute so public pages and the `/me` boot call
    // don't get yanked to /login on a benign 401.
    if (error.response && [401, 403].includes(error.response.status)) {
      try {
        localStorage.removeItem('yaatri_token');
        localStorage.removeItem('yaatri_user');
      } catch (storageErr) {
        console.warn('Failed to clear auth storage after 401/403', storageErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;