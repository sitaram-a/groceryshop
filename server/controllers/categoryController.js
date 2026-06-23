const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper: generate slug from name
const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM tbl_categories c
       LEFT JOIN tbl_products p ON p.category_id = c.id AND p.is_active = 1
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return res.json({ success: true, categories: rows });
  } catch (err) {
    console.error('getAllCategories:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tbl_categories WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.json({ success: true, category: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/categories  (admin)
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const slug = slugify(name);
    const image = req.file ? `/uploads/categories/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO tbl_categories (name, slug, image) VALUES (?, ?, ?)',
      [name, slug, image]
    );
    return res.status(201).json({ success: true, message: 'Category created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Category with this name already exists.' });
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/categories/:id  (admin)
const updateCategory = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM tbl_categories WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Category not found.' });

    const slug = name ? slugify(name) : existing[0].slug;
    let image = existing[0].image;

    if (req.file) {
      // Delete old image
      if (image) {
        const oldPath = path.join(__dirname, '..', image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image = `/uploads/categories/${req.file.filename}`;
    }

    await db.query(
      'UPDATE tbl_categories SET name = ?, slug = ?, image = ?, is_active = ? WHERE id = ?',
      [name || existing[0].name, slug, image, is_active ?? existing[0].is_active, id]
    );
    return res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/categories/:id  (admin)
const deleteCategory = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM tbl_categories WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Category not found.' });

    // Soft delete
    await db.query('UPDATE tbl_categories SET is_active = 0 WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
