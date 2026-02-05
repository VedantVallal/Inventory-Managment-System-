import api from './api';

const purchaseService = {
    // Get all purchases
    getAll: async () => {
        return await api.get('/purchases');
    },

    // Get single purchase by ID
    getById: async (id) => {
        return await api.get(`/purchases/${id}`);
    },

    // Create new purchase
    create: async (purchaseData) => {
        return await api.post('/purchases', purchaseData);
    },

    // Delete purchase
    delete: async (id) => {
        return await api.delete(`/purchases/${id}`);
    },
};

export default purchaseService;
