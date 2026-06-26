import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './OrderSuccess.css';

const STEPS = [
  { key: 'placed',           label: 'Order Placed',     icon: '📋' },
  { key: 'confirmed',        label: 'Confirmed',         icon: '✅' },
  { key: 'processing',       label: 'Processing',        icon: '⚙️' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: '🚚' },
  { key: 'delivered',        label: 'Delivered',         icon: '🎉' },
];

const getStepIndex = (status) => {
  if (status === 'cancelled') return -1;
  return STEPS.findIndex(s => s.key === status);
};

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="os-page"><div className="os-loading">Loading order details...</div></div>;

  const currentStep = order ? getStepIndex(order.order_status) : 0;
  const isCancelled = order?.order_status === 'cancelled';

  return (
    <div className="os-page">
      <div className="os-card">
        <div className="os-icon">{isCancelled ? '❌' : '✅'}</div>
        <h1>{isCancelled ? 'Order Cancelled' : 'Order Placed Successfully!'}</h1>
        <p className="os-sub">
          {isCancelled
            ? 'Your order has been cancelled and stock has been restored.'
            : 'Thank you for shopping with GroceryShop. A confirmation email has been sent to you.'}
        </p>

        {order && (
          <>
            <div className="os-info-box">
              <div className="os-info-row"><span>Order Number</span><strong>#{order.order_number}</strong></div>
              <div className="os-info-row">
                <span>Payment</span>
                <strong className={order.payment_status === 'paid' ? 'paid' : 'pending-pay'}>
                  {order.payment_status === 'paid' ? '✓ Paid Online' : '⏳ Cash on Delivery'}
                </strong>
              </div>
              <div className="os-info-row">
                <span>Grand Total</span>
                <strong className="grand-amt">₹{parseFloat(order.grand_total).toFixed(2)}</strong>
              </div>
              <div className="os-info-row"><span>Deliver To</span><strong>{order.delivery_address}</strong></div>
            </div>

            {/* Order Tracking Timeline */}
            {!isCancelled && (
              <div className="os-timeline">
                <h3>Order Tracking</h3>
                <div className="timeline-steps">
                  {STEPS.map((step, i) => {
                    const done    = i <= currentStep;
                    const current = i === currentStep;
                    return (
                      <div key={step.key} className={`timeline-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                        <div className="step-icon-wrap">
                          <div className="step-icon">{done ? step.icon : '○'}</div>
                          {i < STEPS.length - 1 && <div className={`step-line ${i < currentStep ? 'done' : ''}`} />}
                        </div>
                        <div className="step-label">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Items */}
            {order.items?.length > 0 && (
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