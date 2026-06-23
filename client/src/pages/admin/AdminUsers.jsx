import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const LIMIT = 15;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search) params.set('search', search);
    api.get(`/admin/users?${params}`)
      .then(r => { setUsers(r.data.users || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  const handleToggle = async (user) => {
    await api.put(`/admin/users/${user.id}/toggle`);
    load();
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Users</h1>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2>All Customers ({total})</h2>
          <input
            className="admin-search"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="admin-table-wrap">
          {loading ? <div className="admin-loading">Loading...</div> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color:'#94a3b8', fontSize:12 }}>
                      {(page - 1) * LIMIT + i + 1}
                    </td>
                    <td><strong>{u.name}</strong></td>
                    <td style={{ color:'#475569' }}>{u.email}</td>
                    <td style={{ color:'#94a3b8' }}>{u.phone || '—'}</td>
                    <td>
                      <span className="badge badge-blue">{u.order_count}</span>
                    </td>
                    <td style={{ fontSize:12, color:'#94a3b8' }}>
                      {new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td>
                      <label className="toggle-switch" title={u.is_active ? 'Block user' : 'Activate user'}>
                        <input
                          type="checkbox"
                          checked={!!u.is_active}
                          onChange={() => handleToggle(u)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={8} className="admin-empty">No users found.</td>
                  </tr>
                )}
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
              >{i + 1}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
