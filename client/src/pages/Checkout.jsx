import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Checkout.css';

const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    name:    user?.name  || '',
    email:   user?.email || '',
    phone:   '',
    address: '',
    city:    '',
    state:   '',
    pincode: '',
    notes:   '',
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [couponCode,    setCouponCode]    = useState('');
  const [coupon,        setCoupon]        = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError,   setCouponError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const deliveryCharge = cartTotal >= 500 ? 0 : 40;
  const discount = coupon
  ? coupon.type === 'percent'
    ? Math.min((cartTotal * coupon.value) / 100, coupon.max_discount || Infinity)
    : coupon.value
  : 0;
  const grandTotal = Math.max(0, cartTotal + deliveryCharge - discount);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const buildAddress = () => `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`;

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError(''); setCoupon(null);
    try {
      const res = await api.post('/payment/validate-coupon', {
        code: couponCode.trim().toUpperCase(),
        cart_total: cartTotal,
      });
      setCoupon(res.data.coupon);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setCoupon(null); setCouponCode(''); setCouponError(''); };

  // Place order in DB
  const placeOrderInDB = async () => {
    const res = await api.post('/orders/place', {
      delivery_address: buildAddress(),
      notes:            form.notes || null,
      payment_method:   paymentMethod,
      coupon_code:      coupon?.code || null,
      discount_amount:  discount || 0,
    });
    return res.data.order;
  };

  // Cancel order
  const cancelOrderInDB = async (orderId) => {
    try { await api.post(`/orders/${orderId}/cancel`); }
    catch (e) { console.error('Failed to cancel order:', e.message); }
  };

  // Razorpay handler
  const handleRazorpay = (order) => {
    return new Promise(async (resolve, reject) => {
      if (!window.Razorpay) {
        await cancelOrderInDB(order.id);
        return reject(new Error('Razorpay SDK not loaded.'));
      }
      if (!RZP_KEY || RZP_KEY === 'rzp_test_xxxxxxxxxx') {
        await cancelOrderInDB(order.id);
        return reject(new Error('Razorpay key not configured.'));
      }
      try {
        const rzpRes = await api.post('/payment/create-order', {
          amount: Math.round(parseFloat(order.grand_total) * 100),
        });
        const rzpOrder = rzpRes.data.order;
        const options = {
          key:         RZP_KEY,
          amount:      rzpOrder.amount,
          currency:    'INR',
          name:        'GroceryShop',
          description: `Order #${order.order_number}`,
          order_id:    rzpOrder.id,
          prefill:     { name: form.name, email: form.email, contact: form.phone },
          theme:       { color: '#2e7d32' },
          handler: async (response) => {
            try {
              await api.post('/payment/verify', {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                order_id:            order.id,
              });
              resolve();
            } catch (err) {
              await cancelOrderInDB(order.id);
              reject(new Error('Payment verification failed.'));
            }
          },
          modal: {
            ondismiss: async () => {
              await cancelOrderInDB(order.id);
              reject(new Error('Payment cancelled.'));
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async () => {
          await cancelOrderInDB(order.id);
          reject(new Error('Payment failed.'));
        });
        rzp.open();
      } catch (err) {
        await cancelOrderInDB(order.id);
        reject(new Error(err.response?.data?.message || 'Failed to initiate payment.'));
      }
    });
  };

  const handleCOD = async (order) => {
    await api.post('/payment/cod-confirm', { order_id: order.id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.address || !form.city || !form.state || !form.pincode)
      return setError('Please fill in all delivery address fields.');
    if (!cartItems.length) return setError('Your cart is empty.');

    setError(''); setLoading(true);
    try {
      const order = await placeOrderInDB();
      if (paymentMethod === 'razorpay') await handleRazorpay(order);
      else await handleCOD(order);
      clearCart();
      navigate(`/order-success/${order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  if (!cartItems.length) return (
    <div className="checkout-empty">
      <h2>Nothing to checkout</h2>
      <Link to="/shop">Go Shopping</Link>
    </div>
  );

  return (
    <div className="checkout-page">
      <div className="checkout-inner">
        <h1 className="checkout-title">Checkout</h1>
        {error && <div className="checkout-error">{error}</div>}

        <form onSubmit={handleSubmit} className="checkout-layout">
          <div className="checkout-left">

            {/* Delivery Info */}
            <div className="checkout-card">
              <h2>📦 Delivery Details</h2>
              <div className="form-grid-2">
                <div className="fg">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                </div>
                <div className="fg">
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
                </div>
                <div className="fg">
                  <label>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 9876543210" />
                </div>
              </div>
              <div className="fg" style={{ marginTop: 14 }}>
                <label>Street Address</label>
                <input name="address" value={form.address} onChange={handleChange} required placeholder="House No, Street, Area" />
              </div>
              <div className="form-grid-3" style={{ marginTop: 14 }}>
                <div className="fg">
                  <label>City</label>
                  <input name="city" value={form.city} onChange={handleChange} required placeholder="City" />
                </div>
                <div className="fg">
                  <label>State</label>
                  <input name="state" value={form.state} onChange={handleChange} required placeholder="State" />
                </div>
                <div className="fg">
                  <label>Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} required placeholder="400001" maxLength={6} />
                </div>
              </div>
              <div className="fg" style={{ marginTop: 14 }}>
                <label>Order Notes <span className="opt">(optional)</span></label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Any special instructions for delivery..." rows={3} />
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-card">
              <h2>💳 Payment Method</h2>
              <div className="payment-options">
                <label className={`pay-option ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="razorpay"
                    checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                  <div className="pay-icon">💳</div>
                  <div><strong>Pay Online</strong><p>Cards, UPI, Net Banking via Razorpay</p></div>
                </label>
                <label className={`pay-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value="cod"
                    checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <div className="pay-icon">💵</div>
                  <div><strong>Cash on Delivery</strong><p>Pay when your order arrives</p></div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-right">
            <div className="checkout-card order-summary-card">
              <h2>🛒 Order Summary</h2>
              <div className="summary-items">
                {cartItems.map(item => (
                  <div key={item.id} className="summary-item">
                    <span className="si-name">{item.name} × {item.quantity}</span>
                    <span className="si-price">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider" />
              <div className="summary-row">
                <span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span className={deliveryCharge === 0 ? 'free-tag' : ''}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>

              {/* Coupon section */}
              <div className="summary-divider" />
              {!coupon ? (
                <div className="coupon-section">
                  <div className="coupon-input-row">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="coupon-input"
                    />
                    <button type="button" className="coupon-apply-btn"
                      onClick={applyCoupon} disabled={couponLoading}>
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="coupon-error">{couponError}</p>}
                </div>
              ) : (
                <div className="coupon-applied">
                  <span>🎉 <strong>{coupon.code}</strong> applied!</span>
                  <button type="button" onClick={removeCoupon} className="coupon-remove">✕ Remove</button>
                </div>
              )}

              {discount > 0 && (
                <div className="summary-row discount-row">
                  <span>Discount</span>
                  <span className="discount-amount">−₹{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-divider" />
              <div className="summary-row grand">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              <button type="submit" className="place-order-btn" disabled={loading}>
                {loading ? 'Processing...'
                  : paymentMethod === 'razorpay'
                    ? `Pay ₹${grandTotal.toFixed(2)}`
                    : `Place Order ₹${grandTotal.toFixed(2)}`}
              </button>
              <p className="secure-note">🔒 Secure checkout — your data is safe</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}