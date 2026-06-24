import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const NAV = [
  { to: '/admin',            label: 'Dashboard',  icon: '📊', end: true },
  { to: '/admin/products',   label: 'Products',   icon: '🛍️' },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { to: '/admin/orders',     label: 'Orders',     icon: '📦' },
  { to: '/admin/users',      label: 'Users',      icon: '👥' },
];

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const close = () => setOpen(false);

  const isMobile = window.innerWidth <= 900;

  const sidebarStyle = isMobile ? {
    position:   'fixed',
    top:        0,
    left:       open ? 0 : -250,
    width:      220,
    height:     '100vh',
    zIndex:     300,
    transition: 'left 0.25s ease',
    paddingTop: 20,
    background: '#1e293b',
    overflowY:  'auto',
    boxShadow:  open ? '4px 0 20px rgba(0,0,0,0.4)' : 'none',
  } : {};

  return (
    <div className="admin-shell">

      {/* Mobile top bar */}
      <div className="admin-mobile-bar">
        <button
          className="admin-hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
        <span className="admin-mobile-title">⚙️ Admin Panel</span>
        <NavLink to="/" className="admin-mobile-store">🛒 Store</NavLink>
      </div>

      {/* Dark overlay */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 299,
          }}
        />
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar" style={sidebarStyle}>
        <p className="admin-sidebar-title">Admin Panel</p>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
            onClick={close}
          >
            <span className="admin-nav-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <div className="admin-nav-sep" />
        <NavLink to="/" className="admin-nav-item" onClick={close}>
          <span className="admin-nav-icon">🛒</span> View Store
        </NavLink>
        <span className="admin-nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <span className="admin-nav-icon">🚪</span> Logout
        </span>
      </aside>

      {/* Main content */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}