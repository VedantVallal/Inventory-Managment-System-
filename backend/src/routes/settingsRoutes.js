const express = require('express');
const router = express.Router();
const {
    getSettings,
    updateSettings,
    getBusinessProfile,
    updateBusinessProfile,
    getAllUsers,
    addManager,
    deactivateUser
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

// Settings routes
router.get('/', getSettings);
router.put('/', authorize(ROLES.ADMIN), updateSettings);

// Business profile routes
router.get('/business', getBusinessProfile);
router.put('/business', authorize(ROLES.ADMIN), updateBusinessProfile);

// User management routes (Admin only)
router.get('/users', authorize(ROLES.ADMIN), getAllUsers);
router.post('/users', authorize(ROLES.ADMIN), addManager);
router.put('/users/:id/deactivate', authorize(ROLES.ADMIN), deactivateUser);

module.exports = router;
