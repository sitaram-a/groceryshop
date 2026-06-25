const db = require('../config/db');

// GET /api/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [[{ totalOrders }]]   = await db.query("SELECT COUNT(*) AS totalOrders FROM tbl_orders");
    const [[{ totalRevenue }]]  = await db.query("SELECT COALESCE(SUM(grand_total),0) AS totalRevenue FROM tbl_orders WHERE payment_status='paid'");
    const [[{ totalProducts }]] = await db.query("SELECT COUNT(*) AS totalProducts FROM tbl_products WHERE is_active=1");
    const [[{ totalUsers }]]    = await db.query("SELECT COUNT(*) AS totalUsers FROM tbl_users WHERE role='customer'");
    const [[{ pendingOrders }]] = await db.query("SELECT COUNT(*) AS pendingOrders FROM tbl_orders WHERE order_status='placed'");
    const [[{ lowStock }]]      = await db.query("SELECT COUNT(*) AS lowStock FROM tbl_products WHERE stock <= 5 AND is_active=1");

    const [recentOrders] = await db.query(
      `SELECT o.id, o.order_number, o.grand_total, o.order_status,
              o.payment_status, o.created_at, u.name AS customer_name
       FROM tbl_orders o JOIN tbl_users u ON u.id=o.user_id
       ORDER BY o.created_at DESC LIMIT 8`
    );

    const [topProducts] = await db.query(
      `SELECT p.name, SUM(oi.quantity) AS total_sold, SUM(oi.subtotal) AS revenue
       FROM tbl_order_items oi JOIN tbl_products p ON p.id=oi.product_id
       GROUP BY oi.product_id, p.name ORDER BY total_sold DESC LIMIT 5`
    );

    const [monthlySales] = await db.query(
      `SELECT DATE_FORMAT(MIN(created_at),'%b %Y') AS month,
              COUNT(*) AS orders,
              COALESCE(SUM(grand_total),0) AS revenue
       FROM tbl_orders WHERE payment_status='paid'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at,'%Y-%m')
       ORDER BY DATE_FORMAT(created_at,'%Y-%m')`
    );

    // Order status breakdown for pie chart
    const [ordersByStatus] = await db.query(
      `SELECT order_status AS status, COUNT(*) AS count
       FROM tbl_orders GROUP BY order_status`
    );

    // Daily revenue last 14 days
    const [dailyRevenue] = await db.query(
      `SELECT DATE_FORMAT(MIN(created_at),'%d %b') AS day,
              COALESCE(SUM(grand_total),0) AS revenue,
              COUNT(*) AS orders
       FROM tbl_orders
       WHERE payment_status='paid'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`
    );

    return res.json({
      success: true,
      stats: {
        totalOrders, totalRevenue: parseFloat(totalRevenue).toFixed(2),
        totalProducts, totalUsers, pendingOrders, lowStock
      },
      recentOrders, topProducts, monthlySales, ordersByStatus, dailyRevenue,
    });
  } catch (err) {
    console.error('getDashboardStats:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = "WHERE role='customer'";
    if (search) { where += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [users] = await db.query(
      `SELECT id, name, email, phone, is_active, created_at,
              (SELECT COUNT(*) FROM tbl_orders WHERE user_id=tbl_users.id) AS order_count
       FROM tbl_users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM tbl_users ${where}`, params);
    return res.json({ success: true, users, total, page: parseInt(page) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT is_active FROM tbl_users WHERE id=? AND role="customer"', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE tbl_users SET is_active=? WHERE id=?', [newStatus, req.params.id]);
    return res.json({ success: true, message: `User ${newStatus ? 'activated' : 'deactivated'}.`, is_active: newStatus });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/admin/coupons
const getAllCoupons = async (req, res) => {
  try {
    const [coupons] = await db.query('SELECT * FROM tbl_coupons ORDER BY created_at DESC');
    return res.json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/admin/coupons
const createCoupon = async (req, res) => {
  try {
    const { code, type, value, min_order, max_discount, expires_at, usage_limit } = req.body;
    if (!code || !type || !value)
      return res.status(400).json({ success: false, message: 'code, type and value are required.' });

    await db.query(
      `INSERT INTO tbl_coupons (code, type, value, min_order, max_discount, expires_at, usage_limit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code.toUpperCase(), type, value, min_order || 0, max_discount || null, expires_at || null, usage_limit || null]
    );
    return res.status(201).json({ success: true, message: 'Coupon created.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/admin/coupons/:id
const updateCoupon = async (req, res) => {
  try {
    const { is_active } = req.body;
    await db.query('UPDATE tbl_coupons SET is_active=? WHERE id=?', [is_active ? 1 : 0, req.params.id]);
    return res.json({ success: true, message: 'Coupon updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/admin/coupons/:id
const deleteCoupon = async (req, res) => {
  try {
    await db.query('DELETE FROM tbl_coupons WHERE id=?', [req.params.id]);
    return res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDashboardStats, getAllUsers, toggleUserStatus, getAllCoupons, createCoupon, updateCoupon, deleteCoupon };