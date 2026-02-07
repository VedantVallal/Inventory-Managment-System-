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

        // Helper to get local date string YYYY-MM-DD
        const getLocalDateString = (date) => {
            const offset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - offset);
            return localDate.toISOString().split('T')[0];
        };

        const today = new Date();
        const todayStr = getLocalDateString(today);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfMonthStr = getLocalDateString(firstDayOfMonth);

        // Run queries in parallel
        const [
            productsResult,
            todayBillsResult,
            yesterdayBillsResult,
            monthBillsResult,
            customersResult,
            suppliersResult,
            alertsResult
        ] = await Promise.all([
            // 1. Products (Total, Low Stock, Stock Value)
            supabase
                .from('products')
                .select('current_stock, min_stock_level, purchase_price')
                .eq('business_id', businessId)
                .eq('is_active', true)
                .then(res => res.data || []),

            // 2. Today's Bills
            supabase
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
                .eq('bill_date', todayStr)
                .then(res => res.data || []),

            // 3. Yesterday's Bills (for trend)
            supabase
                .from('bills')
                .select('total_amount')
                .eq('business_id', businessId)
                .eq('bill_date', yesterdayStr)
                .then(res => res.data || []),

            // 4. Month's Bills
            supabase
                .from('bills')
                .select('total_amount')
                .eq('business_id', businessId)
                .gte('bill_date', firstDayOfMonthStr)
                .then(res => res.data || []),

            // 5. Customers Count
            supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', businessId)
                .then(res => res.count || 0),

            // 6. Suppliers Count
            supabase
                .from('suppliers')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', businessId)
                .then(res => res.count || 0),

            // 7. Unread Alerts
            supabase
                .from('alerts')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', businessId)
                .eq('is_read', false)
                .then(res => res.count || 0)
        ]);


        // Process Products Data
        const totalProducts = productsResult.length;
        const lowStockCount = productsResult.filter(p => p.current_stock < p.min_stock_level).length;
        const outOfStockCount = productsResult.filter(p => p.current_stock === 0).length;
        const inStockCount = productsResult.filter(p => p.current_stock > p.min_stock_level).length;
        const totalStockValue = productsResult.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);

        // Process Sales Data
        const todaysSalesAmount = todayBillsResult.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
        const todaysSalesCount = todayBillsResult.length;

        let todaysProfit = 0;
        todayBillsResult.forEach(bill => {
            if (bill.bill_items) {
                bill.bill_items.forEach(item => {
                    const sellingPrice = parseFloat(item.unit_price) * parseInt(item.quantity);
                    const purchasePrice = parseFloat(item.products?.purchase_price || 0) * parseInt(item.quantity);
                    todaysProfit += (sellingPrice - purchasePrice);
                });
            }
        });

        const yesterdaysSalesAmount = yesterdayBillsResult.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
        const monthSalesAmount = monthBillsResult.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);

        // Calculate sales trend
        let salesTrend = 0;
        if (yesterdaysSalesAmount > 0) {
            salesTrend = ((todaysSalesAmount - yesterdaysSalesAmount) / yesterdaysSalesAmount) * 100;
        } else if (todaysSalesAmount > 0) {
            salesTrend = 100;
        }

        return sendSuccess(res, 200, 'Dashboard metrics retrieved successfully', {
            // Product metrics
            totalProducts,
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
            totalCustomers: customersResult,
            totalSuppliers: suppliersResult,
            unreadAlerts: alertsResult
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

        // Helper to get local date string YYYY-MM-DD
        const getLocalDateString = (date) => {
            const offset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - offset);
            return localDate.toISOString().split('T')[0];
        };

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days) + 1);

        const startDateStr = getLocalDateString(startDate);
        const endDateStr = getLocalDateString(endDate);

        const { data: sales, error } = await supabase
            .from('bills')
            .select('bill_date, total_amount')
            .eq('business_id', businessId)
            .gte('bill_date', startDateStr)
            .lte('bill_date', endDateStr)
            .order('bill_date', { ascending: true });

        if (error) {
            logger.error('Error fetching sales chart data:', error);
            return sendError(res, 500, 'Failed to fetch sales data', error.message);
        }

        // Initialize object with 0 for all dates in range
        const chartData = {};
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = getLocalDateString(d);
            chartData[dateStr] = 0;
        }

        // Fill with actual data
        sales?.forEach(sale => {
            const date = sale.bill_date;
            if (chartData.hasOwnProperty(date)) {
                chartData[date] += parseFloat(sale.total_amount);
            }
        });

        // Convert to array
        const formattedData = Object.keys(chartData).sort().map(date => ({
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
