const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Alert Service
 * Handles alert generation and management
 */

/**
 * Generate low stock alert
 */
const generateLowStockAlert = async (businessId, productId, productName, currentStock, minStockLevel) => {
    try {
        const message = `Product "${productName}" is running low. Current stock: ${currentStock}, Minimum required: ${minStockLevel}`;

        const { data, error } = await supabase
            .from('alerts')
            .insert([{
                business_id: businessId,
                product_id: productId,
                alert_type: 'low_stock',
                message,
                is_read: false,
                is_resolved: false
            }])
            .select()
            .single();

        if (error) {
            logger.error('Error generating low stock alert:', error);
            return null;
        }

        logger.info(`Low stock alert generated for product: ${productName}`);
        return data;
    } catch (error) {
        logger.error('Generate low stock alert error:', error);
        return null;
    }
};

/**
 * Generate out of stock alert
 */
const generateOutOfStockAlert = async (businessId, productId, productName) => {
    try {
        const message = `Product "${productName}" is out of stock!`;

        const { data, error } = await supabase
            .from('alerts')
            .insert([{
                business_id: businessId,
                product_id: productId,
                alert_type: 'out_of_stock',
                message,
                is_read: false,
                is_resolved: false
            }])
            .select()
            .single();

        if (error) {
            logger.error('Error generating out of stock alert:', error);
            return null;
        }

        logger.info(`Out of stock alert generated for product: ${productName}`);
        return data;
    } catch (error) {
        logger.error('Generate out of stock alert error:', error);
        return null;
    }
};

/**
 * Generate overstock alert
 */
const generateOverstockAlert = async (businessId, productId, productName, currentStock, maxStockLevel) => {
    try {
        const message = `Product "${productName}" is overstocked. Current stock: ${currentStock}, Maximum limit: ${maxStockLevel}`;

        const { data, error } = await supabase
            .from('alerts')
            .insert([{
                business_id: businessId,
                product_id: productId,
                alert_type: 'overstock',
                message,
                is_read: false,
                is_resolved: false
            }])
            .select()
            .single();

        if (error) {
            logger.error('Error generating overstock alert:', error);
            return null;
        }

        logger.info(`Overstock alert generated for product: ${productName}`);
        return data;
    } catch (error) {
        logger.error('Generate overstock alert error:', error);
        return null;
    }
};

/**
 * Check and generate alerts for a product after stock change
 */
const checkAndGenerateAlerts = async (businessId, productId) => {
    try {
        // Get product details
        const { data: product, error } = await supabase
            .from('products')
            .select('product_name, current_stock, min_stock_level, max_stock_level')
            .eq('id', productId)
            .eq('business_id', businessId)
            .single();

        if (error || !product) {
            return;
        }

        // Check for out of stock
        if (product.current_stock === 0) {
            await generateOutOfStockAlert(businessId, productId, product.product_name);
        }
        // Check for low stock
        else if (product.current_stock < product.min_stock_level) {
            await generateLowStockAlert(businessId, productId, product.product_name, product.current_stock, product.min_stock_level);
        }
        // Check for overstock
        else if (product.current_stock > product.max_stock_level) {
            await generateOverstockAlert(businessId, productId, product.product_name, product.current_stock, product.max_stock_level);
        }
    } catch (error) {
        logger.error('Check and generate alerts error:', error);
    }
};

/**
 * Clear resolved alerts for a product
 */
const clearResolvedAlerts = async (businessId, productId) => {
    try {
        await supabase
            .from('alerts')
            .update({ is_resolved: true, is_read: true })
            .eq('business_id', businessId)
            .eq('product_id', productId)
            .eq('is_resolved', false);
    } catch (error) {
        logger.error('Clear resolved alerts error:', error);
    }
};

module.exports = {
    generateLowStockAlert,
    generateOutOfStockAlert,
    generateOverstockAlert,
    checkAndGenerateAlerts,
    clearResolvedAlerts
};
