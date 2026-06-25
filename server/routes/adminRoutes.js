const express   = require('express');
const router    = express.Router();
const {
  getDashboardStats, getAllUsers, toggleUserStatus,
  getAllCoupons, createCoupon, updateCoupon, deleteCoupon
} = require('../controllers/adminController');
const verifyToken = require('../middleware/authMiddleware');
const adminOnly   = require('../middleware/adminMiddleware');

router.use(verifyToken, adminOnly);
router.get('/dashboard',           getDashboardStats);
router.get('/users',               getAllUsers);
router.put('/users/:id/toggle',    toggleUserStatus);
router.get('/coupons',             getAllCoupons);
router.post('/coupons',            createCoupon);
router.put('/coupons/:id',         updateCoupon);
router.delete('/coupons/:id',      deleteCoupon);

module.exports = router;