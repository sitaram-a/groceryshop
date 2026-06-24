import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';
import './Dashboard.css';

const STATUS_BADGE = {
  placed:           'badge-blue',
  confirmed:        'badge-green',
  processing:       'badge-yellow',
  out_for_delivery: 'badge-yellow',
  delivered:        'badge-green',
  cancelled:        'badge-red',
};

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Dashboard</h1>

      {loading ? <div className="admin-loading">Loading stats...</div> : (
        <>
          {/* Stat cards */}
          <div className="admin-stats-grid">
            {[
              { icon:'📦', label:'Total Orders',  value: stats.totalOrders   ?? '0', sub: `${stats.pendingOrders ?? 0} pending` },
              { icon:'💰', label:'Total Revenue', value: `₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`, sub: 'from paid orders' },
              { icon:'🛍️', label:'Products',      value: stats.totalProducts ?? '0', sub: `${stats.lowStock ?? 0} low stock` },
              { icon:'👥', label:'Customers',     value: stats.totalUsers    ?? '0', sub: 'registered users' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Recent Orders — full width */}
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h2>Recent Orders</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentOrders || []).map(o => (
                    <tr key={o.id}>
                      <td><strong>#{o.order_number}</strong></td>
                      <td>{o.customer_name}</td>
                      <td>₹{parseFloat(o.grand_total).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[o.order_status] || 'badge-gray'}`}>
                          {o.order_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                  {!data?.recentOrders?.length && (
                    <tr><td colSpan={6} className="admin-empty">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom grid — Top Products + Monthly Sales */}
          <div className="dashboard-bottom-grid">
            <div className="admin-card">
              <div className="admin-card-header"><h2>Top Selling Products</h2></div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Product</th><th>Sold</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {(data?.topProducts || []).map((p, i) => (
                      <tr key={i}>
                        <td>{p.name}</td>
                        <td><strong>{p.total_sold}</strong></td>
                        <td>₹{parseFloat(p.revenue).toFixed(0)}</td>
                      </tr>
                    ))}
                    {!data?.topProducts?.length && (
                      <tr><td colSpan={3} className="admin-empty">No sales data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header"><h2>Monthly Revenue (Last 6 months)</h2></div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Month</th><th>Orders</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {(data?.monthlySales || []).map((m, i) => (
                      <tr key={i}>
                        <td>{m.month}</td>
                        <td>{m.orders}</td>
                        <td>₹{parseFloat(m.revenue).toFixed(0)}</td>
                      </tr>
                    ))}
                    {!data?.monthlySales?.length && (
                      <tr><td colSpan={3} className="admin-empty">No revenue data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}