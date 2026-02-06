import api from './api';

const alertService = {
    getAll: (params) => api.get('/alerts', { params }),
    markAsRead: (id) => api.put(`/alerts/${id}/read`),
    markAsResolved: (id) => api.put(`/alerts/${id}/resolve`),
    delete: (id) => api.delete(`/alerts/${id}`),
};

export default alertService;
