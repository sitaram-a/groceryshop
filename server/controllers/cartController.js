const db = require('../config/db');

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT c.id, c.quantity, c.product_id,
              p.name, p.price, p.discount_price AS discount_price,
              p.image, p.unit, p.stock,
              COALESCE(p.discount_price, p.price) AS effective_price
       FROM tbl_cart c
       JOIN tbl_products p ON p.id = c.product_id
       WHERE c.user_id = ? AND p.is_active = 1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    // Use effective price (discount if available) as "price"
    const enriched = items.map(i => ({
      ...i,
      price: parseFloat(i.effective_price),
    }));

    const total = enriched.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return res.json({ success: true, items: enriched, total: total.toFixed(2) });
  } catch (err) {
    console.error('getCart:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });

    // Check product exists and has stock
    const [products] = await db.query(
      'SELECT id, stock FROM tbl_products WHERE id = ? AND is_active = 1',
      [product_id]
    );
    if (!products.length) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (products[0].stock === 0) return res.status(400).json({ success: false, message: 'Product is out of stock.' });

    // Check if already in cart
    const [existing] = await db.query(
      'SELECT id, quantity FROM tbl_cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length) {
      const newQty = Math.min(existing[0].quantity + parseInt(quantity), products[0].stock);
      await db.query('UPDATE tbl_cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      await db.query(
        'INSERT INTO tbl_cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, Math.min(parseInt(quantity), products[0].stock)]
      );
    }

    return res.json({ success: true, message: 'Item added to cart.' });
  } catch (err) {
    console.error('addToCart:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/cart/update/:id
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params;

    if (!quantity || quantity < 1)
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });

    const [item] = await db.query(
      'SELECT c.id, p.stock FROM tbl_cart c JOIN tbl_products p ON p.id = c.product_id WHERE c.id = ? AND c.user_id = ?',
      [id, req.user.id]
    );
    if (!item.length) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    const safeQty = Math.min(parseInt(quantity), item[0].stock);
    await db.query('UPDATE tbl_cart SET quantity = ? WHERE id = ?', [safeQty, id]);

    return res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/cart/remove/:id
const removeFromCart = async (req, res) => {
  try {
    await db.query('DELETE FROM tbl_cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Item removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
  try {
    await db.query('DELETE FROM tbl_cart WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
