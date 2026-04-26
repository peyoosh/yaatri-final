import api from './axios';

export const fetchBlogs = (config) => api.get('/blogs', config);
export const createBlog = (data, config) => api.post('/blogs', data, config);
export const reportBlog = (id, config) => api.patch(`/blogs/${id}/report`, {}, config);
export const deleteBlog = (id, config) => api.delete(`/blogs/${id}`, config);