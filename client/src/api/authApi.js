import api from './axios';

export const loginUser = (data, config) => api.post('/auth/login', data, config);
export const registerUser = (data, config) => api.post('/auth/register', data, config);
export const getMe = (config) => api.get('/auth/me', config);