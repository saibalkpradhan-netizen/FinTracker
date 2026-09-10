import api from './axios';

export const getTransactions = (params = {}) => api.get('/transactions', { params }).then((r) => r.data);
export const getTransaction = (id) => api.get(`/transactions/${id}`).then((r) => r.data.transaction);
export const createTransaction = (payload) => api.post('/transactions', payload).then((r) => r.data.transaction);
export const updateTransaction = (id, payload) => api.put(`/transactions/${id}`, payload).then((r) => r.data.transaction);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then((r) => r.data);
