const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Sale Service
 * Business logic for sales/billing operations
 */

/**
 * Calculate bill totals
 */
const calculateBillTotals = (items, billDiscountPercentage = 0, billTaxPercentage = 0) => {
    let subtotal = 0;
    const processedItems = [];

    items.forEach(item => {
        const { productId, productName, quantity, unitPrice, discountPercentage = 0, taxPercentage = 0 } = item;

        // Calculate item-level totals
        const itemSubtotal = quantity * unitPrice;
        const itemDiscountAmount = (itemSubtotal * discountPercentage) / 100;
        const itemTaxableAmount = itemSubtotal - itemDiscountAmount;
        const itemTaxAmount = (itemTaxableAmount * taxPercentage) / 100;
        const itemTotal = itemTaxableAmount + itemTaxAmount;

        subtotal += itemSubtotal;

        processedItems.push({
            product_id: productId,
            product_name: productName,
            quantity,
            unit_price: unitPrice,
            discount_percentage: discountPercentage,
            discount_amount: parseFloat(itemDiscountAmount.toFixed(2)),
            tax_percentage: taxPercentage,
            tax_amount: parseFloat(itemTaxAmount.toFixed(2)),
            subtotal: parseFloat(itemSubtotal.toFixed(2)),
            total: parseFloat(itemTotal.toFixed(2))
        });
    });

    // Calculate bill-level totals
    const billDiscountAmount = (subtotal * billDiscountPercentage) / 100;
    const taxableAmount = subtotal - billDiscountAmount;
    const billTaxAmount = (taxableAmount * billTaxPercentage) / 100;
    const totalAmount = taxableAmount + billTaxAmount;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discountAmount: parseFloat(billDiscountAmount.toFixed(2)),
        taxAmount: parseFloat(billTaxAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        processedItems
    };
};

/**
 * Validate stock availability for sale
 */
const validateStockAvailability = async (businessId, items) => {
    const errors = [];

    for (const item of items) {
        const { productId, quantity } = item;

        const { data: product } = await supabase
            .from('products')
            .select('product_name, current_stock')
            .eq('id', productId)
            .eq('business_id', businessId)
            .single();

        if (!product) {
            errors.push(`Product ${productId} not found`);
            continue;
        }

        if (product.current_stock < quantity) {
            errors.push(`Insufficient stock for ${product.product_name}. Available: ${product.current_stock}, Requested: ${quantity}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Update product stock after sale
 */
const updateStockAfterSale = async (items) => {
    try {
        for (const item of items) {
            const { productId, quantity } = item;

            // Get current stock
            const { data: product } = await supabase
                .from('products')
                .select('current_stock, business_id')
                .eq('id', productId)
                .single();

            if (product) {
                const newStock = product.current_stock - quantity;

                // Update stock
                await supabase
                    .from('products')
                    .update({
                        current_stock: newStock
                    })
                    .eq('id', productId);

                logger.info(`Stock updated for product ${productId}: -${quantity} (New: ${newStock})`);

                // Check if alerts need to be generated
                // This would typically be handled by database triggers
                // but we can also call the alert service here if needed
            }
        }
        return { success: true };
    } catch (error) {
        logger.error('Update stock after sale error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate bill number
 */
const generateBillNumber = async (businessId, billPrefix = 'INV') => {
    try {
        const { count } = await supabase
            .from('bills')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId);

        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        const billNumber = `${billPrefix}-${yearMonth}-${String((count || 0) + 1).padStart(4, '0')}`;

        return billNumber;
    } catch (error) {
        logger.error('Generate bill number error:', error);
        return `${billPrefix}-${Date.now()}`;
    }
};

module.exports = {
    calculateBillTotals,
    validateStockAvailability,
    updateStockAfterSale,
    generateBillNumber
};
