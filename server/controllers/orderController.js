const db = require('../config/db');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../utils/emailService');

// Generate unique order number
const generateOrderNumber = () => {
  const ts   = Date.now().toString().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GS-${ts}-${rand}`;
};

// POST /api/orders/place
const placeOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { delivery_address, notes, payment_method = 'razorpay' } = req.body;

    if (!delivery_address)
      return res.status(400).json({ success: false, message: 'Delivery address is required.' });

    // Get cart items
    const [cartItems] = await conn.query(
      `SELECT c.id AS cart_id, c.quantity, p.id AS product_id,
              p.name, p.price, p.discount_price, p.stock
       FROM tbl_cart c
       JOIN tbl_products p ON p.id = c.product_id
       WHERE c.user_id = ? AND p.is_active = 1`,
      [req.user.id]
    );

    if (!cartItems.length)
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });

    // Validate stock
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `"${item.name}" only has ${item.stock} units in stock.`,
        });
      }
    }

    // Calculate totals
    const total = cartItems.reduce((sum, i) => {
      const price = parseFloat(i.discount_price || i.price);
      return sum + price * i.quantity;
    }, 0);

    const deliveryCharge = total >= 500 ? 0 : 40; // Free delivery above ₹500
    const grandTotal     = total + deliveryCharge;
    const orderNumber    = generateOrderNumber();

    // Insert order
    const [orderResult] = await conn.query(
      `INSERT INTO tbl_orders
       (order_number, user_id, total_amount, delivery_charge, grand_total,
        payment_method, payment_status, delivery_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [orderNumber, req.user.id, total.toFixed(2), deliveryCharge,
       grandTotal.toFixed(2), payment_method, delivery_address, notes || null]
    );
    const orderId = orderResult.insertId;

    // Insert order items + deduct stock
    for (const item of cartItems) {
      const unitPrice = parseFloat(item.discount_price || item.price);
      await conn.query(
        `INSERT INTO tbl_order_items
         (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.quantity,
         unitPrice.toFixed(2), (unitPrice * item.quantity).toFixed(2)]
      );
      await conn.query(
        'UPDATE tbl_products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await conn.query('DELETE FROM tbl_cart WHERE user_id = ?', [req.user.id]);
    await conn.commit();

    // Send confirmation email (non-blocking)
    const [userRows] = await db.query('SELECT name, email FROM tbl_users WHERE id = ?', [req.user.id]);
    if (userRows.length) {
      sendOrderConfirmationEmail({
        email: userRows[0].email,
        name:  userRows[0].name,
        orderNumber,
        items: cartItems.map(i => ({
          product_name: i.name,
          quantity:     i.quantity,
          unit_price:   parseFloat(i.discount_price || i.price).toFixed(2),
          subtotal:     (parseFloat(i.discount_price || i.price) * i.quantity).toFixed(2),
        })),
        grandTotal: grandTotal.toFixed(2),
        deliveryAddress: delivery_address,
      }).catch(e => console.error('Order email failed:', e.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: { id: orderId, order_number: orderNumber, grand_total: grandTotal.toFixed(2) },
    });
  } catch (err) {
    await conn.rollback();
    console.error('placeOrder:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  } finally {
    conn.release();
  }
};

// GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*,
              (SELECT COUNT(*) FROM tbl_order_items WHERE order_id = o.id) AS item_count
       FROM tbl_orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/orders/:id
// const getOrderById = async (req, res) => {
//   try {
//     const [orders] = await db.query(
//       'SELECT * FROM tbl_orders WHERE id = ? AND user_id = ?',
//       [req.params.id, req.user.id]
//     );
//     if (!orders.length)
//       return res.status(404).json({ success: false, message: 'Order not found.' });

//     const [items] = await db.query(
//       'SELECT * FROM tbl_order_items WHERE order_id = ?',
//       [req.params.id]
//     );
//     return res.json({ success: true, order: { ...orders[0], items } });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: 'Server error.' });
//   }
// };

const getOrderById = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin
      ? 'SELECT * FROM tbl_orders WHERE id = ?'
      : 'SELECT * FROM tbl_orders WHERE id = ? AND user_id = ?';
    const params = isAdmin ? [req.params.id] : [req.params.id, req.user.id];

    const [orders] = await db.query(query, params);

      if (!orders.length)
      return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await db.query(
      'SELECT * FROM tbl_order_items WHERE order_id = ?',
      [req.params.id]
    );
    return res.json({ success: true, order: { ...orders[0], items } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/orders  (admin — all orders)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (status) { conditions.push('o.order_status = ?'); params.push(status); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [orders] = await db.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM tbl_orders o
       JOIN tbl_users u ON u.id = o.user_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM tbl_orders o ${where}`, params
    );

    return res.json({ success: true, orders, total, page: parseInt(page) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/orders/:id/status  (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    console.log('updateOrderStatus called:', { id: req.params.id, status, payment_status });
    const validStatuses = ['placed','confirmed','processing','out_for_delivery','delivered','cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const [orders] = await db.query('SELECT * FROM tbl_orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });

    await db.query('UPDATE tbl_orders SET order_status = ? WHERE id = ?', [status, req.params.id]);

    // Email the customer
    const [user] = await db.query(
      'SELECT name, email FROM tbl_users WHERE id = ?', [orders[0].user_id]
    );
    if (user.length) {
      sendOrderStatusEmail({
        email: user[0].email, name: user[0].name,
        orderNumber: orders[0].order_number, status,
      }).catch(e => console.error('Status email failed:', e.message));
    }

    return res.json({ success: true, message: 'Order status updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/orders/:id/cancel  (user — cancel a pending/placed razorpay order)
// Restores stock and marks order cancelled. Called when user dismisses Razorpay modal.
// POST /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(
      `SELECT * FROM tbl_orders WHERE id = ? AND user_id = ? AND payment_status = 'pending'`,
      [req.params.id, req.user.id]
    );
    if (!orders.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Order not found or already processed.' });
    }

    // Restore stock
    const [items] = await conn.query(
      'SELECT product_id, quantity FROM tbl_order_items WHERE order_id = ?',
      [req.params.id]
    );
    for (const item of items) {
      await conn.query(
        'UPDATE tbl_products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Mark order cancelled + failed payment
    await conn.query(
      `UPDATE tbl_orders SET order_status = 'cancelled', payment_status = 'failed' WHERE id = ?`,
      [req.params.id]
    );

    await conn.commit();
    return res.json({ success: true, message: 'Order cancelled and stock restored.' });
  } catch (err) {
    await conn.rollback();
    console.error('cancelOrder:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    conn.release();
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, cancelOrder };