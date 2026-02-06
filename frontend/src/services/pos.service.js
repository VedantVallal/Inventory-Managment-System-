import api from './api';

/**
 * POS SERVICE
 * 
 * Handles POS-specific API calls
 * Optimized for fast billing operations
 */

const posService = {
    // Quick product search for POS
    searchProducts: async (query) => {
        return await api.get(`/products`, {
            params: {
                search: query,
                limit: 20,
                sortBy: 'product_name',
                sortOrder: 'asc'
            }
        });
    },

    // Get product by barcode (reuse existing service)
    getProductByBarcode: async (barcode) => {
        return await api.get(`/barcode/product/${barcode}`);
    },

    // Create bill (POS optimized)
    createBill: async (billData) => {
        return await api.post('/barcode/sale', billData);
    },

    // Get recent bills
    getRecentBills: async (limit = 10) => {
        return await api.get('/bills', {
            params: {
                limit,
                sortBy: 'created_at',
                sortOrder: 'desc'
            }
        });
    },

    // Get bill by ID (for reprinting)
    getBillById: async (billId) => {
        return await api.get(`/bills/${billId}`);
    }
};

export default posService;
