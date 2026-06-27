// routes/reviewRoutes.js
const express    = require('express');
const router     = express.Router();
const {
  getProductReviews,
  submitReview,
  deleteReview,
  getMyReview,
  approveReview,
  getAllReviewsAdmin,
} = require('../controllers/reviewController');
const verifyToken = require('../middleware/authMiddleware');
const adminOnly   = require('../middleware/adminMiddleware');
const { reviewLimiter } = require('../middleware/rateLimiter');

// Public
router.get('/:productId',                  getProductReviews);

// Authenticated
router.get('/my-review/:productId',        verifyToken, getMyReview);
router.post('/:productId',                 verifyToken, reviewLimiter, submitReview);
router.delete('/:reviewId',                verifyToken, deleteReview);

// Admin
router.get('/admin/all',                   verifyToken, adminOnly, getAllReviewsAdmin);
router.put('/:reviewId/approve',           verifyToken, adminOnly, approveReview);

module.exports = router;