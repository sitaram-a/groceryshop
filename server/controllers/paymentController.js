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
    const { amount } = req.body; // amount in PAISE (₹1 = 100 paise)

    if (!amount || amount < 100)
      return res.status(400).json({ success: false, message: 'Invalid amount.' });

    const options = {
      amount:   Math.round(amount), // paise
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.json({ success: true, order });
  } catch (err) {
    console.error('createRazorpayOrder:', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
};

// POST /api/payment/verify
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return res.status(400).json({ success: false, message: 'Missing payment fields.' });
    }

    // Verify signature
    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    // Fetch the order to get grand_total
    const [orders] = await db.query(
      'SELECT id, grand_total, payment_status FROM tbl_orders WHERE id = ?',
      [order_id]
    );
    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (orders[0].payment_status === 'paid') {
      // Already verified (e.g. duplicate callback) — return success idempotently
      return res.json({ success: true, message: 'Payment already verified.' });
    }

    // Save payment record
    await db.query(
      `INSERT INTO tbl_payments
       (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status)
       VALUES (?, ?, ?, ?, ?, 'captured')`,
      [order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, orders[0].grand_total]
    );

    // Update order payment status
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

module.exports = { createRazorpayOrder, verifyPayment, confirmCOD };
