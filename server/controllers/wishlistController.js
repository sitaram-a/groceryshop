const db = require('../config/db');

// GET /api/wishlist
const getWishlist = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT w.product_id, p.name, p.price, p.discount_price, p.image, p.stock
       FROM tbl_wishlist w
       JOIN tbl_products p ON p.id = w.product_id
       WHERE w.user_id = ? AND p.is_active = 1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/wishlist/:productId
const addToWishlist = async (req, res) => {
  try {
    await db.query(
      `INSERT IGNORE INTO tbl_wishlist (user_id, product_id) VALUES (?, ?)`,
      [req.user.id, req.params.productId]
    );
    return res.json({ success: true, message: 'Added to wishlist.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM tbl_wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    return res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/wishlist/check/:productId
const checkWishlist = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id FROM tbl_wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    return res.json({ success: true, inWishlist: rows.length > 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist };