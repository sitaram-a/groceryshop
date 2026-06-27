require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

const { authLimiter, apiLimiter, orderLimiter } = require('./middleware/rateLimiter');

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Global API rate limit ──
app.use('/api', apiLimiter);

// ── Routes ──
app.use('/api/auth',       authLimiter, require('./routes/authRoutes'));   // stricter on auth
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products',   require('./routes/productRoutes'));
app.use('/api/cart',       require('./routes/cartRoutes'));
app.use('/api/orders',     orderLimiter, require('./routes/orderRoutes')); // stricter on orders
app.use('/api/payment',    require('./routes/paymentRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/wishlist',   require('./routes/wishlistRoutes'));
app.use('/api/reviews',    require('./routes/reviewRoutes'));

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'GroceryShop API running ✅' })
);
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 GroceryShop Server  →  http://localhost:${PORT}`);
  console.log(`📋 Health check       →  http://localhost:${PORT}/api/health\n`);
});