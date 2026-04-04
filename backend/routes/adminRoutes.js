const express = require('express');
const router = express.Router();
const { getUsers, getSystemStats, getActivityLogs } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/users', protect, admin, getUsers);
router.get('/stats', protect, admin, getSystemStats);
router.get('/activity', protect, admin, getActivityLogs);

module.exports = router;
