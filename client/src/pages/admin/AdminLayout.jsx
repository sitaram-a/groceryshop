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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const close = () => setSidebarOpen(false);

  return (
    <div className="admin-shell">

      {/* Mobile top bar */}
      <div className="admin-mobile-bar">
        <button className="admin-hamburger" onClick={() => setSidebarOpen(o => !o)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span className="admin-mobile-title">⚙️ Admin Panel</span>
        <NavLink to="/" className="admin-mobile-store">🛒 Store</NavLink>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="admin-overlay" onClick={close} />}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <p className="admin-sidebar-title">Admin Panel</p>
        {NAV.map(n => (
          <NavLink
            key={n.to} to={n.to} end={n.end}
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

      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}