import api from './api';

const productService = {
    // Get all products
    getAll: async () => {
        return await api.get('/products');
    },

    // Get single product
    getById: async (id) => {
        return await api.get(`/products/${id}`);
    },

    // Create product
    create: async (productData) => {
        return await api.post('/products', productData);
    },

    // Update product
    update: async (id, productData) => {
        return await api.put(`/products/${id}`, productData);
    },

    // Delete product
    delete: async (id) => {
        return await api.delete(`/products/${id}`);
    },

    // Get low stock products
    getLowStock: async () => {
        return await api.get('/products/low-stock');
    },
};

export default productService;
