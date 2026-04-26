import api from './axios';

export const fetchUsers = (config) => api.get('/users', config);
export const deleteUser = (id, config) => api.delete(`/users/${id}`, config);
export const blockUser = (id, config) => api.patch(`/users/${id}/block`, {}, config);