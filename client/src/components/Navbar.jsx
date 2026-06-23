import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();
  const navigate         = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">🛒 GroceryShop</Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          {user && <Link to="/orders">My Orders</Link>}
        </div>

        <div className="nav-actions">
          <Link to="/cart" className="cart-btn">
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

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
      </div>
    </nav>
  );
}
