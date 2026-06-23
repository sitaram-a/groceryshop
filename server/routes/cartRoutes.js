const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken); // All cart routes require login
router.get('/',             getCart);
router.post('/add',         addToCart);
router.put('/update/:id',   updateCartItem);
router.delete('/remove/:id', removeFromCart);
router.delete('/clear',     clearCart);

module.exports = router;
