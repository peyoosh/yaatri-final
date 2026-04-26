import api from './axios';

export const fetchAdminBlogs = (config) => api.get('/admin/blogs', config);
export const flagAdminBlog = (id, config) => api.patch(`/admin/blogs/${id}/flag`, {}, config);