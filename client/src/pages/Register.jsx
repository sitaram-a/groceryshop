import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthAnimated.css';

const FLOATERS = ['🍓','🥝','🍊','🫑','🧄','🍇','🥬','🍑','🥒','🍒','🌶️','🫐'];

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]         = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState('');
  const [step, setStep]         = useState(1); // 1 = personal info, 2 = credentials

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Please enter your full name.');
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ['','Weak','Fair','Good','Strong','Very Strong'][strength];
  const strengthColor = ['','#ef4444','#f59e0b','#3b82f6','#16a34a','#15803d'][strength];

  return (
    <div className="auth-page">
      {FLOATERS.map((e, i) => (
        <span key={i} className="auth-floater" style={{
          left:              `${(i * 8.1) % 95}%`,
          animationDelay:    `${i * 0.4}s`,
          animationDuration: `${6 + (i % 5)}s`,
          fontSize:          `${14 + (i % 3) * 7}px`,
        }}>{e}</span>
      ))}

      {/* left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-logo">🛒</div>
          <h2>GroceryShop</h2>
          <p>Join thousands of happy shoppers</p>
        </div>
        <div className="auth-features">
          {[
            { icon:'🎁', text:'Exclusive Member Discounts' },
            { icon:'📦', text:'Track Your Orders Live' },
            { icon:'⭐', text:'Save Favourite Products' },
            { icon:'🔔', text:'Get Deal Alerts First' },
          ].map((f, i) => (
            <div key={i} className="auth-feature-item" style={{ animationDelay:`${0.2 + i * 0.15}s` }}>
              <span className="af-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
        <div className="auth-left-deco">
          {['🍓','🥝','🍊','🫑','🧄'].map((e, i) => (
            <span key={i} className="deco-emoji" style={{ animationDelay:`${i * 0.6}s` }}>{e}</span>
          ))}
        </div>
      </div>

      {/* right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-avatar">✨</div>
            <h1>Create Account</h1>
            <p>Fresh groceries await you!</p>
          </div>

          {/* step indicator */}
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>
              <span>1</span>
              <label>Your Info</label>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>
              <span>2</span>
              <label>Credentials</label>
            </div>
          </div>

          {error && (
            <div className="auth-error-box">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="auth-form step-slide-in">
              <div className={`auth-field ${focused==='name' ? 'focused':''} ${form.name ? 'filled':''}`}>
                <label>Full Name *</label>
                <div className="field-wrap">
                  <span className="field-icon">👤</span>
                  <input name="name" value={form.name} onChange={handleChange}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                    placeholder="John Doe" required />
                  {form.name && <span className="field-check">✓</span>}
                </div>
              </div>

              <div className={`auth-field ${focused==='phone' ? 'focused':''} ${form.phone ? 'filled':''}`}>
                <label>Phone Number <span className="opt-label">(optional)</span></label>
                <div className="field-wrap">
                  <span className="field-icon">📱</span>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    onFocus={() => setFocused('phone')} onBlur={() => setFocused('')}
                    placeholder="+91 9876543210" />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Continue <span className="btn-arr">→</span></span>
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="auth-form step-slide-in">
              <div className={`auth-field ${focused==='email' ? 'focused':''} ${form.email ? 'filled':''}`}>
                <label>Email Address *</label>
                <div className="field-wrap">
                  <span className="field-icon">✉️</span>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                    placeholder="you@example.com" required />
                  {form.email && <span className="field-check">✓</span>}
                </div>
              </div>

              <div className={`auth-field ${focused==='password' ? 'focused':''} ${form.password ? 'filled':''}`}>
                <label>Password *</label>
                <div className="field-wrap">
                  <span className="field-icon">🔒</span>
                  <input type={showPass ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                    placeholder="Min. 6 characters" required />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.password && (
                  <div className="strength-bar">
                    <div className="strength-track">
                      <div className="strength-fill" style={{ width:`${(strength/5)*100}%`, background: strengthColor }} />
                    </div>
                    <span style={{ color: strengthColor, fontSize:11, fontWeight:700 }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <div className={`auth-field ${focused==='confirmPassword' ? 'focused':''} ${form.confirmPassword ? 'filled':''}`}>
                <label>Confirm Password *</label>
                <div className="field-wrap">
                  <span className="field-icon">🔐</span>
                  <input type={showPass ? 'text' : 'password'} name="confirmPassword"
                    value={form.confirmPassword} onChange={handleChange}
                    onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused('')}
                    placeholder="Re-enter password" required />
                  {form.confirmPassword && (
                    <span className="field-check" style={{ color: form.password === form.confirmPassword ? '#16a34a' : '#ef4444' }}>
                      {form.password === form.confirmPassword ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" className="auth-back-btn" onClick={() => { setStep(1); setError(''); }}>
                  ← Back
                </button>
                <button type="submit" className={`auth-submit-btn ${loading ? 'loading' : ''}`} disabled={loading} style={{ flex:1 }}>
                  {loading ? (
                    <span className="btn-spinner"><span className="spinner" /> Creating...</span>
                  ) : (
                    <span>Create Account 🎉</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="auth-divider"><span>or</span></div>
          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in →</Link>
          </div>
          <Link to="/" className="auth-back-home">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
