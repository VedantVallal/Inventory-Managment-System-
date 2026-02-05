/**
 * PRODUCT ROUTES
 * 
 * This file defines all the routes (endpoints) for product operations.
 * Each route is connected to a controller function.
 * 
 * Route structure:
 * - HTTP Method + Path → Middleware → Controller
 */

const express = require('express');
const router = express.Router();

// IMPORT CONTROLLERS
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  getOverstockProducts
} = require('../controllers/productController');

// IMPORT MIDDLEWARE
const { protect } = require('../middlewares/authMiddleware');
const { adminOnly, adminOrManager } = require('../middlewares/roleMiddleware');

/**
 * ROUTE DEFINITIONS
 * 
 * All routes require authentication (protect middleware)
 * Some routes have additional role restrictions
 */

// GET SPECIAL PRODUCT LISTS
// Note: These must come BEFORE /:id route to avoid conflicts
// Order matters! Express matches routes in order they're defined

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    Get all low stock products
 * @access  Private (Admin & Manager)
 */
router.get('/low-stock', protect, adminOrManager, getLowStockProducts);

/**
 * @route   GET /api/v1/products/out-of-stock
 * @desc    Get all out of stock products
 * @access  Private (Admin & Manager)
 */
router.get('/out-of-stock', protect, adminOrManager, getOutOfStockProducts);

/**
 * @route   GET /api/v1/products/overstock
 * @desc    Get all overstock products
 * @access  Private (Admin & Manager)
 */
router.get('/overstock', protect, adminOrManager, getOverstockProducts);

// STANDARD CRUD ROUTES

/**
 * @route   GET /api/v1/products
 * @desc    Get all products (with pagination, search, filters)
 * @access  Private (Admin & Manager)
 */
router.get('/', protect, adminOrManager, getAllProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get single product by ID
 * @access  Private (Admin & Manager)
 */
router.get('/:id', protect, adminOrManager, getProductById);

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Private (Admin & Manager)
 */
router.post('/', protect, adminOrManager, createProduct);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (Admin & Manager)
 */
router.put('/:id', protect, adminOrManager, updateProduct);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (Admin only) - Only admins can delete products
 */
router.delete('/:id', protect, adminOnly, deleteProduct);

// EXPORT ROUTER
module.exports = router;