import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';

const API_URL  = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
const EMPTY_FORM = { category_id:'', name:'', description:'', price:'', discount_price:'', unit:'', stock:'', is_featured:'false', is_active:'true', image: null };

export default function AdminProducts() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [preview, setPreview]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories || []));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 10 });
    if (search) params.set('search', search);
    api.get(`/products?${params}`)
      .then(r => { setProducts(r.data.products || []); setPagination(r.data.pagination || {}); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setPreview(''); setError(''); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      category_id: p.category_id, name: p.name, description: p.description || '',
      price: p.price, discount_price: p.discount_price || '', unit: p.unit || '',
      stock: p.stock, is_featured: String(!!p.is_featured), is_active: String(!!p.is_active), image: null,
    });
    setPreview(p.image ? `${API_URL}${p.image}` : '');
    setError(''); setShowModal(true);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({...f, image: file}));
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.category_id || !form.name || !form.price) return setError('Category, name and price are required.');
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v !== null && v !== '') fd.append(k, v); });
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) await api.put(`/products/${editing.id}`, fd, config);
      else         await api.post('/products', fd, config);
      setShowModal(false); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  const fc = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}));

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Products</h1>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2>All Products {pagination.total !== undefined ? `(${pagination.total})` : ''}</h2>
          <div style={{ display:'flex', gap:10 }}>
            <input className="admin-search" placeholder="Search products..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <button className="btn-primary" onClick={openAdd}>+ Add Product</button>
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? <div className="admin-loading">Loading...</div> : (
            <table className="admin-table">
              <thead>
                <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.image
                        ? <img src={`${API_URL}${p.image}`} alt={p.name} className="tbl-img" />
                        : <div className="tbl-no-img">🛍️</div>}
                    </td>
                    <td><strong>{p.name}</strong>{p.unit && <div style={{fontSize:11,color:'#94a3b8'}}>{p.unit}</div>}</td>
                    <td>{p.category_name}</td>
                    <td>
                      ₹{parseFloat(p.price).toFixed(2)}
                      {p.discount_price && <div style={{fontSize:11,color:'#16a34a'}}>↓ ₹{parseFloat(p.discount_price).toFixed(2)}</div>}
                    </td>
                    <td>
                      <span className={`badge ${p.stock > 5 ? 'badge-green' : p.stock > 0 ? 'badge-yellow' : 'badge-red'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>{p.is_featured ? '⭐' : '—'}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display:'flex', gap:4 }}>
                      <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">✏️</button>
                      <button className="btn-icon" onClick={() => handleDelete(p.id)} title="Delete">🗑️</button>
                    </td>
                  </tr>
                ))}
                {!products.length && <tr><td colSpan={8} className="admin-empty">No products found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
            {[...Array(pagination.totalPages)].map((_,i) => (
              <button key={i+1} className={page===i+1?'active':''} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            <button disabled={page===pagination.totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body admin-form">
              {error && <div style={{background:'#fef2f2',color:'#dc2626',padding:'10px 14px',borderRadius:8,marginBottom:14,fontSize:13}}>{error}</div>}

              <div className="fg">
                <label>Category *</label>
                <select value={form.category_id} onChange={fc('category_id')}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="fg"><label>Product Name *</label><input value={form.name} onChange={fc('name')} placeholder="e.g. Fresh Tomatoes" /></div>
              <div className="fg"><label>Description</label><textarea value={form.description} onChange={fc('description')} rows={3} placeholder="Short product description..." /></div>
              <div className="form-row">
                <div className="fg"><label>Price (₹) *</label><input type="number" step="0.01" value={form.price} onChange={fc('price')} placeholder="0.00" /></div>
                <div className="fg"><label>Discount Price (₹)</label><input type="number" step="0.01" value={form.discount_price} onChange={fc('discount_price')} placeholder="Optional" /></div>
              </div>
              <div className="form-row">
                <div className="fg"><label>Unit</label><input value={form.unit} onChange={fc('unit')} placeholder="e.g. 1 kg, 500g" /></div>
                <div className="fg"><label>Stock</label><input type="number" value={form.stock} onChange={fc('stock')} placeholder="0" /></div>
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>Featured</label>
                  <select value={form.is_featured} onChange={fc('is_featured')}>
                    <option value="false">No</option>
                    <option value="true">Yes ⭐</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Status</label>
                  <select value={form.is_active} onChange={fc('is_active')}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="fg">
                <label>Image {editing ? '(leave blank to keep current)' : ''}</label>
                <input type="file" accept="image/*" onChange={handleFile} />
                {preview && <img src={preview} alt="preview" className="img-preview" />}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
