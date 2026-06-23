import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from './AdminLayout';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
const EMPTY_FORM = { name: '', image: null };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [preview, setPreview]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    api.get('/categories').then(r => setCategories(r.data.categories || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setPreview(''); setError(''); setShowModal(true); };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, image: null });
    setPreview(cat.image ? `${API_URL}${cat.image}` : '');
    setError('');
    setShowModal(true);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Category name is required.');
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (form.image) fd.append('image', form.image);
      if (editing) {
        await api.put(`/categories/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally { setSaving(false); }
  };

  const handleToggle = async (cat) => {
    await api.put(`/categories/${cat.id}`, { name: cat.name, is_active: cat.is_active ? 0 : 1 });
    load();
  };

  return (
    <AdminLayout>
      <h1 className="admin-page-title">Categories</h1>

      <div className="admin-card">
        <div className="admin-card-header">
          <h2>All Categories ({categories.length})</h2>
          <button className="btn-primary" onClick={openAdd}>+ Add Category</button>
        </div>
        <div className="admin-table-wrap">
          {loading ? <div className="admin-loading">Loading...</div> : (
            <table className="admin-table">
              <thead>
                <tr><th>Image</th><th>Name</th><th>Slug</th><th>Products</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>
                      {cat.image
                        ? <img src={`${API_URL}${cat.image}`} alt={cat.name} className="tbl-img" />
                        : <div className="tbl-no-img">🗂️</div>}
                    </td>
                    <td><strong>{cat.name}</strong></td>
                    <td style={{ color:'#94a3b8', fontSize:12 }}>{cat.slug}</td>
                    <td>{cat.product_count}</td>
                    <td>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={!!cat.is_active} onChange={() => handleToggle(cat)} />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => openEdit(cat)} title="Edit">✏️</button>
                    </td>
                  </tr>
                ))}
                {!categories.length && <tr><td colSpan={6} className="admin-empty">No categories found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body admin-form">
              {error && <div style={{ background:'#fef2f2',color:'#dc2626',padding:'10px 14px',borderRadius:8,marginBottom:14,fontSize:13 }}>{error}</div>}
              <div className="fg">
                <label>Category Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Fruits & Vegetables" />
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
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
