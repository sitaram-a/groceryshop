const express = require('express');
const router  = express.Router();
const { createRazorpayOrder, verifyPayment, confirmCOD, validateCoupon } = require('../controllers/paymentController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.post('/create-order',     createRazorpayOrder);
router.post('/verify',           verifyPayment);
router.post('/cod-confirm',      confirmCOD);
router.post('/validate-coupon',  validateCoupon);

module.exports = router;