import api from './api';

/**
 * BARCODE SERVICE
 * 
 * Handles all barcode-related API calls
 */

const barcodeService = {
    // Get product by barcode
    getProductByBarcode: async (barcode) => {
        return await api.get(`/barcode/product/${barcode}`);
    },

    // Create purchase using barcode
    createBarcodePurchase: async (purchaseData) => {
        return await api.post('/barcode/purchase', purchaseData);
    },

    // Create sale using barcode
    createBarcodeSale: async (saleData) => {
        return await api.post('/barcode/sale', saleData);
    },
};

export default barcodeService;
