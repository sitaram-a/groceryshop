import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── Animated counter ── */
function Counter({ to, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, visible]    = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 50);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [visible, to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Floating food emoji ── */
const FLOATERS = ['🍎','🥦','🥕','🍋','🥑','🍇','🌽','🥝','🍓','🧅','🫑','🍊'];

export default function Home() {
  const [featured, setFeatured]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [heroWord, setHeroWord]     = useState(0);
  const [catRef, catVisible]        = useReveal();
  const [featRef, featVisible]      = useReveal();
  const [whyRef, whyVisible]        = useReveal();
  const [statsRef, statsVisible]    = useReveal();

  const HERO_WORDS = ['Fresh 🌿', 'Fast 🚚', 'Affordable 💰', 'Healthy 🥗'];

  useEffect(() => {
    Promise.all([api.get('/products/featured'), api.get('/categories')])
      .then(([p, c]) => { setFeatured(p.data.products || []); setCategories(c.data.categories || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* rotating hero word */
  useEffect(() => {
    const t = setInterval(() => setHeroWord(w => (w + 1) % HERO_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="home-page">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="hero">
        {/* floating food emojis */}
        {FLOATERS.map((e, i) => (
          <span key={i} className="floater" style={{
            left: `${5 + (i * 8) % 90}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${6 + (i % 4)}s`,
            fontSize: `${18 + (i % 3) * 8}px`,
          }}>{e}</span>
        ))}

        <div className="hero-content">
          <div className="hero-tag">🛒 India's Favourite Online Grocery</div>
          <h1>
            Groceries That Are
            <span className="hero-word-wrap">
              <span className="hero-word" key={heroWord}>{HERO_WORDS[heroWord]}</span>
            </span>
          </h1>
          <p>Order fresh produce, dairy, snacks and essentials. Get it delivered fast — right to your door.</p>
          <div className="hero-btns">
            <Link to="/shop" className="hero-btn-primary">
              <span>Shop Now</span> <span className="btn-arrow">→</span>
            </Link>
            <Link to="/register" className="hero-btn-outline">Create Account</Link>
          </div>
          <div className="hero-trust">
            <span>✅ No hidden charges</span>
            <span>✅ Fresh guaranteed</span>
            <span>✅ Easy returns</span>
          </div>
        </div>

        {/* hero visual cards */}
        <div className="hero-visual">
          <div className="hero-card hc1">🥦<br /><small>Veggies</small></div>
          <div className="hero-card hc2">🍎<br /><small>Fruits</small></div>
          <div className="hero-card hc3">🥛<br /><small>Dairy</small></div>
          <div className="hero-card hc4">🍞<br /><small>Bakery</small></div>
          <div className="hero-ring" />
        </div>

        <div className="hero-wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fdf9"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════ */}
      <section className="stats-bar" ref={statsRef}>
        {[
          { value: 5000, suffix: '+', label: 'Happy Customers' },
          { value: 200,  suffix: '+', label: 'Products' },
          { value: 15,   suffix: ' min', label: 'Avg Delivery' },
          { value: 100,  suffix: '%',  label: 'Fresh Guarantee' },
        ].map((s, i) => (
          <div key={i} className={`stat-item ${statsVisible ? 'reveal' : ''}`}
            style={{ transitionDelay: `${i * 0.1}s` }}>
            <div className="stat-num">
              {statsVisible ? <Counter to={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════ */}
      <section className="section" ref={catRef}>
        <div className="section-inner">
          <div className={`section-header ${catVisible ? 'reveal' : ''}`}>
            <div>
              <p className="section-eyebrow">Browse</p>
              <h2>Shop by Category</h2>
            </div>
            <Link to="/shop" className="see-all-btn">View All →</Link>
          </div>

          <div className="category-grid">
            {loading
              ? [...Array(6)].map((_, i) => <div key={i} className="cat-skeleton" />)
              : categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className={`cat-card ${catVisible ? 'reveal' : ''}`}
                  style={{ transitionDelay: `${i * 0.08}s` }}
                >
                  <div className="cat-img-wrap">
                    <div className="cat-img">
                      {cat.image
                        ? <img src={`${API_URL}${cat.image}`} alt={cat.name} />
                        : <span className="cat-emoji">{getCatEmoji(cat.slug)}</span>}
                    </div>
                    <div className="cat-glow" />
                  </div>
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-count-pill">{cat.product_count} items</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PROMO BANNER
      ══════════════════════════════════════ */}
      <section className="promo-banner">
        <div className="promo-inner">
          <div className="promo-text">
            <span className="promo-tag">🎉 Limited Offer</span>
            <h2>Free Delivery on Orders Above ₹500!</h2>
            <p>Stock up on your favourites and save on delivery every time.</p>
            <Link to="/shop" className="promo-btn">Grab the Deal</Link>
          </div>
          <div className="promo-emojis">
            {['🚚','📦','🎁','⚡'].map((e,i) => (
              <span key={i} className="promo-emoji" style={{ animationDelay:`${i*0.3}s` }}>{e}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURED PRODUCTS
      ══════════════════════════════════════ */}
      {(loading || featured.length > 0) && (
        <section className="section section-alt" ref={featRef}>
          <div className="section-inner">
            <div className={`section-header ${featVisible ? 'reveal' : ''}`}>
              <div>
                <p className="section-eyebrow">Handpicked</p>
                <h2>⭐ Featured Products</h2>
              </div>
              <Link to="/shop" className="see-all-btn">See All →</Link>
            </div>
            {loading ? (
              <div className="feat-grid">
                {[...Array(4)].map((_, i) => <div key={i} className="cat-skeleton" style={{ height: 280 }} />)}
              </div>
            ) : (
              <div className="feat-grid">
                {featured.map((p, i) => (
                  <div
                    key={p.id}
                    className={`feat-item ${featVisible ? 'reveal' : ''}`}
                    style={{ transitionDelay: `${i * 0.1}s` }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          WHY US
      ══════════════════════════════════════ */}
      <section className="section why-section" ref={whyRef}>
        <div className="section-inner">
          <div className={`section-header center ${whyVisible ? 'reveal' : ''}`}>
            <div style={{ textAlign:'center', width:'100%' }}>
              <p className="section-eyebrow">Our Promise</p>
              <h2>Why Choose GroceryShop?</h2>
            </div>
          </div>
          <div className="why-grid">
            {[
              { icon:'🌿', title:'100% Fresh',       desc:'Sourced directly from farms and trusted suppliers every day.',  color:'#dcfce7', border:'#86efac' },
              { icon:'🚚', title:'Fast Delivery',     desc:'Same-day or next-day delivery right to your doorstep.',         color:'#dbeafe', border:'#93c5fd' },
              { icon:'💳', title:'Secure Payments',   desc:'Pay safely with Razorpay — cards, UPI, netbanking supported.',  color:'#fef9c3', border:'#fde047' },
              { icon:'🔄', title:'Easy Returns',      desc:'Not happy? We offer hassle-free returns and full refunds.',     color:'#fce7f3', border:'#f9a8d4' },
            ].map((item, i) => (
              <div
                key={i}
                className={`why-card ${whyVisible ? 'reveal' : ''}`}
                style={{ transitionDelay: `${i * 0.12}s`, '--card-bg': item.color, '--card-border': item.border }}
              >
                <div className="why-icon-wrap">
                  <span className="why-icon">{item.icon}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          NEWSLETTER
      ══════════════════════════════════════ */}
      <section className="newsletter">
        <div className="newsletter-inner">
          <h2>🛒 Stay Fresh, Stay Informed</h2>
          <p>Get the latest deals and fresh arrivals straight to your inbox.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address..." />
            <button>Subscribe</button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🛒 GroceryShop</span>
            <p>Fresh groceries, delivered fast.</p>
            <div className="footer-social">
              <span>📘</span><span>📸</span><span>🐦</span>
            </div>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/shop">All Products</Link>
            <Link to="/shop?category=fruits-vegetables">Fruits & Veg</Link>
            <Link to="/shop?category=dairy-eggs">Dairy & Eggs</Link>
            <Link to="/shop?featured=true">Featured</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/cart">My Cart</Link>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <span>📞 1800-000-0000</span>
            <span>✉️ help@groceryshop.com</span>
            <span>🕐 Mon–Sat, 9am–6pm</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} GroceryShop. All rights reserved.</span>
          <span>Made with ❤️ in India</span>
        </div>
      </footer>
    </div>
  );
}

const getCatEmoji = (slug) => {
  const map = {
    'fruits-vegetables':'🥦','dairy-eggs':'🥛','bakery-bread':'🍞',
    'beverages':'🧃','snacks-dry-fruits':'🥜','cooking-essentials':'🧂',
    'meat-seafood':'🍗','personal-care':'🧴',
  };
  return map[slug] || '🛒';
};
