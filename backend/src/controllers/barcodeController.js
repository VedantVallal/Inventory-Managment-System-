const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * BARCODE CONTROLLER
 * 
 * Handles barcode-based inventory operations:
 * - Product lookup by barcode
 * - Barcode-based purchases (add stock)
 * - Barcode-based sales (reduce stock)
 * 
 * All operations are atomic and prevent race conditions
 */

/**
 * @desc    Get product by barcode
 * @route   GET /api/v1/barcode/product/:barcode
 * @access  Private
 */
const getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        const businessId = req.user.businessId;

        // Validate barcode
        if (!barcode || barcode.trim() === '') {
            return sendError(res, 400, 'Barcode is required');
        }

        // Fetch product with related data
        const { data: product, error } = await supabase
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
      `)
            .eq('barcode', barcode.trim())
            .eq('business_id', businessId)
            .eq('is_active', true)
            .single();

        if (error || !product) {
            logger.warn(`Product not found for barcode: ${barcode}`);
            return sendError(res, 404, 'Product not found with this barcode');
        }

        logger.info(`Product found: ${product.product_name} (Barcode: ${barcode})`);

        return sendSuccess(res, 200, 'Product retrieved successfully', {
            product
        });

    } catch (error) {
        logger.error('Get product by barcode error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Create purchase using barcode (increases stock)
 * @route   POST /api/v1/barcode/purchase
 * @access  Private
 */
const barcodePurchase = async (req, res) => {
    try {
        const { barcode, quantity, purchasePrice, supplierId, notes } = req.body;
        const businessId = req.user.businessId;
        const userId = req.user.userId;

        // Validate inputs
        if (!barcode || barcode.trim() === '') {
            return sendError(res, 400, 'Barcode is required');
        }

        if (!quantity || quantity <= 0) {
            return sendError(res, 400, 'Quantity must be a positive number');
        }

        if (!purchasePrice || purchasePrice < 0) {
            return sendError(res, 400, 'Purchase price must be a non-negative number');
        }

        // First, get the product to verify it exists
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, product_name, current_stock, barcode')
            .eq('barcode', barcode.trim())
            .eq('business_id', businessId)
            .eq('is_active', true)
            .single();

        if (productError || !product) {
            logger.warn(`Product not found for barcode: ${barcode}`);
            return sendError(res, 404, 'Product not found with this barcode');
        }

        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert([{
                business_id: businessId,
                product_id: product.id,
                supplier_id: supplierId || null,
                quantity: parseInt(quantity),
                purchase_price: parseFloat(purchasePrice),
                total_amount: parseFloat(purchasePrice) * parseInt(quantity),
                purchase_date: new Date().toISOString(),
                notes: notes || null,
                created_by: userId
            }])
            .select()
            .single();

        if (purchaseError) {
            logger.error('Error creating purchase record:', purchaseError);
            return sendError(res, 500, 'Failed to create purchase record', purchaseError.message);
        }

        // Atomically increment stock
        const { data: updatedProduct, error: updateError } = await supabase
            .rpc('increment_product_stock', {
                p_product_id: product.id,
                p_quantity: parseInt(quantity)
            });

        if (updateError) {
            // Rollback: Delete the purchase record
            await supabase.from('purchases').delete().eq('id', purchase.id);
            logger.error('Error updating stock:', updateError);
            return sendError(res, 500, 'Failed to update stock', updateError.message);
        }

        logger.success(`Purchase completed: ${product.product_name} (+${quantity} units)`);

        return sendSuccess(res, 201, 'Purchase completed successfully', {
            purchase,
            product: {
                id: product.id,
                name: product.product_name,
                barcode: product.barcode,
                previousStock: product.current_stock,
                newStock: product.current_stock + parseInt(quantity),
                quantityAdded: parseInt(quantity)
            }
        });

    } catch (error) {
        logger.error('Barcode purchase error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Create sale using barcode (decreases stock)
 * @route   POST /api/v1/barcode/sale
 * @access  Private
 */
const barcodeSale = async (req, res) => {
    try {
        const { barcode, quantity, customerId, paymentMethod, discount } = req.body;
        const businessId = req.user.businessId;
        const userId = req.user.userId;

        // Validate inputs
        if (!barcode || barcode.trim() === '') {
            return sendError(res, 400, 'Barcode is required');
        }

        if (!quantity || quantity <= 0) {
            return sendError(res, 400, 'Quantity must be a positive number');
        }

        if (!paymentMethod) {
            return sendError(res, 400, 'Payment method is required');
        }

        // Get the product and check stock
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, product_name, current_stock, selling_price, barcode')
            .eq('barcode', barcode.trim())
            .eq('business_id', businessId)
            .eq('is_active', true)
            .single();

        if (productError || !product) {
            logger.warn(`Product not found for barcode: ${barcode}`);
            return sendError(res, 404, 'Product not found with this barcode');
        }

        // Check stock availability
        if (product.current_stock < quantity) {
            logger.warn(`Insufficient stock for ${product.product_name}: Available ${product.current_stock}, Requested ${quantity}`);
            return sendError(res, 400, `Insufficient stock. Available: ${product.current_stock} units`);
        }

        // Calculate amounts
        const subtotal = parseFloat(product.selling_price) * parseInt(quantity);
        const discountAmount = discount ? parseFloat(discount) : 0;
        const totalAmount = subtotal - discountAmount;

        // Generate bill number
        const billNumber = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create bill record
        const { data: bill, error: billError } = await supabase
            .from('bills')
            .insert([{
                business_id: businessId,
                bill_number: billNumber,
                customer_id: customerId || null,
                bill_date: new Date().toISOString(),
                subtotal: subtotal,
                discount: discountAmount,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                payment_status: 'paid',
                created_by: userId
            }])
            .select()
            .single();

        if (billError) {
            logger.error('Error creating bill:', billError);
            return sendError(res, 500, 'Failed to create bill', billError.message);
        }

        // Create bill item
        const { error: billItemError } = await supabase
            .from('bill_items')
            .insert([{
                bill_id: bill.id,
                product_id: product.id,
                quantity: parseInt(quantity),
                unit_price: parseFloat(product.selling_price),
                total_price: subtotal
            }]);

        if (billItemError) {
            // Rollback: Delete the bill
            await supabase.from('bills').delete().eq('id', bill.id);
            logger.error('Error creating bill item:', billItemError);
            return sendError(res, 500, 'Failed to create bill item', billItemError.message);
        }

        // Atomically decrement stock
        const { data: updatedProduct, error: updateError } = await supabase
            .rpc('decrement_product_stock', {
                p_product_id: product.id,
                p_quantity: parseInt(quantity)
            });

        if (updateError) {
            // Rollback: Delete bill and bill items
            await supabase.from('bill_items').delete().eq('bill_id', bill.id);
            await supabase.from('bills').delete().eq('id', bill.id);
            logger.error('Error updating stock:', updateError);
            return sendError(res, 500, 'Failed to update stock', updateError.message);
        }

        logger.success(`Sale completed: ${product.product_name} (-${quantity} units)`);

        return sendSuccess(res, 201, 'Sale completed successfully', {
            bill: {
                id: bill.id,
                billNumber: bill.bill_number,
                totalAmount: bill.total_amount,
                paymentMethod: bill.payment_method
            },
            product: {
                id: product.id,
                name: product.product_name,
                barcode: product.barcode,
                previousStock: product.current_stock,
                newStock: product.current_stock - parseInt(quantity),
                quantitySold: parseInt(quantity)
            }
        });

    } catch (error) {
        logger.error('Barcode sale error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getProductByBarcode,
    barcodePurchase,
    barcodeSale
};
