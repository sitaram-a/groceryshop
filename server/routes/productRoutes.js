const express = require('express');
const router = express.Router();
const {
  getAllProducts, getFeaturedProducts, getProductById,
  createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');
const verifyToken = require('../middleware/authMiddleware');
const adminOnly   = require('../middleware/adminMiddleware');
const { uploadProduct } = require('../utils/multerConfig');

router.get('/featured', getFeaturedProducts);
router.get('/',         getAllProducts);
router.get('/:id',      getProductById);
router.post('/',         verifyToken, adminOnly, uploadProduct.single('image'), createProduct);
router.put('/:id',       verifyToken, adminOnly, uploadProduct.single('image'), updateProduct);
router.delete('/:id',    verifyToken, adminOnly, deleteProduct);

module.exports = router;
