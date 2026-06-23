import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { CartProvider }  from './context/CartContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Customer pages
import Home          from './pages/Home';
import Shop          from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Cart          from './pages/Cart';
import Checkout      from './pages/Checkout';
import OrderSuccess  from './pages/OrderSuccess';
import OrderHistory  from './pages/OrderHistory';

// Admin pages
import Dashboard       from './pages/admin/Dashboard';
import AdminProducts   from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders     from './pages/admin/AdminOrders';
import AdminUsers      from './pages/admin/AdminUsers';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* ── Auth (no Navbar) ── */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Public ── */}
            <Route path="/"            element={<Layout><Home /></Layout>} />
            <Route path="/shop"        element={<Layout><Shop /></Layout>} />
            <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />

            {/* ── Customer Protected ── */}
            <Route path="/cart"
              element={<Layout><ProtectedRoute><Cart /></ProtectedRoute></Layout>} />
            <Route path="/checkout"
              element={<Layout><ProtectedRoute><Checkout /></ProtectedRoute></Layout>} />
            <Route path="/order-success/:id"
              element={<Layout><ProtectedRoute><OrderSuccess /></ProtectedRoute></Layout>} />
            <Route path="/orders"
              element={<Layout><ProtectedRoute><OrderHistory /></ProtectedRoute></Layout>} />

            {/* ── Admin (no Navbar — AdminLayout has its own sidebar) ── */}
            <Route path="/admin"
              element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/admin/products"
              element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/categories"
              element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/orders"
              element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/users"
              element={<AdminRoute><AdminUsers /></AdminRoute>} />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
