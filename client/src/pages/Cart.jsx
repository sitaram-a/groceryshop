import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

export default function Cart() {
  const { cartItems, cartLoading, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const deliveryCharge = cartTotal >= 500 ? 0 : 40;
  const grandTotal     = cartTotal + deliveryCharge;

  // Fix image URL — Cloudinary images are already full URLs
  const getImageUrl = (image) => {
    if (!image) return 'https://placehold.co/80x80/e8f5e9/2e7d32?text=No+Img';
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    // fallback for local uploads
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${base}${image}`;
  };

  if (cartLoading) return (
    <div className="cart-page">
      <div className="cart-loading">Loading your cart...</div>
    </div>
  );

  if (!cartItems.length) return (
    <div className="cart-page">
      <div className="cart-empty">
        <div className="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="shop-link-btn">Browse Products</Link>
      </div>
    </div>
  );

  return (
    <div className="cart-page">
      <div className="cart-inner">
        <div className="cart-header">
          <h1>My Cart <span>({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span></h1>
          <button className="clear-cart-btn" onClick={clearCart}>Clear Cart</button>
        </div>

        <div className="cart-layout">
          {/* ── Items ── */}
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="item-img"
                  onError={e => { e.target.src = 'https://placehold.co/80x80/e8f5e9/2e7d32?text=No+Img'; }}
                />
                <div className="item-details">
                  <p className="item-name">{item.name}</p>
                  {item.unit && <p className="item-unit">{item.unit}</p>}
                  <p className="item-price">₹{parseFloat(item.price).toFixed(2)}</p>

                  {/* Mobile: qty + subtotal inside details */}
                  <div className="item-bottom-row">
                    <div className="item-qty">
                      <button onClick={() => item.quantity > 1
                        ? updateQuantity(item.id, item.quantity - 1)
                        : removeFromCart(item.id)}>−</button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >+</button>
                    </div>
                    <div className="item-subtotal">
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
                <button className="item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
              </div>
            ))}
          </div>

          {/* ── Summary ── */}
          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className={deliveryCharge === 0 ? 'free' : ''}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
            {deliveryCharge > 0 && (
              <p className="free-delivery-note">
                Add ₹{(500 - cartTotal).toFixed(2)} more for free delivery
              </p>
            )}
            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
            <button className="checkout-btn" onClick={() => navigate('/checkout')}>
              Proceed to Checkout →
            </button>
            <Link to="/shop" className="continue-shopping">← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}