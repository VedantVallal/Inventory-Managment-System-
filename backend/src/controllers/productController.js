/**
 * PRODUCT CONTROLLER
 * 
 * This controller handles all HTTP requests related to products.
 * It validates input, calls services, and sends responses.
 * 
 * Key responsibilities:
 * - Receive and validate request data
 * - Call appropriate service functions
 * - Handle errors and send proper HTTP responses
 * - Apply business logic
 */

const { supabase } = require('../config/database');
const { sendSuccess, sendError, generateSKU } = require('../utils/helpers');
const logger = require('../utils/logger');
const { calculateProductMetrics, checkProductExists } = require('../services/productService');

/**
 * @desc    Get all products for a business
 * @route   GET /api/v1/products
 * @access  Private (Admin & Manager)
 * 
 * Features:
 * - Pagination support
 * - Search by product name
 * - Filter by category
 * - Filter by stock status
 * - Sort by different fields
 */
const getAllProducts = async (req, res) => {
  try {
    // Extract business ID from authenticated user (set by auth middleware)
    const businessId = req.user.businessId;

    // EXTRACT QUERY PARAMETERS from URL
    // Example: /products?page=1&limit=10&search=laptop&category=electronics
    const {
      page = 1,           // Current page (default: 1)
      limit = 10,         // Items per page (default: 10)
      search = '',        // Search term for product name
      category = '',      // Filter by category ID
      status = '',        // Filter by stock status (low_stock, out_of_stock, etc.)
      sortBy = 'created_at', // Field to sort by
      sortOrder = 'desc'  // Sort direction (asc/desc)
    } = req.query;

    // CALCULATE PAGINATION VALUES
    // If page=2 and limit=10, we want to skip first 10 items (items 0-9)
    // and get next 10 items (items 10-19)
    const offset = (page - 1) * limit;

    // START BUILDING THE QUERY
    let query = supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          category_name
        ),
        suppliers (
          id,
          supplier_name
        )
      `, { count: 'exact' })  // count: 'exact' gives us total count for pagination
      .eq('business_id', businessId)  // Only get products for current business
      .eq('is_active', true);          // Only active products

    // APPLY SEARCH FILTER (if search term provided)
    // ilike is case-insensitive LIKE search in PostgreSQL
    // %search% means "contains search term anywhere in the string"
    if (search) {
      query = query.ilike('product_name', `%${search}%`);
    }

    // APPLY CATEGORY FILTER (if category provided)
    if (category) {
      query = query.eq('category_id', category);
    }

    // APPLY STOCK STATUS FILTER (if status provided)
    if (status === 'low_stock') {
      // Find products where current stock < minimum stock level
      query = query.lt('current_stock', supabase.rpc('min_stock_level'));
    } else if (status === 'out_of_stock') {
      query = query.eq('current_stock', 0);
    } else if (status === 'overstock') {
      query = query.gt('current_stock', supabase.rpc('max_stock_level'));
    }

    // APPLY SORTING
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // APPLY PAGINATION
    query = query.range(offset, offset + parseInt(limit) - 1);

    // EXECUTE THE QUERY
    const { data: products, error, count } = await query;

    // HANDLE QUERY ERRORS
    if (error) {
      logger.error('Error fetching products:', error);
      return sendError(res, 500, 'Failed to fetch products', error.message);
    }

    // CALCULATE ADDITIONAL METRICS for each product
    // This adds fields like stock_value, profit_margin, stock_status
    const productsWithMetrics = products.map(product => calculateProductMetrics(product));

    // CALCULATE PAGINATION METADATA
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // SEND SUCCESS RESPONSE with data and pagination info
    return sendSuccess(res, 200, 'Products retrieved successfully', {
      products: productsWithMetrics,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    logger.error('Get all products error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/v1/products/:id
 * @access  Private (Admin & Manager)
 * 
 * Returns detailed information about a single product
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;  // Extract product ID from URL parameter
    const businessId = req.user.businessId;

    // FETCH PRODUCT WITH RELATED DATA
    // We use LEFT JOIN to get category and supplier information
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          category_name,
          description
        ),
        suppliers (
          id,
          supplier_name,
          contact_person,
          phone,
          email
        ),
        users!products_created_by_fkey (
          id,
          full_name
        )
      `)
      .eq('id', id)
      .eq('business_id', businessId)
      .single();  // Expect exactly one result

    // HANDLE NOT FOUND
    if (error || !product) {
      return sendError(res, 404, 'Product not found');
    }

    // ADD CALCULATED METRICS
    const productWithMetrics = calculateProductMetrics(product);

    return sendSuccess(res, 200, 'Product retrieved successfully', {
      product: productWithMetrics
    });

  } catch (error) {
    logger.error('Get product by ID error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/v1/products
 * @access  Private (Admin & Manager)
 * 
 * Process:
 * 1. Validate input data
 * 2. Generate SKU if not provided
 * 3. Insert product into database
 * 4. Return created product
 */
const createProduct = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    // EXTRACT PRODUCT DATA from request body
    const {
      productName,
      categoryId,
      sku,
      barcode,
      unit = 'pcs',
      purchasePrice,
      sellingPrice,
      currentStock = 0,
      minStockLevel = 10,
      maxStockLevel = 100,
      supplierId,
      expiryDate,
      imageUrl,
      description
    } = req.body;

    // VALIDATE REQUIRED FIELDS
    if (!productName || !purchasePrice || !sellingPrice) {
      return sendError(res, 400, 'Product name, purchase price, and selling price are required');
    }

    // VALIDATE PRICE LOGIC
    // Selling price should typically be higher than purchase price
    if (parseFloat(sellingPrice) < parseFloat(purchasePrice)) {
      logger.warn('Selling price is less than purchase price');
      // Not blocking, just logging - sometimes valid for promotions
    }

    // GENERATE SKU if not provided
    // SKU format: ABC-123456-XYZ (first 3 letters of product + timestamp + random)
    const productSKU = sku || generateSKU(productName, businessId);

    // CHECK IF SKU ALREADY EXISTS
    // SKU must be unique within the business
    const { data: existingSKU } = await supabase
      .from('products')
      .select('id')
      .eq('business_id', businessId)
      .eq('sku', productSKU)
      .single();

    if (existingSKU) {
      return sendError(res, 400, 'Product with this SKU already exists');
    }

    // INSERT PRODUCT INTO DATABASE
    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          business_id: businessId,
          product_name: productName,
          category_id: categoryId || null,
          sku: productSKU,
          barcode: barcode || null,
          unit,
          purchase_price: parseFloat(purchasePrice),
          selling_price: parseFloat(sellingPrice),
          current_stock: parseInt(currentStock),
          min_stock_level: parseInt(minStockLevel),
          max_stock_level: parseInt(maxStockLevel),
          supplier_id: supplierId || null,
          expiry_date: expiryDate || null,
          image_url: imageUrl || null,
          description: description || null,
          is_active: true,
          created_by: userId
        }
      ])
      .select(`
        *,
        categories (
          id,
          category_name
        )
      `)
      .single();

    // HANDLE INSERT ERROR
    if (error) {
      logger.error('Error creating product:', error);
      return sendError(res, 500, 'Failed to create product', error.message);
    }

    // LOG SUCCESS
    logger.success('Product created:', product.product_name);

    // ADD CALCULATED METRICS
    const productWithMetrics = calculateProductMetrics(product);

    // SEND SUCCESS RESPONSE
    return sendSuccess(res, 201, 'Product created successfully', {
      product: productWithMetrics
    });

  } catch (error) {
    logger.error('Create product error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/v1/products/:id
 * @access  Private (Admin & Manager)
 * 
 * Allows updating product details
 * Note: For stock changes, use stock adjustment endpoint instead
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;

    // EXTRACT UPDATE DATA from request body
    const {
      productName,
      categoryId,
      barcode,
      unit,
      purchasePrice,
      sellingPrice,
      minStockLevel,
      maxStockLevel,
      supplierId,
      expiryDate,
      imageUrl,
      description
      // Note: currentStock is intentionally NOT included here
      // Stock updates should go through purchase/sale/adjustment endpoints
    } = req.body;

    // CHECK IF PRODUCT EXISTS
    const existingProduct = await checkProductExists(id, businessId);
    if (!existingProduct) {
      return sendError(res, 404, 'Product not found');
    }

    // BUILD UPDATE OBJECT
    // Only include fields that were provided in request
    const updateData = {};
    
    if (productName !== undefined) updateData.product_name = productName;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (unit !== undefined) updateData.unit = unit;
    if (purchasePrice !== undefined) updateData.purchase_price = parseFloat(purchasePrice);
    if (sellingPrice !== undefined) updateData.selling_price = parseFloat(sellingPrice);
    if (minStockLevel !== undefined) updateData.min_stock_level = parseInt(minStockLevel);
    if (maxStockLevel !== undefined) updateData.max_stock_level = parseInt(maxStockLevel);
    if (supplierId !== undefined) updateData.supplier_id = supplierId;
    if (expiryDate !== undefined) updateData.expiry_date = expiryDate;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (description !== undefined) updateData.description = description;

    // CHECK IF THERE'S ANYTHING TO UPDATE
    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, 'No update data provided');
    }

    // PERFORM UPDATE
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select(`
        *,
        categories (
          id,
          category_name
        )
      `)
      .single();

    // HANDLE UPDATE ERROR
    if (error) {
      logger.error('Error updating product:', error);
      return sendError(res, 500, 'Failed to update product', error.message);
    }

    // LOG SUCCESS
    logger.success('Product updated:', product.product_name);

    // ADD CALCULATED METRICS
    const productWithMetrics = calculateProductMetrics(product);

    return sendSuccess(res, 200, 'Product updated successfully', {
      product: productWithMetrics
    });

  } catch (error) {
    logger.error('Update product error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/v1/products/:id
 * @access  Private (Admin only)
 * 
 * Note: This is a SOFT DELETE
 * We set is_active = false instead of actually deleting the record
 * This preserves data integrity and allows recovery
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;

    // CHECK IF PRODUCT EXISTS
    const existingProduct = await checkProductExists(id, businessId);
    if (!existingProduct) {
      return sendError(res, 404, 'Product not found');
    }

    // SOFT DELETE: Set is_active to false
    // We don't actually delete the row from database
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .eq('business_id', businessId);

    if (error) {
      logger.error('Error deleting product:', error);
      return sendError(res, 500, 'Failed to delete product', error.message);
    }

    logger.success('Product deleted (soft):', existingProduct.product_name);

    return sendSuccess(res, 200, 'Product deleted successfully', null);

  } catch (error) {
    logger.error('Delete product error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/v1/products/low-stock
 * @access  Private (Admin & Manager)
 * 
 * Returns products where current_stock < min_stock_level
 */
const getLowStockProducts = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    // QUERY FOR LOW STOCK PRODUCTS
    // We need products where current_stock < min_stock_level
    // Unfortunately, Supabase doesn't support comparing two columns directly
    // So we fetch all products and filter in code (not ideal for large datasets)
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          category_name
        )
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('current_stock', { ascending: true });  // Show lowest stock first

    if (error) {
      logger.error('Error fetching low stock products:', error);
      return sendError(res, 500, 'Failed to fetch low stock products', error.message);
    }

    // FILTER FOR LOW STOCK
    // Keep only products where current_stock < min_stock_level
    const lowStockProducts = products.filter(
      product => product.current_stock < product.min_stock_level
    );

    // ADD CALCULATED METRICS
    const productsWithMetrics = lowStockProducts.map(product => calculateProductMetrics(product));

    return sendSuccess(res, 200, 'Low stock products retrieved successfully', {
      products: productsWithMetrics,
      count: lowStockProducts.length
    });

  } catch (error) {
    logger.error('Get low stock products error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

/**
 * @desc    Get out of stock products
 * @route   GET /api/v1/products/out-of-stock
 * @access  Private (Admin & Manager)
 * 
 * Returns products where current_stock = 0
 */
const getOutOfStockProducts = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    // QUERY FOR OUT OF STOCK PRODUCTS
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          category_name
        )
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .eq('current_stock', 0)  // Products with zero stock
      .order('product_name', { ascending: true });

    if (error) {
      logger.error('Error fetching out of stock products:', error);
      return sendError(res, 500, 'Failed to fetch out of stock products', error.message);
    }

    // ADD CALCULATED METRICS
    const productsWithMetrics = products.map(product => calculateProductMetrics(product));

    return sendSuccess(res, 200, 'Out of stock products retrieved successfully', {
      products: productsWithMetrics,
      count: products.length
    });

  } catch (error) {
    logger.error('Get out of stock products error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

/**
 * @desc    Get overstock products
 * @route   GET /api/v1/products/overstock
 * @access  Private (Admin & Manager)
 * 
 * Returns products where current_stock > max_stock_level
 */
const getOverstockProducts = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    // FETCH ALL ACTIVE PRODUCTS
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          category_name
        )
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('current_stock', { ascending: false });  // Show highest stock first

    if (error) {
      logger.error('Error fetching overstock products:', error);
      return sendError(res, 500, 'Failed to fetch overstock products', error.message);
    }

    // FILTER FOR OVERSTOCK
    const overstockProducts = products.filter(
      product => product.current_stock > product.max_stock_level
    );

    // ADD CALCULATED METRICS
    const productsWithMetrics = overstockProducts.map(product => calculateProductMetrics(product));

    return sendSuccess(res, 200, 'Overstock products retrieved successfully', {
      products: productsWithMetrics,
      count: overstockProducts.length
    });

  } catch (error) {
    logger.error('Get overstock products error:', error);
    return sendError(res, 500, 'Server error', error.message);
  }
};

// EXPORT ALL CONTROLLER FUNCTIONS
module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  getOverstockProducts
};