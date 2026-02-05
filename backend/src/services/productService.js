/**
 * PRODUCT SERVICE
 * 
 * This service contains all business logic related to products.
 * It's separated from the controller to keep code organized and reusable.
 * 
 * Services handle:
 * - Database operations
 * - Data transformations
 * - Business logic calculations
 */

const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * CHECK IF PRODUCT EXISTS
 * 
 * Purpose: Verify if a product exists in the database before performing operations
 * 
 * @param {string} productId - UUID of the product to check
 * @param {string} businessId - UUID of the business (ensures user can only access their products)
 * @returns {Promise<Object|null>} Product object if exists, null otherwise
 */
const checkProductExists = async (productId, businessId) => {
  try {
    // Query the products table
    // .single() expects exactly one result, throws error if 0 or >1 results
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('business_id', businessId)
      .single();

    // If error occurs (product not found or query failed)
    if (error) {
      logger.error('Product check failed:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error in checkProductExists:', error);
    return null;
  }
};

/**
 * GET STOCK STATUS
 * 
 * Purpose: Determine stock status based on current stock vs min/max levels
 * 
 * Status logic:
 * - OUT_OF_STOCK: current_stock = 0
 * - LOW_STOCK: current_stock < min_stock_level (but > 0)
 * - IN_STOCK: current_stock >= min_stock_level and <= max_stock_level
 * - OVERSTOCK: current_stock > max_stock_level
 * 
 * @param {number} currentStock - Current quantity in stock
 * @param {number} minStock - Minimum stock threshold
 * @param {number} maxStock - Maximum stock threshold
 * @returns {string} Stock status
 */
const getStockStatus = (currentStock, minStock, maxStock) => {
  if (currentStock === 0) return 'OUT_OF_STOCK';
  if (currentStock < minStock) return 'LOW_STOCK';
  if (currentStock > maxStock) return 'OVERSTOCK';
  return 'IN_STOCK';
};

/**
 * CALCULATE PRODUCT METRICS
 * 
 * Purpose: Calculate useful metrics for a product
 * 
 * @param {Object} product - Product object from database
 * @returns {Object} Product with additional calculated fields
 */
const calculateProductMetrics = (product) => {
  return {
    ...product,
    // Calculate total value of current stock
    stock_value: (product.current_stock * product.purchase_price).toFixed(2),
    
    // Calculate profit margin percentage
    // Formula: ((Selling Price - Purchase Price) / Selling Price) × 100
    profit_margin: (
      ((product.selling_price - product.purchase_price) / product.selling_price) * 100
    ).toFixed(2),
    
    // Get stock status
    stock_status: getStockStatus(
      product.current_stock,
      product.min_stock_level,
      product.max_stock_level
    )
  };
};

module.exports = {
  checkProductExists,
  getStockStatus,
  calculateProductMetrics
};