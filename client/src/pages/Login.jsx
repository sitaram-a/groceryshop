import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthAnimated.css';

const FLOATERS = ['🥦','🍎','🥕','🍋','🥑','🍇','🌽','🥝','🍓','🧅','🛒','🥛'];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* floating food emojis */}
      {FLOATERS.map((e, i) => (
        <span key={i} className="auth-floater" style={{
          left:              `${(i * 8.3) % 95}%`,
          animationDelay:    `${i * 0.45}s`,
          animationDuration: `${7 + (i % 4)}s`,
          fontSize:          `${16 + (i % 3) * 8}px`,
        }}>{e}</span>
      ))}

      {/* left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">🛒</div>
          <h2>GroceryShop</h2>
          <p>Fresh groceries delivered to your door</p>
        </div>
        <div className="auth-features">
          {[
            { icon:'🌿', text:'100% Fresh Products' },
            { icon:'🚚', text:'Fast Doorstep Delivery' },
            { icon:'💳', text:'Secure Online Payments' },
            { icon:'🎁', text:'Exclusive Member Offers' },
          ].map((f, i) => (
            <div key={i} className="auth-feature-item" style={{ animationDelay:`${0.2 + i * 0.15}s` }}>
              <span className="af-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
        <div className="auth-left-deco">
          {['🍎','🥦','🥕','🍋','🥑'].map((e, i) => (
            <span key={i} className="deco-emoji" style={{ animationDelay:`${i * 0.6}s` }}>{e}</span>
          ))}
        </div>
      </div>

      {/* right panel — form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-avatar">👋</div>
            <h1>Welcome Back!</h1>
            <p>Sign in to continue shopping</p>
          </div>

          {error && (
            <div className="auth-error-box">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className={`auth-field ${focused === 'email' ? 'focused' : ''} ${form.email ? 'filled' : ''}`}>
              <label>Email Address</label>
              <div className="field-wrap">
                <span className="field-icon">✉️</span>
                <input
                  type="email" name="email"
                  value={form.email} onChange={handleChange}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  placeholder="you@example.com"
                  required
                />
                {form.email && <span className="field-check">✓</span>}
              </div>
            </div>

            {/* Password */}
            <div className={`auth-field ${focused === 'password' ? 'focused' : ''} ${form.password ? 'filled' : ''}`}>
              <label>Password</label>
              <div className="field-wrap">
                <span className="field-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password} onChange={handleChange}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  placeholder="Enter your password"
                  required
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className={`auth-submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? (
                <span className="btn-spinner">
                  <span className="spinner" /> Signing in...
                </span>
              ) : (
                <span>Sign In <span className="btn-arr">→</span></span>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <div className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one free →</Link>
          </div>

          <Link to="/" className="auth-back-home">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
