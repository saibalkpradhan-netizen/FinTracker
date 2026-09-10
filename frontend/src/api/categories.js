import api from './axios';

export const getCategories = (type) => api.get('/categories', { params: type ? { type } : {} }).then((r) => r.data.categories);
export const createCategory = (payload) => api.post('/categories', payload).then((r) => r.data.category);
export const updateCategory = (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data.category);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data);
