const express = require('express');
const router  = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } = require('../controllers/wishlistController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);
router.get('/',                   getWishlist);
router.post('/:productId',        addToWishlist);
router.delete('/:productId',      removeFromWishlist);
router.get('/check/:productId',   checkWishlist);

module.exports = router;