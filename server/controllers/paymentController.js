const Razorpay = require('razorpay');
const crypto   = require('crypto');
const db       = require('../config/db');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 100)
      return res.status(400).json({ success: false, message: 'Invalid amount.' });

    const order = await razorpay.orders.create({
      amount:   Math.round(amount),
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
    });
    return res.json({ success: true, order });
  } catch (err) {
    console.error('createRazorpayOrder:', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
};

// POST /api/payment/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id)
      return res.status(400).json({ success: false, message: 'Missing payment fields.' });

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });

    const [orders] = await db.query(
      'SELECT id, grand_total, payment_status FROM tbl_orders WHERE id = ?', [order_id]
    );
    if (!orders.length)
      return res.status(404).json({ success: false, message: 'Order not found.' });
    if (orders[0].payment_status === 'paid')
      return res.json({ success: true, message: 'Payment already verified.' });

    await db.query(
      `INSERT INTO tbl_payments
       (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status)
       VALUES (?, ?, ?, ?, ?, 'captured')`,
      [order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, orders[0].grand_total]
    );
    await db.query(
      `UPDATE tbl_orders SET payment_status = 'paid', order_status = 'confirmed' WHERE id = ?`,
      [order_id]
    );
    return res.json({ success: true, message: 'Payment verified successfully.' });
  } catch (err) {
    console.error('verifyPayment:', err);
    return res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
};

// POST /api/payment/cod-confirm
const confirmCOD = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id required.' });

    await db.query(
      `UPDATE tbl_orders SET payment_status = 'pending', order_status = 'confirmed' WHERE id = ? AND user_id = ?`,
      [order_id, req.user.id]
    );
    return res.json({ success: true, message: 'COD order confirmed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/payment/validate-coupon
const validateCoupon = async (req, res) => {
  try {
    const { code, cart_total } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required.' });

    const [coupons] = await db.query(
      `SELECT * FROM tbl_coupons WHERE code = ? AND is_active = 1`,
      [code.toUpperCase()]
    );

    if (!coupons.length)
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });

    const coupon = coupons[0];

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });

    // Check usage limit
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses)
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });

    // Check min order
    if (coupon.min_order && parseFloat(cart_total) < parseFloat(coupon.min_order))
      return res.status(400).json({
        success: false,
        message: `Minimum order of ₹${coupon.min_order} required for this coupon.`
      });

    // Return with normalized field names for frontend
    return res.json({
      success: true,
      coupon: {
        ...coupon,
        type:  coupon.discount_type,
        value: parseFloat(coupon.discount_value),
      }
    });
  } catch (err) {
    console.error('validateCoupon:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createRazorpayOrder, verifyPayment, confirmCOD, validateCoupon };