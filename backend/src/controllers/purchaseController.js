const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * @desc    Get all purchases
 * @route   GET /api/v1/purchases
 * @access  Private
 */
const getAllPurchases = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { page = 1, limit = 20, search, startDate, endDate } = req.query;

        let query = supabase
            .from('purchases')
            .select(`
        *,
        suppliers (
          id,
          supplier_name,
          phone
        ),
        users!purchases_created_by_fkey (
          id,
          full_name
        ),
        purchase_items (
          id,
          quantity
        )
      `, { count: 'exact' })
            .eq('business_id', businessId)
            .order('purchase_date', { ascending: false });

        if (search) {
            query = query.or(`invoice_number.ilike.%${search}%`);
        }

        if (startDate) {
            query = query.gte('purchase_date', startDate);
        }

        if (endDate) {
            query = query.lte('purchase_date', endDate);
        }

        const offset = (page - 1) * limit;
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: rawPurchases, error, count } = await query;

        if (error) {
            logger.error('Error fetching purchases:', error);
            return sendError(res, 500, 'Failed to fetch purchases', error.message);
        }

        // Transform data to include total_quantity sum (Sum of all item quantities)
        const purchases = rawPurchases.map(p => ({
            ...p,
            // Calculate sum of quantities if items exist, otherwise 0
            total_items: p.purchase_items
                ? p.purchase_items.reduce((sum, item) => sum + (item.quantity || 0), 0)
                : 0
        }));

        return sendSuccess(res, 200, 'Purchases retrieved successfully', {
            purchases,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        logger.error('Get purchases error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get single purchase by ID
 * @route   GET /api/v1/purchases/:id
 * @access  Private
 */
const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { data: purchase, error } = await supabase
            .from('purchases')
            .select(`
        *,
        suppliers (
          id,
          supplier_name,
          phone,
          email,
          address
        ),
        users!purchases_created_by_fkey (
          id,
          full_name
        ),
        purchase_items (
          id,
          product_id,
          quantity,
          purchase_price,
          subtotal,
          products (
            id,
            product_name,
            sku,
            unit
          )
        )
      `)
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (error || !purchase) {
            return sendError(res, 404, 'Purchase not found');
        }

        return sendSuccess(res, 200, 'Purchase retrieved successfully', { purchase });

    } catch (error) {
        logger.error('Get purchase error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Create new purchase (with automatic stock addition)
 * @route   POST /api/v1/purchases
 * @access  Private
 */
const createPurchase = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const userId = req.user.userId;
        const {
            supplierId,
            invoiceNumber,
            purchaseDate,
            items, // Array of { productId, quantity, purchasePrice }
            paymentStatus = 'pending',
            notes
        } = req.body;

        logger.info(`Creating purchase with Invoice: ${invoiceNumber}, Items: ${items?.length}`);

        // Validation
        if (!items || items.length === 0) {
            return sendError(res, 400, 'Please provide at least one item');
        }

        if (!invoiceNumber) {
            return sendError(res, 400, 'Please provide invoice number');
        }

        // Check if invoice number already exists
        const { data: existingPurchase, error: checkError } = await supabase
            .from('purchases')
            .select('id')
            .eq('business_id', businessId)
            .eq('invoice_number', invoiceNumber)
            .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

        if (checkError) {
            logger.error('Error checking invoice number:', checkError);
            return sendError(res, 500, 'Error checking invoice uniqueness');
        }

        if (existingPurchase) {
            return sendError(res, 400, 'Invoice number already exists');
        }

        // Calculate total and prepare items
        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const { productId, quantity, purchasePrice } = item;

            // Validate product exists
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('id, product_name')
                .eq('id', productId)
                .eq('business_id', businessId)
                .single();

            if (productError || !product) {
                return sendError(res, 404, `Product with ID ${productId} not found`);
            }

            const subtotal = quantity * purchasePrice;
            totalAmount += subtotal;

            processedItems.push({
                product_id: productId,
                quantity,
                purchase_price: purchasePrice,
                subtotal
            });
        }

        // Create purchase
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert([{
                business_id: businessId,
                supplier_id: supplierId || null,
                invoice_number: invoiceNumber,
                purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
                total_amount: totalAmount,
                payment_status: paymentStatus,
                notes: notes || null,
                created_by: userId
            }])
            .select()
            .single();

        if (purchaseError) {
            logger.error('Error creating purchase:', purchaseError);
            return sendError(res, 500, 'Failed to create purchase', purchaseError.message);
        }

        // Insert purchase items
        const purchaseItemsWithPurchaseId = processedItems.map(item => ({
            ...item,
            purchase_id: purchase.id
        }));

        const { error: itemsError } = await supabase
            .from('purchase_items')
            .insert(purchaseItemsWithPurchaseId);

        if (itemsError) {
            // Rollback: Delete purchase if items insertion fails
            await supabase.from('purchases').delete().eq('id', purchase.id);
            logger.error('Error creating purchase items:', itemsError);
            return sendError(res, 500, 'Failed to create purchase items', itemsError.message);
        }

        // Update stock for each product (Standard Fetch-Update Pattern)
        for (const item of items) {
            const { productId, quantity } = item;

            // Fetch current stock
            const { data: product } = await supabase
                .from('products')
                .select('current_stock')
                .eq('id', productId)
                .eq('business_id', businessId)
                .single();

            if (product) {
                const newStock = (product.current_stock || 0) + parseInt(quantity);

                const { error: stockError } = await supabase
                    .from('products')
                    .update({ current_stock: newStock })
                    .eq('id', productId)
                    .eq('business_id', businessId);

                if (stockError) {
                    logger.error(`Error updating stock for product ${productId}:`, stockError);
                }
            }
        }

        logger.success('Purchase created successfully:', invoiceNumber);

        return sendSuccess(res, 201, 'Purchase created successfully', {
            purchase: {
                ...purchase,
                items: purchaseItemsWithPurchaseId
            }
        });

    } catch (error) {
        logger.error('Create purchase error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Update purchase
 * @route   PUT /api/v1/purchases/:id
 * @access  Private
 */
const updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;
        const { paymentStatus, notes } = req.body;

        const updateData = {};
        if (paymentStatus) updateData.payment_status = paymentStatus;
        if (notes !== undefined) updateData.notes = notes;

        const { data: purchase, error } = await supabase
            .from('purchases')
            .update(updateData)
            .eq('id', id)
            .eq('business_id', businessId)
            .select()
            .single();

        if (error) {
            logger.error('Error updating purchase:', error);
            return sendError(res, 500, 'Failed to update purchase', error.message);
        }

        return sendSuccess(res, 200, 'Purchase updated successfully', { purchase });

    } catch (error) {
        logger.error('Update purchase error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Delete purchase (Admin only)
 * @route   DELETE /api/v1/purchases/:id
 * @access  Private (Admin only)
 */
const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        const { error } = await supabase
            .from('purchases')
            .delete()
            .eq('id', id)
            .eq('business_id', businessId);

        if (error) {
            logger.error('Error deleting purchase:', error);
            return sendError(res, 500, 'Failed to delete purchase', error.message);
        }

        logger.success('Purchase deleted:', id);

        return sendSuccess(res, 200, 'Purchase deleted successfully', null);

    } catch (error) {
        logger.error('Delete purchase error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
};
