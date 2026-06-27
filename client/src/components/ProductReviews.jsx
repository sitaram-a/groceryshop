// components/ProductReviews.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ProductReviews.css';

const Stars = ({ value, size = 16, interactive = false, onChange }) => (
  <span className="stars" style={{ fontSize: size }}>
    {[1, 2, 3, 4, 5].map(n => (
      <span
        key={n}
        className={n <= value ? 'star filled' : 'star'}
        style={{ cursor: interactive ? 'pointer' : 'default' }}
        onClick={() => interactive && onChange && onChange(n)}
      >
        {n <= value ? '★' : '☆'}
      </span>
    ))}
  </span>
);

const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rb-row">
      <span className="rb-label">{star}★</span>
      <div className="rb-track"><div className="rb-fill" style={{ width: `${pct}%` }} /></div>
      <span className="rb-count">{count}</span>
    </div>
  );
};

export default function ProductReviews({ productId }) {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [data,       setData]       = useState(null);   // { reviews, avg_rating, review_count, distribution, total }
  const [loading,    setLoading]    = useState(true);
  const [myReview,   setMyReview]   = useState(null);
  const [showForm,   setShowForm]   = useState(false);

  // Form state
  const [rating,     setRating]     = useState(0);
  const [hovered,    setHovered]    = useState(0);
  const [title,      setTitle]      = useState('');
  const [body,       setBody]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg,    setFormMsg]    = useState('');
  const [page,       setPage]       = useState(1);

  const fetchReviews = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/reviews/${productId}?page=${p}&limit=5`);
      setData(res.data);
      setPage(p);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const fetchMyReview = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/reviews/my-review/${productId}`);
      setMyReview(res.data.review || null);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchReviews(1);
    fetchMyReview();
  }, [productId, user]);

  const handleSubmit = async () => {
    if (!user) return navigate('/login');
    if (!rating) return setFormMsg('Please select a rating.');
    setSubmitting(true); setFormMsg('');
    try {
      await api.post(`/reviews/${productId}`, { rating, title, body });
      setShowForm(false); setRating(0); setTitle(''); setBody('');
      setFormMsg('');
      await fetchReviews(1);
      await fetchMyReview();
    } catch (err) {
      setFormMsg(err.response?.data?.message || 'Could not submit review.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setMyReview(null);
      await fetchReviews(1);
    } catch { alert('Could not delete review.'); }
  };

  const fmt = (ts) => new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="pr-section">
      <h2 className="pr-heading">Ratings &amp; Reviews</h2>

      {/* Summary */}
      <div className="pr-summary">
        <div className="pr-avg">
          <span className="pr-big-num">{data?.avg_rating ?? '—'}</span>
          <Stars value={Math.round(parseFloat(data?.avg_rating || 0))} size={22} />
          <span className="pr-count">{data?.review_count ?? 0} review{data?.review_count !== 1 ? 's' : ''}</span>
        </div>
        {data?.distribution && (
          <div className="pr-dist">
            {[5, 4, 3, 2, 1].map(s => (
              <RatingBar key={s} star={s} count={data.distribution[s]} total={data.review_count} />
            ))}
          </div>
        )}
      </div>

      {/* Write / My review */}
      {user && !myReview && !showForm && (
        <button className="pr-write-btn" onClick={() => setShowForm(true)}>
          ✍️ Write a Review
        </button>
      )}

      {showForm && (
        <div className="pr-form">
          <h3>Your Review</h3>
          <div className="pr-star-row">
            {[1, 2, 3, 4, 5].map(n => (
              <span
                key={n}
                className={`pr-star-pick ${n <= (hovered || rating) ? 'filled' : ''}`}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(n)}
              >★</span>
            ))}
            {rating > 0 && <span className="pr-rating-label">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</span>}
          </div>
          <input
            className="pr-input"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
          />
          <textarea
            className="pr-textarea"
            placeholder="Share your experience..."
            rows={4}
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          {formMsg && <p className="pr-msg error">{formMsg}</p>}
          <div className="pr-form-actions">
            <button className="pr-cancel-btn" onClick={() => { setShowForm(false); setFormMsg(''); }}>Cancel</button>
            <button className="pr-submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* User's own review */}
      {myReview && (
        <div className="pr-my-review">
          <div className="pr-review-top">
            <strong>Your Review</strong>
            <Stars value={myReview.rating} size={15} />
            <button className="pr-del-btn" onClick={() => handleDelete(myReview.id)}>Delete</button>
          </div>
          {myReview.title && <p className="pr-review-title">{myReview.title}</p>}
          {myReview.body  && <p className="pr-review-body">{myReview.body}</p>}
          <span className="pr-review-date">{fmt(myReview.created_at)}</span>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="pr-loading">Loading reviews...</div>
      ) : data?.reviews?.length === 0 && !myReview ? (
        <div className="pr-empty">No reviews yet. Be the first to review!</div>
      ) : (
        <div className="pr-list">
          {data?.reviews.map(r => (
            <div key={r.id} className="pr-review-card">
              <div className="pr-review-top">
                <strong>{r.user_name}</strong>
                <Stars value={r.rating} size={14} />
                <span className="pr-review-date">{fmt(r.created_at)}</span>
              </div>
              {r.title && <p className="pr-review-title">{r.title}</p>}
              {r.body  && <p className="pr-review-body">{r.body}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 5 && (
        <div className="pr-pagination">
          <button disabled={page === 1} onClick={() => fetchReviews(page - 1)}>← Prev</button>
          <span>Page {page} of {Math.ceil(data.total / 5)}</span>
          <button disabled={page >= Math.ceil(data.total / 5)} onClick={() => fetchReviews(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}