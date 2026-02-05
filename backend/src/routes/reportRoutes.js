const express = require('express');
const router = express.Router();
const {
    getStockSummaryReport,
    getSalesReport,
    getPurchaseReport,
    getProfitLossReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/stock-summary', getStockSummaryReport);
router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/profit-loss', authorize(ROLES.ADMIN), getProfitLossReport);

module.exports = router;
