import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './OrderHistory.css';

const STATUS_COLOR = {
  placed:           { bg: '#eff6ff', color: '#1d4ed8' },
  confirmed:        { bg: '#f0fdf4', color: '#15803d' },
  processing:       { bg: '#fff7ed', color: '#c2410c' },
  out_for_delivery: { bg: '#fefce8', color: '#a16207' },
  delivered:        { bg: '#f0fdf4', color: '#166534' },
  cancelled:        { bg: '#fef2f2', color: '#b91c1c' },
};

export default function OrderHistory() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(res => setOrders(res.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="oh-page"><div className="oh-loading">Loading your orders...</div></div>
  );

  if (!orders.length) return (
    <div className="oh-page">
      <div className="oh-empty">
        <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
        <h2>No orders yet</h2>
        <p>You haven't placed any orders yet.</p>
        <Link to="/shop" className="oh-shop-btn">Start Shopping</Link>
      </div>
    </div>
  );

  return (
    <div className="oh-page">
      <div className="oh-inner">
        <h1>My Orders <span>({orders.length})</span></h1>

        <div className="oh-list">
          {orders.map(order => {
            const st = STATUS_COLOR[order.order_status] || STATUS_COLOR.placed;
            const isOpen = expanded === order.id;

            return (
              <div key={order.id} className="oh-card">
                {/* Card Header */}
                <div className="oh-card-header" onClick={() => setExpanded(isOpen ? null : order.id)}>
                  <div className="oh-left">
                    <strong className="oh-num">#{order.order_number}</strong>
                    <span className="oh-date">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="oh-right">
                    <span className="oh-status" style={{ background: st.bg, color: st.color }}>
                      {order.order_status.replace(/_/g, ' ')}
                    </span>
                    <span className="oh-total">₹{parseFloat(order.grand_total).toFixed(2)}</span>
                    <span className="oh-toggle">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isOpen && (
                  <div className="oh-card-body">
                    <div className="oh-meta">
                      <div className="oh-meta-row">
                        <span>Payment</span>
                        <strong className={order.payment_status === 'paid' ? 'paid' : 'cod-txt'}>
                          {order.payment_status === 'paid' ? '✓ Paid Online' : '⏳ Cash on Delivery'}
                        </strong>
                      </div>
                      <div className="oh-meta-row">
                        <span>Deliver To</span>
                        <strong>{order.delivery_address}</strong>
                      </div>
                      <div className="oh-meta-row">
                        <span>Items</span>
                        <strong>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</strong>
                      </div>
                    </div>
                    <Link to={`/order-success/${order.id}`} className="oh-detail-btn">
                      View Full Details →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
