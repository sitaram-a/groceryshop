// controllers/reviewController.js
const db = require('../config/db');

// Helper: refresh denormalised rating cache on tbl_products
async function refreshProductRating(productId) {
  await db.query(
    `UPDATE tbl_products
     SET avg_rating   = (SELECT COALESCE(AVG(rating), 0) FROM tbl_reviews WHERE product_id = ? AND is_approved = 1),
         review_count = (SELECT COUNT(*)                  FROM tbl_reviews WHERE product_id = ? AND is_approved = 1)
     WHERE id = ?`,
    [productId, productId, productId]
  );
}

// ── GET /api/reviews/:productId  (public) ────────────────────────────────────
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page   = parseInt(req.query.page  || 1);
    const limit  = parseInt(req.query.limit || 10);
    const offset = (page - 1) * limit;

    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.title, r.body, r.created_at,
              u.name AS user_name
       FROM tbl_reviews r
       JOIN tbl_users  u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM tbl_reviews WHERE product_id = ? AND is_approved = 1',
      [productId]
    );

    // Rating distribution (1–5 stars)
    const [dist] = await db.query(
      `SELECT rating, COUNT(*) AS cnt
       FROM tbl_reviews WHERE product_id = ? AND is_approved = 1
       GROUP BY rating`,
      [productId]
    );
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    dist.forEach(r => { distribution[r.rating] = r.cnt; });

    const [[summary]] = await db.query(
      `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS review_count
       FROM tbl_reviews WHERE product_id = ? AND is_approved = 1`,
      [productId]
    );

    return res.json({
      success: true,
      reviews,
      total,
      page,
      avg_rating:   parseFloat(summary.avg_rating).toFixed(1),
      review_count: summary.review_count,
      distribution,
    });
  } catch (err) {
    console.error('getProductReviews:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/reviews/:productId  (auth required) ────────────────────────────
const submitReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, body } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

    // Check product exists
    const [[product]] = await db.query(
      'SELECT id FROM tbl_products WHERE id = ? AND is_active = 1', [productId]
    );
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found.' });

    // Check user bought this product (optional buyer-only enforcement)
    const [bought] = await db.query(
      `SELECT oi.id FROM tbl_order_items oi
       JOIN tbl_orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'delivered'
       LIMIT 1`,
      [req.user.id, productId]
    );
    if (!bought.length)
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased and received.',
      });

    // Check already reviewed
    const [existing] = await db.query(
      'SELECT id FROM tbl_reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    if (existing.length)
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });

    await db.query(
      `INSERT INTO tbl_reviews (product_id, user_id, rating, title, body)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, req.user.id, rating, title || null, body || null]
    );

    await refreshProductRating(productId);

    return res.status(201).json({ success: true, message: 'Review submitted successfully!' });
  } catch (err) {
    console.error('submitReview:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── DELETE /api/reviews/:reviewId  (auth — own review) ───────────────────────
const deleteReview = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tbl_reviews WHERE id = ?', [req.params.reviewId]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Review not found.' });

    const review = rows[0];
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && review.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorised.' });

    await db.query('DELETE FROM tbl_reviews WHERE id = ?', [req.params.reviewId]);
    await refreshProductRating(review.product_id);

    return res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    console.error('deleteReview:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/reviews/my-review/:productId  (auth) ────────────────────────────
const getMyReview = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tbl_reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    return res.json({ success: true, review: rows[0] || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/reviews/:reviewId/approve  (admin) ───────────────────────────────
const approveReview = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tbl_reviews WHERE id = ?', [req.params.reviewId]);
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Review not found.' });

    const { is_approved } = req.body;
    await db.query('UPDATE tbl_reviews SET is_approved = ? WHERE id = ?', [is_approved ? 1 : 0, req.params.reviewId]);
    await refreshProductRating(rows[0].product_id);

    return res.json({ success: true, message: `Review ${is_approved ? 'approved' : 'hidden'}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/reviews/admin/all  (admin) ───────────────────────────────────────
const getAllReviewsAdmin = async (req, res) => {
  try {
    const page   = parseInt(req.query.page  || 1);
    const limit  = parseInt(req.query.limit || 20);
    const offset = (page - 1) * limit;

    const [reviews] = await db.query(
      `SELECT r.*, u.name AS user_name, p.name AS product_name
       FROM tbl_reviews r
       JOIN tbl_users    u ON u.id = r.user_id
       JOIN tbl_products p ON p.id = r.product_id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM tbl_reviews');
    return res.json({ success: true, reviews, total, page });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getProductReviews,
  submitReview,
  deleteReview,
  getMyReview,
  approveReview,
  getAllReviewsAdmin,
};