// routes/orderRoutes.js
const express    = require('express');
const router     = express.Router();
const {
  placeOrder, getMyOrders, getOrderById,
  getAllOrders, updateOrderStatus, cancelOrder
} = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');
const adminOnly   = require('../middleware/adminMiddleware');

router.use(verifyToken);

// ⚠️  SPECIFIC routes MUST come before /:id wildcard
router.post('/place',          placeOrder);
router.get('/my-orders',       getMyOrders);        // ← before /:id
router.get('/',                adminOnly, getAllOrders);
router.put('/:id/status',      adminOnly, updateOrderStatus);
router.post('/:id/cancel',     cancelOrder);
router.get('/:id',             getOrderById);       // ← wildcard always last

module.exports = router;