const express    = require('express');
const router     = express.Router();
const {
  placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, cancelOrder
} = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');
const adminOnly   = require('../middleware/adminMiddleware');

router.use(verifyToken);
router.post('/place',          placeOrder);
router.get('/my-orders',       getMyOrders);
router.post('/:id/cancel',     cancelOrder);
router.get('/:id',             getOrderById);
router.get('/',                adminOnly, getAllOrders);
router.put('/:id/status',      adminOnly, updateOrderStatus);

module.exports = router;