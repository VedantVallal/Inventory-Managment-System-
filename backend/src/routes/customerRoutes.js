const express = require('express');
const router = express.Router();
const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
