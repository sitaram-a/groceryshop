import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm_password:'' });
  const [saving,    setSaving]    = useState(false);
  const [pwSaving,  setPwSaving]  = useState(false);
  const [msg,       setMsg]       = useState('');
  const [pwMsg,     setPwMsg]     = useState('');
  const [error,     setError]     = useState('');
  const [pwError,   setPwError]   = useState('');
  const [tab,       setTab]       = useState('profile');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      const res = await api.put('/auth/profile', { name: form.name, phone: form.phone });
      setUser(res.data.user);
      setMsg('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password)
      return setPwError('New passwords do not match.');
    if (pwForm.new_password.length < 6)
      return setPwError('Password must be at least 6 characters.');

    setPwSaving(true); setPwMsg(''); setPwError('');
    try {
      await api.put('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      setPwMsg('Password changed successfully!');
      setPwForm({ current_password:'', new_password:'', confirm_password:'' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally { setPwSaving(false); }
  };

  return (
    <div className="profile-page">
      <div className="profile-inner">
        <div className="profile-header">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <h1>{user?.name}</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
            👤 Profile Info
          </button>
          <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}>
            🔒 Change Password
          </button>
        </div>

        {tab === 'profile' && (
          <div className="profile-card">
            <h2>Personal Information</h2>
            {msg   && <div className="profile-success">{msg}</div>}
            {error && <div className="profile-error">{error}</div>}
            <form onSubmit={handleUpdate} className="profile-form">
              <div className="pf-group">
                <label>Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Your full name" required />
              </div>
              <div className="pf-group">
                <label>Email <span className="pf-readonly">(cannot be changed)</span></label>
                <input value={form.email} disabled className="pf-disabled" />
              </div>
              <div className="pf-group">
                <label>Phone Number</label>
                <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                  placeholder="+91 9876543210" />
              </div>
              <button type="submit" className="pf-save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {tab === 'password' && (
          <div className="profile-card">
            <h2>Change Password</h2>
            {pwMsg   && <div className="profile-success">{pwMsg}</div>}
            {pwError && <div className="profile-error">{pwError}</div>}
            <form onSubmit={handlePassword} className="profile-form">
              <div className="pf-group">
                <label>Current Password</label>
                <input type="password" value={pwForm.current_password}
                  onChange={e => setPwForm(f => ({...f, current_password: e.target.value}))}
                  placeholder="Enter current password" required />
              </div>
              <div className="pf-group">
                <label>New Password</label>
                <input type="password" value={pwForm.new_password}
                  onChange={e => setPwForm(f => ({...f, new_password: e.target.value}))}
                  placeholder="Minimum 6 characters" required />
              </div>
              <div className="pf-group">
                <label>Confirm New Password</label>
                <input type="password" value={pwForm.confirm_password}
                  onChange={e => setPwForm(f => ({...f, confirm_password: e.target.value}))}
                  placeholder="Repeat new password" required />
              </div>
              <button type="submit" className="pf-save-btn" disabled={pwSaving}>
                {pwSaving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}