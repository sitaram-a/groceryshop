import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';

const EMPTY = { code:'', type:'percent', value:'', min_order:'', max_discount:'', expires_at:'', usage_limit:'' };

export default function AdminCoupons() {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/coupons')
      .then(r => setCoupons(r.data.coupons || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async () => {
    if (!form.code || !form.value) return setError('Code and value are required.');
    setSaving(true); setError('');
    try {
      await api.post('/admin/coupons', form);
      setShowModal(false); setForm(EMPTY); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create coupon.');
    } finally { setSaving(false); }
  };

  const toggleCoupon = async (id, is_active) => {
    await api.put(`/admin/coupons/${id}`, { is_active: !is_active });
    load();
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    await api.delete(`/admin/coupons/${id}`);
    load();
  };

  const fc = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Coupons</h1>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2>All Coupons ({coupons.length})</h2>
          <button className="btn-primary" onClick={() => { setForm(EMPTY); setError(''); setShowModal(true); }}>
            + Create Coupon
          </button>
        </div>

        <div className="admin-table-wrap">
          {loading ? <div className="admin-loading">Loading...</div> : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th><th>Type</th><th>Value</th><th>Min Order</th>
                  <th>Expires</th><th>Used</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td><strong style={{ fontFamily:'monospace', fontSize:14 }}>{c.code}</strong></td>
                    <td>{c.discount_type === 'percent' ? 'Percentage' : 'Flat'}</td>
<td>
  <strong>{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}</strong>
  {c.max_discount && <div style={{fontSize:11,color:'#94a3b8'}}>max ₹{c.max_discount}</div>}
</td>
                    <td>{c.min_order > 0 ? `₹${c.min_order}` : '—'}</td>
                    <td style={{fontSize:12}}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td>{c.used_count || 0}{c.usage_limit ? `/${c.usage_limit}` : ''}</td>
                    <td>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={!!c.is_active} onChange={() => toggleCoupon(c.id, c.is_active)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => deleteCoupon(c.id)} title="Delete">🗑️</button>
                    </td>
                  </tr>
                ))}
                {!coupons.length && <tr><td colSpan={8} className="admin-empty">No coupons yet</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Coupon</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body admin-form">
              {error && <div style={{background:'#fef2f2',color:'#dc2626',padding:'10px 14px',borderRadius:8,marginBottom:14,fontSize:13}}>{error}</div>}
              <div className="fg"><label>Coupon Code *</label>
                <input value={form.code} onChange={fc('code')} placeholder="e.g. SAVE20" style={{textTransform:'uppercase'}} /></div>
              <div className="form-row">
                <div className="fg"><label>Type *</label>
                  <select value={form.type} onChange={fc('type')}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="fg"><label>Value *</label>
                  <input type="number" value={form.value} onChange={fc('value')}
                    placeholder={form.type === 'percent' ? 'e.g. 20 for 20%' : 'e.g. 50 for ₹50'} /></div>
              </div>
              <div className="form-row">
                <div className="fg"><label>Min Order Amount (₹)</label>
                  <input type="number" value={form.min_order} onChange={fc('min_order')} placeholder="0" /></div>
                {form.type === 'percent' && (
                  <div className="fg"><label>Max Discount (₹)</label>
                    <input type="number" value={form.max_discount} onChange={fc('max_discount')} placeholder="Optional" /></div>
                )}
              </div>
              <div className="form-row">
                <div className="fg"><label>Expires At</label>
                  <input type="date" value={form.expires_at} onChange={fc('expires_at')} /></div>
                <div className="fg"><label>Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={fc('usage_limit')} placeholder="Unlimited" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}