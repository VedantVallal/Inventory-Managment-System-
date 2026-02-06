const express = require('express');
const router = express.Router();
const {
    getDashboardMetrics,
    getRecentActivities,
    getSalesChartData
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(protect);

// Get dashboard metrics
router.get('/metrics', getDashboardMetrics);

// Get recent activities
router.get('/activities', getRecentActivities);
router.get('/recent-activities', getRecentActivities); // Alias for frontend

// Get sales chart data
router.get('/sales-chart', getSalesChartData);

module.exports = router;
