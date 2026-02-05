const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * @desc    Get stock summary report
 * @route   GET /api/v1/reports/stock-summary
 * @access  Private
 */
const getStockSummaryReport = async (req, res) => {
    try {
        const businessId = req.user.businessId;

        const { data: products, error } = await supabase
            .from('products')
            .select(`
        id,
        product_name,
        sku,
        category_id,
        current_stock,
        min_stock_level,
        max_stock_level,
        purchase_price,
        selling_price,
        unit,
        categories (
          category_name
        )
      `)
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('product_name', { ascending: true });

        if (error) {
            logger.error('Error fetching stock summary:', error);
            return sendError(res, 500, 'Failed to fetch stock summary', error.message);
        }

        // Calculate stock status and value for each product
        const reportData = products.map(product => {
            let status = 'In Stock';
            if (product.current_stock === 0) {
                status = 'Out of Stock';
            } else if (product.current_stock < product.min_stock_level) {
                status = 'Low Stock';
            } else if (product.current_stock > product.max_stock_level) {
                status = 'Overstock';
            }

            const stockValue = product.current_stock * product.purchase_price;

            return {
                ...product,
                status,
                stockValue: parseFloat(stockValue.toFixed(2)),
                categoryName: product.categories?.category_name || 'Uncategorized'
            };
        });

        // Calculate totals
        const totalStockValue = reportData.reduce((sum, p) => sum + p.stockValue, 0);
        const totalProducts = reportData.length;
        const lowStockCount = reportData.filter(p => p.status === 'Low Stock').length;
        const outOfStockCount = reportData.filter(p => p.status === 'Out of Stock').length;

        return sendSuccess(res, 200, 'Stock summary retrieved successfully', {
            products: reportData,
            summary: {
                totalProducts,
                totalStockValue: parseFloat(totalStockValue.toFixed(2)),
                lowStockCount,
                outOfStockCount
            }
        });

    } catch (error) {
        logger.error('Stock summary error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get sales report
 * @route   GET /api/v1/reports/sales
 * @access  Private
 */
const getSalesReport = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return sendError(res, 400, 'Please provide start date and end date');
        }

        const { data: bills, error } = await supabase
            .from('bills')
            .select(`
        id,
        bill_number,
        bill_date,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        payment_method,
        payment_status,
        customers (
          customer_name
        ),
        bill_items (
          product_name,
          quantity,
          unit_price,
          total
        )
      `)
            .eq('business_id', businessId)
            .gte('bill_date', startDate)
            .lte('bill_date', endDate)
            .order('bill_date', { ascending: false });

        if (error) {
            logger.error('Error fetching sales report:', error);
            return sendError(res, 500, 'Failed to fetch sales report', error.message);
        }

        // Calculate summary
        const totalSales = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
        const totalDiscount = bills.reduce((sum, bill) => sum + parseFloat(bill.discount_amount || 0), 0);
        const totalTax = bills.reduce((sum, bill) => sum + parseFloat(bill.tax_amount || 0), 0);
        const totalBills = bills.length;

        // Count by payment method
        const paymentMethodBreakdown = bills.reduce((acc, bill) => {
            acc[bill.payment_method] = (acc[bill.payment_method] || 0) + parseFloat(bill.total_amount);
            return acc;
        }, {});

        // Top selling products
        const productSales = {};
        bills.forEach(bill => {
            bill.bill_items?.forEach(item => {
                if (!productSales[item.product_name]) {
                    productSales[item.product_name] = { quantity: 0, revenue: 0 };
                }
                productSales[item.product_name].quantity += item.quantity;
                productSales[item.product_name].revenue += parseFloat(item.total);
            });
        });

        const topProducts = Object.entries(productSales)
            .map(([name, data]) => ({ productName: name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return sendSuccess(res, 200, 'Sales report retrieved successfully', {
            bills,
            summary: {
                totalSales: parseFloat(totalSales.toFixed(2)),
                totalDiscount: parseFloat(totalDiscount.toFixed(2)),
                totalTax: parseFloat(totalTax.toFixed(2)),
                totalBills,
                averageBillValue: parseFloat((totalSales / totalBills || 0).toFixed(2)),
                paymentMethodBreakdown,
                topProducts
            }
        });

    } catch (error) {
        logger.error('Sales report error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get purchase report
 * @route   GET /api/v1/reports/purchases
 * @access  Private
 */
const getPurchaseReport = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return sendError(res, 400, 'Please provide start date and end date');
        }

        const { data: purchases, error } = await supabase
            .from('purchases')
            .select(`
        id,
        invoice_number,
        purchase_date,
        total_amount,
        payment_status,
        suppliers (
          supplier_name
        ),
        purchase_items (
          quantity,
          purchase_price,
          subtotal,
          products (
            product_name
          )
        )
      `)
            .eq('business_id', businessId)
            .gte('purchase_date', startDate)
            .lte('purchase_date', endDate)
            .order('purchase_date', { ascending: false });

        if (error) {
            logger.error('Error fetching purchase report:', error);
            return sendError(res, 500, 'Failed to fetch purchase report', error.message);
        }

        const totalPurchases = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount), 0);
        const totalOrders = purchases.length;

        return sendSuccess(res, 200, 'Purchase report retrieved successfully', {
            purchases,
            summary: {
                totalPurchases: parseFloat(totalPurchases.toFixed(2)),
                totalOrders,
                averageOrderValue: parseFloat((totalPurchases / totalOrders || 0).toFixed(2))
            }
        });

    } catch (error) {
        logger.error('Purchase report error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get profit/loss report (Admin only)
 * @route   GET /api/v1/reports/profit-loss
 * @access  Private (Admin only)
 */
const getProfitLossReport = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return sendError(res, 400, 'Please provide start date and end date');
        }

        // Get sales with items
        const { data: bills } = await supabase
            .from('bills')
            .select(`
        total_amount,
        bill_items (
          product_id,
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

        return sendSuccess(res, 200, 'Profit/Loss report retrieved successfully', {
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            profitMargin: parseFloat(profitMargin.toFixed(2))
        });

    } catch (error) {
        logger.error('Profit/Loss report error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getStockSummaryReport,
    getSalesReport,
    getPurchaseReport,
    getProfitLossReport
};
