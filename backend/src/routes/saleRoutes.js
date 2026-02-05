const express = require('express');
const router = express.Router();
const {
    getAllBills,
    getBillById,
    createBill,
    updateBill,
    deleteBill
} = require('../controllers/saleController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

// All routes are protected
router.use(protect);

// Get all bills
router.get('/', getAllBills);

// Get single bill
router.get('/:id', getBillById);

// Create new bill
router.post('/', createBill);

// Update bill
router.put('/:id', updateBill);

// Delete bill (Admin only)
router.delete('/:id', authorize(ROLES.ADMIN), deleteBill);

module.exports = router;
