import api from './api';

const supplierService = {
    // Get all suppliers
    getAll: async (params) => {
        return await api.get('/suppliers', { params });
    },

    // Get single supplier
    getById: async (id) => {
        return await api.get(`/suppliers/${id}`);
    },

    // Create supplier
    create: async (supplierData) => {
        return await api.post('/suppliers', supplierData);
    },

    // Update supplier
    update: async (id, supplierData) => {
        return await api.put(`/suppliers/${id}`, supplierData);
    },

    // Delete supplier
    delete: async (id) => {
        return await api.delete(`/suppliers/${id}`);
    },
};

export default supplierService;
