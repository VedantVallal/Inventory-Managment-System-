const express = require('express');
const router = express.Router();
const {
    getAllPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', authorize(ROLES.ADMIN), deletePurchase);

module.exports = router;
