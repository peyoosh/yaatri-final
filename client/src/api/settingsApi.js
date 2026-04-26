import api from './axios';

export const fetchSettings = (config) => api.get('/settings', config);
export const updateSettings = (data, config) => api.post('/settings', data, config);