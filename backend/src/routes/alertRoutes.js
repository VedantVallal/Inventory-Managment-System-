const express = require('express');
const router = express.Router();
const {
    getAllAlerts,
    markAlertAsRead,
    markAlertAsResolved,
    deleteAlert
} = require('../controllers/alertController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getAllAlerts);
router.put('/:id/read', markAlertAsRead);
router.put('/:id/resolve', markAlertAsResolved);
router.delete('/:id', deleteAlert);

module.exports = router;
