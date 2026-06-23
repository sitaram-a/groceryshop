const express   = require('express');
const router    = express.Router();
const { getDashboardStats, getAllUsers, toggleUserStatus } = require('../controllers/adminController');
const verifyToken = require('../middleware/authMiddleware');
const adminOnly   = require('../middleware/adminMiddleware');

router.use(verifyToken, adminOnly);
router.get('/dashboard',         getDashboardStats);
router.get('/users',             getAllUsers);
router.put('/users/:id/toggle',  toggleUserStatus);

module.exports = router;
