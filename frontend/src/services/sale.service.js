import api from './api';

const saleService = {
    // Get all sales/bills
    getAll: async (params) => {
        return await api.get('/sales', { params });
    },

    // Get single sale by ID
    getById: async (id) => {
        return await api.get(`/sales/${id}`);
    },

    // Create new sale/bill
    create: async (saleData) => {
        return await api.post('/sales', saleData);
    },

    // Update sale
    update: async (id, saleData) => {
        return await api.put(`/sales/${id}`, saleData);
    },

    // Delete sale
    delete: async (id) => {
        return await api.delete(`/sales/${id}`);
    },

    // Get sales by date range
    getByDateRange: async (startDate, endDate) => {
        return await api.get(`/sales/date-range?start=${startDate}&end=${endDate}`);
    },
};

export default saleService;
