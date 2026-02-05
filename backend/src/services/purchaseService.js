const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Purchase Service
 * Business logic for purchase operations
 */

/**
 * Calculate purchase totals
 */
const calculatePurchaseTotals = (items) => {
    let totalAmount = 0;
    const processedItems = [];

    items.forEach(item => {
        const { productId, quantity, purchasePrice } = item;
        const subtotal = quantity * purchasePrice;
        totalAmount += subtotal;

        processedItems.push({
            product_id: productId,
            quantity,
            purchase_price: purchasePrice,
            subtotal
        });
    });

    return {
        totalAmount,
        processedItems
    };
};

/**
 * Update product stock after purchase
 */
const updateStockAfterPurchase = async (items) => {
    try {
        for (const item of items) {
            const { productId, quantity } = item;

            // Get current stock
            const { data: product } = await supabase
                .from('products')
                .select('current_stock')
                .eq('id', productId)
                .single();

            if (product) {
                // Update stock
                await supabase
                    .from('products')
                    .update({
                        current_stock: product.current_stock + quantity
                    })
                    .eq('id', productId);

                logger.info(`Stock updated for product ${productId}: +${quantity}`);
            }
        }
        return { success: true };
    } catch (error) {
        logger.error('Update stock after purchase error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Validate purchase data
 */
const validatePurchaseData = async (businessId, items) => {
    const errors = [];

    for (const item of items) {
        const { productId, quantity, purchasePrice } = item;

        if (!productId || !quantity || !purchasePrice) {
            errors.push('Each item must have productId, quantity, and purchasePrice');
            continue;
        }

        if (quantity <= 0) {
            errors.push(`Invalid quantity for product ${productId}`);
        }

        if (purchasePrice < 0) {
            errors.push(`Invalid purchase price for product ${productId}`);
        }

        // Check if product exists
        const { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .eq('business_id', businessId)
            .single();

        if (!product) {
            errors.push(`Product ${productId} not found`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    calculatePurchaseTotals,
    updateStockAfterPurchase,
    validatePurchaseData
};
