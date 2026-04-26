import api from './axios';

export const fetchDestinations = (config) => api.get('/destinations', config);
export const createDestination = (data, config) => api.post('/destinations', data, config);
export const deleteDestination = (id, config) => api.delete(`/destinations/${id}`, config);