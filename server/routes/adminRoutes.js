const express   = require('express');
const router    = express.Router();
const adminCtrl = require('../controllers/adminController');
const verifyToken = require('../middleware/authMiddleware');
const adminOnly   = require('../middleware/adminMiddleware');

router.use(verifyToken, adminOnly);
router.get('/dashboard',        adminCtrl.getDashboardStats);
router.get('/users',            adminCtrl.getAllUsers);
router.put('/users/:id/toggle', adminCtrl.toggleUserStatus);
router.get('/coupons',          adminCtrl.getAllCoupons);
router.post('/coupons',         adminCtrl.createCoupon);
router.put('/coupons/:id',      adminCtrl.updateCoupon);
router.delete('/coupons/:id',   adminCtrl.deleteCoupon);

module.exports = router;