const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * @desc    Get dashboard metrics
 * @route   GET /api/v1/dashboard/metrics
 * @access  Private
 */
const getDashboardMetrics = async (req, res) => {
    try {
        const businessId = req.user.businessId;

        // Get total products count
        const { count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('is_active', true);

        // Get low stock items count
        const { data: lowStockProducts } = await supabase
            .from('products')
            .select('id, current_stock, min_stock_level')
            .eq('business_id', businessId)
            .eq('is_active', true);

        const lowStockCount = lowStockProducts?.filter(p => p.current_stock < p.min_stock_level).length || 0;
        const outOfStockCount = lowStockProducts?.filter(p => p.current_stock === 0).length || 0;

        // Get total stock value
        const { data: products } = await supabase
            .from('products')
            .select('current_stock, purchase_price')
            .eq('business_id', businessId)
            .eq('is_active', true);

        const totalStockValue = products?.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0) || 0;

        // Get today's sales
        const today = new Date().toISOString().split('T')[0];
        const { data: todayBills } = await supabase
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
            .eq('bill_date', today);

        const todaysSalesAmount = todayBills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0;
        const todaysSalesCount = todayBills?.length || 0;

        // Calculate today's profit (selling price - purchase price)
        let todaysProfit = 0;
        todayBills?.forEach(bill => {
            bill.bill_items?.forEach(item => {
                const sellingPrice = parseFloat(item.unit_price) * parseInt(item.quantity);
                const purchasePrice = parseFloat(item.products?.purchase_price || 0) * parseInt(item.quantity);
                todaysProfit += (sellingPrice - purchasePrice);
            });
        });

        // Get yesterday's sales for comparison
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        const { data: yesterdayBills } = await supabase
            .from('bills')
            .select('total_amount')
            .eq('business_id', businessId)
            .eq('bill_date', yesterdayDate);

        const yesterdaysSalesAmount = yesterdayBills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0;

        // Calculate sales trend
        let salesTrend = 0;
        if (yesterdaysSalesAmount > 0) {
            salesTrend = ((todaysSalesAmount - yesterdaysSalesAmount) / yesterdaysSalesAmount) * 100;
        } else if (todaysSalesAmount > 0) {
            salesTrend = 100; // 100% increase if yesterday was 0
        }

        // Get this month's sales
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const { data: monthSales } = await supabase
            .from('bills')
            .select('total_amount')
            .eq('business_id', businessId)
            .gte('bill_date', firstDayOfMonth);

        const monthSalesAmount = monthSales?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0;

        // Calculate inventory breakdown
        const inStockCount = lowStockProducts?.filter(p => p.current_stock > p.min_stock_level).length || 0;

        // Get total customers
        const { count: totalCustomers } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        // Get total suppliers
        const { count: totalSuppliers } = await supabase
            .from('suppliers')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId);

        // Get unread alerts count
        const { count: unreadAlerts } = await supabase
            .from('alerts')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('is_read', false);

        return sendSuccess(res, 200, 'Dashboard metrics retrieved successfully', {
            // Product metrics
            totalProducts: totalProducts || 0,
            inStockCount,
            lowStockAlerts: lowStockCount,
            outOfStockCount,
            totalStockValue: parseFloat(totalStockValue.toFixed(2)),

            // Sales metrics
            todaySales: parseFloat(todaysSalesAmount.toFixed(2)),
            todaysProfit: parseFloat(todaysProfit.toFixed(2)),
            todaysSalesCount,
            yesterdaysSales: parseFloat(yesterdaysSalesAmount.toFixed(2)),
            salesTrend: parseFloat(salesTrend.toFixed(2)),

            // Monthly metrics
            monthSales: parseFloat(monthSalesAmount.toFixed(2)),

            // Other metrics
            totalCustomers: totalCustomers || 0,
            totalSuppliers: totalSuppliers || 0,
            unreadAlerts: unreadAlerts || 0
        });

    } catch (error) {
        logger.error('Dashboard metrics error:', error);
        return sendError(res, 500, 'Failed to fetch dashboard metrics', error.message);
    }
};

/**
 * @desc    Get recent activities
 * @route   GET /api/v1/dashboard/activities
 * @access  Private
 */
const getRecentActivities = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { limit = 10 } = req.query;

        const { data: activities, error } = await supabase
            .from('activity_logs')
            .select(`
        id,
        action,
        entity_type,
        description,
        created_at,
        users (
          id,
          full_name
        )
      `)
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) {
            logger.error('Error fetching activities:', error);
            return sendError(res, 500, 'Failed to fetch activities', error.message);
        }

        return sendSuccess(res, 200, 'Activities retrieved successfully', activities || []);

    } catch (error) {
        logger.error('Recent activities error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

/**
 * @desc    Get sales chart data (last 7 days)
 * @route   GET /api/v1/dashboard/sales-chart
 * @access  Private
 */
const getSalesChartData = async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data: sales, error } = await supabase
            .from('bills')
            .select('bill_date, total_amount')
            .eq('business_id', businessId)
            .gte('bill_date', startDateStr)
            .order('bill_date', { ascending: true });

        if (error) {
            logger.error('Error fetching sales chart data:', error);
            return sendError(res, 500, 'Failed to fetch sales data', error.message);
        }

        // Group by date
        const chartData = {};
        sales?.forEach(sale => {
            const date = sale.bill_date;
            if (!chartData[date]) {
                chartData[date] = 0;
            }
            chartData[date] += parseFloat(sale.total_amount);
        });

        const formattedData = Object.keys(chartData).map(date => ({
            date,
            sales: parseFloat(chartData[date].toFixed(2))
        }));

        return sendSuccess(res, 200, 'Sales chart data retrieved successfully', formattedData);

    } catch (error) {
        logger.error('Sales chart error:', error);
        return sendError(res, 500, 'Server error', error.message);
    }
};

module.exports = {
    getDashboardMetrics,
    getRecentActivities,
    getSalesChartData
};
