const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// GET /api/products
// Query params: category, search, page, limit, sort, featured
const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 12,
      sort = 'newest',
      featured,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['p.is_active = 1'];
    const params = [];

    if (category) {
      conditions.push('c.slug = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (featured === 'true') {
      conditions.push('p.is_featured = 1');
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const orderMap = {
      newest:     'p.created_at DESC',
      price_asc:  'p.price ASC',
      price_desc: 'p.price DESC',
      name_asc:   'p.name ASC',
    };
    const orderBy = orderMap[sort] || 'p.created_at DESC';

    // Count query
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM tbl_products p
       LEFT JOIN tbl_categories c ON c.id = p.category_id
       ${where}`,
      params
    );
    const total = countRows[0].total;

    // Data query
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM tbl_products p
       LEFT JOIN tbl_categories c ON c.id = p.category_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.json({
      success: true,
      products: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('getAllProducts:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/products/featured
const getFeaturedProducts = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM tbl_products p
       LEFT JOIN tbl_categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND p.is_featured = 1
       ORDER BY p.created_at DESC
       LIMIT 8`
    );
    return res.json({ success: true, products: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM tbl_products p
       LEFT JOIN tbl_categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found.' });
    return res.json({ success: true, product: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/products  (admin)
const createProduct = async (req, res) => {
  try {
    const { category_id, name, description, price, discount_price, unit, stock, is_featured } = req.body;

    if (!category_id || !name || !price)
      return res.status(400).json({ success: false, message: 'category_id, name, and price are required.' });

    const slug = slugify(name) + '-' + Date.now();
    const image = req.file ? `/uploads/products/${req.file.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO tbl_products
       (category_id, name, slug, description, price, discount_price, unit, stock, image, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, slug, description || null, price, discount_price || null,
       unit || null, stock || 0, image, is_featured === 'true' ? 1 : 0]
    );
    return res.status(201).json({ success: true, message: 'Product created.', id: result.insertId });
  } catch (err) {
    console.error('createProduct:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, discount_price, unit, stock, is_featured, is_active } = req.body;

    const [existing] = await db.query('SELECT * FROM tbl_products WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Product not found.' });

    const p = existing[0];
    let image = p.image;

    if (req.file) {
      if (image) {
        const oldPath = path.join(__dirname, '..', image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image = `/uploads/products/${req.file.filename}`;
    }

    await db.query(
      `UPDATE tbl_products SET
        category_id = ?, name = ?, description = ?, price = ?,
        discount_price = ?, unit = ?, stock = ?, image = ?,
        is_featured = ?, is_active = ?
       WHERE id = ?`,
      [
        category_id    ?? p.category_id,
        name           ?? p.name,
        description    ?? p.description,
        price          ?? p.price,
        discount_price ?? p.discount_price,
        unit           ?? p.unit,
        stock          ?? p.stock,
        image,
        is_featured !== undefined ? (is_featured === 'true' ? 1 : 0) : p.is_featured,
        is_active   !== undefined ? (is_active   === 'true' ? 1 : 0) : p.is_active,
        id,
      ]
    );
    return res.json({ success: true, message: 'Product updated.' });
  } catch (err) {
    console.error('updateProduct:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/products/:id  (admin)
const deleteProduct = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM tbl_products WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Product not found.' });

    await db.query('UPDATE tbl_products SET is_active = 0 WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllProducts, getFeaturedProducts, getProductById,
  createProduct, updateProduct, deleteProduct,
};
