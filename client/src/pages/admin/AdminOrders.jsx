import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';

const STATUS_BADGE = {
  placed:           'badge-blue',
  confirmed:        'badge-green',
  processing:       'badge-yellow',
  out_for_delivery: 'badge-yellow',
  delivered:        'badge-green',
  cancelled:        'badge-red',
};

const ALL_STATUSES = [
  'placed', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'
];

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
});

export default function AdminOrders() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [expanded,     setExpanded]     = useState(null);
  const [orderItems,   setOrderItems]   = useState({});   // { orderId: items[] }
  const [itemsLoading, setItemsLoading] = useState({});   // { orderId: bool }
  const [updating,     setUpdating]     = useState({});   // { orderId: bool }
  const [statusMap,    setStatusMap]    = useState({});   // local status overrides

  const LIMIT = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (filterStatus) params.set('status', filterStatus);
    api.get(`/orders?${params}`)
      .then(r => {
        const fetched = r.data.orders || [];
        setOrders(fetched);
        setTotal(r.data.total || 0);
        // Seed local statusMap so dropdowns reflect real DB values
        const map = {};
        fetched.forEach(o => { map[o.id] = o.order_status; });
        setStatusMap(map);
      })
      .catch(err => console.error('Load orders error:', err))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  useEffect(load, [load]);

  /* ── Load expanded order items ── */
  const loadItems = async (orderId) => {
    if (orderItems[orderId]) return;          // already fetched
    setItemsLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrderItems(prev => ({ ...prev, [orderId]: res.data.order?.items || [] }));
    } catch (err) {
      console.error('Load items error:', err);
      setOrderItems(prev => ({ ...prev, [orderId]: [] }));
    } finally {
      setItemsLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    loadItems(id);
  };

  /* ── Update order status ── */
  const handleStatusChange = async (orderId, newStatus) => {
    if (updating[orderId]) return;

    // Optimistic update so dropdown doesn't snap back
    setStatusMap(prev => ({ ...prev, [orderId]: newStatus }));
    setUpdating(prev => ({ ...prev, [orderId]: true }));

    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      // Also update the orders array so the badge refreshes
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o)
      );
    } catch (err) {
      // Rollback on failure
      setStatusMap(prev => ({
        ...prev,
        [orderId]: orders.find(o => o.id === orderId)?.order_status || newStatus,
      }));
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Orders</h1>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2>All Orders ({total})</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              className="status-select"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div className="admin-loading">Loading...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Update Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="admin-empty">No orders found.</td></tr>
                )}

                {orders.map(o => {
                  const isOpen       = expanded === o.id;
                  const currentStatus = statusMap[o.id] ?? o.order_status;
                  const isUpdating   = !!updating[o.id];

                  return (
                    /* ⚠️  Key on <tbody> rows, NOT on fragments */
                    <tbody key={o.id}>
                      {/* ── Main row ── */}
                      <tr
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleExpand(o.id)}
                      >
                        <td style={{ width: 28, color: '#94a3b8', fontSize: 11 }}>
                          {isOpen ? '▲' : '▼'}
                        </td>
                        <td><strong>#{o.order_number}</strong></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.customer_email}</div>
                        </td>
                        <td><strong>₹{parseFloat(o.grand_total).toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${
                            o.payment_status === 'paid'   ? 'badge-green' :
                            o.payment_status === 'failed' ? 'badge-red'   : 'badge-yellow'
                          }`}>
                            {o.payment_status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[currentStatus] || 'badge-gray'}`}>
                            {currentStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmt(o.created_at)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="status-select"
                            value={currentStatus}
                            disabled={isUpdating}
                            onChange={e => handleStatusChange(o.id, e.target.value)}
                            style={{ opacity: isUpdating ? 0.6 : 1 }}
                          >
                            {ALL_STATUSES.map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                          {isUpdating && (
                            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>
                              saving...
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* ── Expanded items row ── */}
                      {isOpen && (
                        <tr>
                          <td colSpan={8} style={{ background: '#f8fafc', padding: 0 }}>
                            <div style={{ padding: '14px 20px' }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>
                                📍 {o.delivery_address}
                              </p>

                              {itemsLoading[o.id] ? (
                                <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading items...</p>
                              ) : orderItems[o.id]?.length > 0 ? (
                                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ background: '#f1f5f9' }}>
                                      <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Item</th>
                                      <th style={{ padding: '7px 12px', textAlign: 'center', color: '#475569' }}>Qty</th>
                                      <th style={{ padding: '7px 12px', textAlign: 'right', color: '#475569' }}>Unit Price</th>
                                      <th style={{ padding: '7px 12px', textAlign: 'right', color: '#475569' }}>Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {orderItems[o.id].map(item => (
                                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px 12px' }}>{item.product_name}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(item.subtotal).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p style={{ color: '#94a3b8', fontSize: 13 }}>No items found.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={page === i + 1 ? 'active' : ''}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}