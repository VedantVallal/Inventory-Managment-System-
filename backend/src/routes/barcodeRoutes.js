const express = require('express');
const router = express.Router();
const {
    getProductByBarcode,
    barcodePurchase,
    barcodeSale
} = require('../controllers/barcodeController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * BARCODE ROUTES
 * 
 * All routes require authentication
 * Provides barcode-based inventory operations
 */

// @route   GET /api/v1/barcode/product/:barcode
// @desc    Get product by barcode
// @access  Private
router.get('/product/:barcode', protect, getProductByBarcode);

// @route   POST /api/v1/barcode/purchase
// @desc    Create purchase using barcode (add stock)
// @access  Private
router.post('/purchase', protect, barcodePurchase);

// @route   POST /api/v1/barcode/sale
// @desc    Create sale using barcode (reduce stock)
// @access  Private
router.post('/sale', protect, barcodeSale);

module.exports = router;
