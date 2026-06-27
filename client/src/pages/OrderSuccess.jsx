import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import './OrderSuccess.css';

const ALL_STEPS = [
  { key: 'placed',           label: 'Order Placed',    icon: '📋' },
  { key: 'confirmed',        label: 'Confirmed',        icon: '✅' },
  { key: 'processing',       label: 'Processing',       icon: '⚙️'  },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
  { key: 'delivered',        label: 'Delivered',        icon: '🎉' },
];

const getStepIndex = (status) => {
  if (status === 'cancelled') return -1;
  return ALL_STEPS.findIndex(s => s.key === status);
};

const fmt = (ts) =>
  new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function OrderSuccess() {
  const { id } = useParams();
  const [order,   setOrder]   = useState(null);
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

  // Build a map: status -> timeline entry (for timestamps)
  const timelineMap = {};
  (order?.timeline || []).forEach(t => { timelineMap[t.status] = t; });

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

            {/* ── Order Tracking Timeline ── */}
            {!isCancelled && (
              <div className="os-timeline">
                <h3>Order Tracking</h3>
                <div className="timeline-steps">
                  {ALL_STEPS.map((step, i) => {
                    const done    = i <= currentStep;
                    const current = i === currentStep;
                    const entry   = timelineMap[step.key];
                    return (
                      <div key={step.key} className={`timeline-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                        <div className="step-icon-wrap">
                          <div className="step-icon">{done ? step.icon : '○'}</div>
                          {i < ALL_STEPS.length - 1 && (
                            <div className={`step-line ${i < currentStep ? 'done' : ''}`} />
                          )}
                        </div>
                        <div className="step-label">{step.label}</div>
                        {entry && (
                          <div className="step-timestamp">{fmt(entry.created_at)}</div>
                        )}
                        {entry?.note && (
                          <div className="step-note">{entry.note}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isCancelled && timelineMap['cancelled'] && (
              <div className="os-cancelled-info">
                <span>❌ Cancelled on {fmt(timelineMap['cancelled'].created_at)}</span>
                {timelineMap['cancelled'].note && <p>{timelineMap['cancelled'].note}</p>}
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