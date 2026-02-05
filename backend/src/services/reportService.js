const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Report Service
 * Business logic for generating reports
 */

/**
 * Generate stock summary data
 */
const generateStockSummary = async (businessId) => {
    try {
        const { data: products } = await supabase
            .from('products')
            .select(`
        id,
        product_name,
        current_stock,
        min_stock_level,
        max_stock_level,
        purchase_price,
        selling_price
      `)
            .eq('business_id', businessId)
            .eq('is_active', true);

        const summary = {
            totalProducts: products?.length || 0,
            totalStockValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            overstockCount: 0
        };

        products?.forEach(product => {
            summary.totalStockValue += product.current_stock * product.purchase_price;

            if (product.current_stock === 0) {
                summary.outOfStockCount++;
            } else if (product.current_stock < product.min_stock_level) {
                summary.lowStockCount++;
            } else if (product.current_stock > product.max_stock_level) {
                summary.overstockCount++;
            }
        });

        summary.totalStockValue = parseFloat(summary.totalStockValue.toFixed(2));

        return summary;
    } catch (error) {
        logger.error('Generate stock summary error:', error);
        return null;
    }
};

/**
 * Generate sales analytics
 */
const generateSalesAnalytics = async (businessId, startDate, endDate) => {
    try {
        const { data: bills } = await supabase
            .from('bills')
            .select(`
        total_amount,
        discount_amount,
        tax_amount,
        payment_method,
        bill_items (
          product_name,
          quantity,
          total
        )
      `)
            .eq('business_id', businessId)
            .gte('bill_date', startDate)
            .lte('bill_date', endDate);

        const analytics = {
            totalRevenue: 0,
            totalDiscount: 0,
            totalTax: 0,
            billCount: bills?.length || 0,
            paymentMethods: {},
            topProducts: []
        };

        const productSales = {};

        bills?.forEach(bill => {
            analytics.totalRevenue += parseFloat(bill.total_amount);
            analytics.totalDiscount += parseFloat(bill.discount_amount || 0);
            analytics.totalTax += parseFloat(bill.tax_amount || 0);

            // Payment method breakdown
            if (!analytics.paymentMethods[bill.payment_method]) {
                analytics.paymentMethods[bill.payment_method] = 0;
            }
            analytics.paymentMethods[bill.payment_method] += parseFloat(bill.total_amount);

            // Top products
            bill.bill_items?.forEach(item => {
                if (!productSales[item.product_name]) {
                    productSales[item.product_name] = { quantity: 0, revenue: 0 };
                }
                productSales[item.product_name].quantity += item.quantity;
                productSales[item.product_name].revenue += parseFloat(item.total);
            });
        });

        // Format top products
        analytics.topProducts = Object.entries(productSales)
            .map(([name, data]) => ({
                productName: name,
                quantity: data.quantity,
                revenue: parseFloat(data.revenue.toFixed(2))
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        analytics.totalRevenue = parseFloat(analytics.totalRevenue.toFixed(2));
        analytics.totalDiscount = parseFloat(analytics.totalDiscount.toFixed(2));
        analytics.totalTax = parseFloat(analytics.totalTax.toFixed(2));
        analytics.averageBillValue = parseFloat((analytics.totalRevenue / analytics.billCount || 0).toFixed(2));

        return analytics;
    } catch (error) {
        logger.error('Generate sales analytics error:', error);
        return null;
    }
};

/**
 * Calculate profit/loss
 */
const calculateProfitLoss = async (businessId, startDate, endDate) => {
    try {
        const { data: bills } = await supabase
            .from('bills')
            .select(`
        total_amount,
        bill_items (
          quantity,
          unit_price,
          products (
            purchase_price
          )
        )
      `)
            .eq('business_id', businessId)
            .gte('bill_date', startDate)
            .lte('bill_date', endDate);

        let totalRevenue = 0;
        let totalCost = 0;

        bills?.forEach(bill => {
            totalRevenue += parseFloat(bill.total_amount);

            bill.bill_items?.forEach(item => {
                const cost = item.quantity * (item.products?.purchase_price || 0);
                totalCost += cost;
            });
        });

        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            profitMargin: parseFloat(profitMargin.toFixed(2))
        };
    } catch (error) {
        logger.error('Calculate profit/loss error:', error);
        return null;
    }
};

module.exports = {
    generateStockSummary,
    generateSalesAnalytics,
    calculateProfitLoss
};
