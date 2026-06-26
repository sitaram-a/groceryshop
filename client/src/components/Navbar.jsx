import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();
  const navigate         = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const close = () => setMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setSearchOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" onClick={close}>🛒 GroceryShop</Link>

        {/* Desktop links */}
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          {user && <Link to="/orders">My Orders</Link>}
          {user && <Link to="/profile"  onClick={close}>👤 My Profile</Link>}
          {user && <Link to="/wishlist" onClick={close}>❤️ Wishlist</Link>}
        </div>

        {/* Desktop search bar */}
        <form className="nav-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="nav-search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="nav-search-btn">🔍</button>
        </form>

        <div className="nav-actions">
          {/* Mobile search toggle */}
          <button className="search-toggle" onClick={() => setSearchOpen(o => !o)} aria-label="Search">
            🔍
          </button>

          <Link to="/cart" className="cart-btn" onClick={close}>
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {/* Desktop user/auth */}
          <div className="nav-user-desktop">
            {user ? (
              <div className="nav-user">
                <span className="nav-username">Hi, {user.name.split(' ')[0]}</span>
                {user.role === 'admin' && (
                  <Link to="/admin" className="admin-link">⚙️ Admin</Link>
                )}
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            ) : (
              <div className="nav-auth">
                <Link to="/login"    className="btn-outline">Login</Link>
                <Link to="/register" className="btn-solid">Register</Link>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <form className="mobile-search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button type="submit">🔍 Search</button>
        </form>
      )}

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? 'visible' : 'hidden'}`}>
        <Link to="/"      onClick={close}>🏠 Home</Link>
        <Link to="/shop"  onClick={close}>🛍️ Shop</Link>
        {user && <Link to="/orders" onClick={close}>📦 My Orders</Link>}
        <Link to="/cart"  onClick={close}>🛒 Cart {cartCount > 0 && `(${cartCount})`}</Link>
        <div className="mobile-divider" />
        {user ? (
          <>
            <span className="mobile-greeting">Hi, {user.name.split(' ')[0]} 👋</span>
            {user.role === 'admin' && (
              <Link to="/admin" onClick={close}>⚙️ Admin Panel</Link>
            )}
            <button onClick={handleLogout} className="mobile-logout">🚪 Logout</button>
          </>
        ) : (
          <>
            <Link to="/login"    onClick={close}>🔑 Login</Link>
            <Link to="/register" onClick={close}>✨ Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}