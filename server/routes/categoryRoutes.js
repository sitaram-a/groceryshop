const express = require('express');
const router = express.Router();
const { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const verifyToken = require('../middleware/authMiddleware');
const adminOnly  = require('../middleware/adminMiddleware');
const { uploadCategory } = require('../utils/multerConfig');

router.get('/',    getAllCategories);
router.get('/:id', getCategoryById);
router.post('/',    verifyToken, adminOnly, uploadCategory.single('image'), createCategory);
router.put('/:id',  verifyToken, adminOnly, uploadCategory.single('image'), updateCategory);
router.delete('/:id', verifyToken, adminOnly, deleteCategory);

module.exports = router;
