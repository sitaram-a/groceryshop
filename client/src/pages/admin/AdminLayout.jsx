import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const NAV = [
  { to: '/admin',            label: 'Dashboard',  icon: '📊', end: true },
  { to: '/admin/products',   label: 'Products',   icon: '🛍️' },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { to: '/admin/orders',     label: 'Orders',     icon: '📦' },
  { to: '/admin/coupons',    label: 'Coupons',    icon: '🎟️' },
  { to: '/admin/users',      label: 'Users',      icon: '👥' },
];

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [open, setOpen]         = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const close = () => setOpen(false);

  return (
    <div className="admin-shell">
      <div className="admin-mobile-bar">
        <button className="admin-hamburger" onClick={() => setOpen(o => !o)}>
          {open ? '✕' : '☰'}
        </button>
        <span className="admin-mobile-title">⚙️ Admin Panel</span>
        <NavLink to="/" className="admin-mobile-store">🛒 Store</NavLink>
      </div>

      {isMobile && open && (
        <div onClick={close} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:299 }} />
      )}

      <aside className="admin-sidebar" style={isMobile ? {
        position:'fixed', top:0, left: open ? 0 : -260,
        width:230, height:'100vh', zIndex:300,
        transition:'left 0.25s ease', paddingTop:20,
        background:'#1e293b', overflowY:'auto',
        boxShadow: open ? '4px 0 24px rgba(0,0,0,0.45)' : 'none',
      } : {}}>
        <p className="admin-sidebar-title">Admin Panel</p>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
            onClick={close}>
            <span className="admin-nav-icon">{n.icon}</span>{n.label}
          </NavLink>
        ))}
        <div className="admin-nav-sep" />
        <NavLink to="/" className="admin-nav-item" onClick={close}>
          <span className="admin-nav-icon">🛒</span> View Store
        </NavLink>
        <span className="admin-nav-item" onClick={handleLogout} style={{ cursor:'pointer' }}>
          <span className="admin-nav-icon">🚪</span> Logout
        </span>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}