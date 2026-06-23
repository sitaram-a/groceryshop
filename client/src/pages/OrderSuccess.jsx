import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="os-page">
      <div className="os-loading">Loading order details...</div>
    </div>
  );

  return (
    <div className="os-page">
      <div className="os-card">
        {/* Success animation */}
        <div className="os-icon">✅</div>
        <h1>Order Placed Successfully!</h1>
        <p className="os-sub">Thank you for shopping with GroceryShop. A confirmation email has been sent to you.</p>

        {order && (
          <>
            <div className="os-info-box">
              <div className="os-info-row">
                <span>Order Number</span>
                <strong>#{order.order_number}</strong>
              </div>
              <div className="os-info-row">
                <span>Payment</span>
                <strong className={order.payment_status === 'paid' ? 'paid' : 'pending-pay'}>
                  {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Cash on Delivery'}
                </strong>
              </div>
              <div className="os-info-row">
                <span>Status</span>
                <strong className="status-badge">{order.order_status.replace(/_/g, ' ')}</strong>
              </div>
              <div className="os-info-row">
                <span>Grand Total</span>
                <strong className="grand-amt">₹{parseFloat(order.grand_total).toFixed(2)}</strong>
              </div>
              <div className="os-info-row">
                <span>Deliver To</span>
                <strong>{order.delivery_address}</strong>
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="os-items">
                <h3>Items Ordered</h3>
                {order.items.map(item => (
                  <div key={item.id} className="os-item">
                    <span className="oi-name">{item.product_name}</span>
                    <span className="oi-qty">× {item.quantity}</span>
                    <span className="oi-price">₹{parseFloat(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="os-actions">
          <Link to="/orders" className="os-btn-outline">View My Orders</Link>
          <Link to="/shop"   className="os-btn-solid">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
