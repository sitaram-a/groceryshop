import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [qty, setQty]         = useState(1);
  const [adding, setAdding]   = useState(false);
  const [added, setAdded]     = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(res => setProduct(res.data.product))
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    const result = await addToCart(product.id, qty);
    setAdding(false);
    if (result?.needsLogin) return navigate('/login');
    if (result?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) return (
    <div className="pd-loading">
      <div className="pd-skeleton-img" />
      <div className="pd-skeleton-info">
        {[...Array(5)].map((_, i) => <div key={i} className="pd-skeleton-line" style={{ width: `${90 - i * 15}%` }} />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="pd-error">
      <p>😕 {error}</p>
      <Link to="/shop">Back to Shop</Link>
    </div>
  );

  const price        = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const discount     = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const imageUrl     = product.image
    ? `${API_URL}${product.image}`
    : 'https://placehold.co/500x400/e8f5e9/2e7d32?text=No+Image';

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link> /
        <Link to="/shop">Shop</Link> /
        <Link to={`/shop?category=${product.category_slug}`}>{product.category_name}</Link> /
        <span>{product.name}</span>
      </div>

      <div className="pd-container">
        {/* Image */}
        <div className="pd-image-wrap">
          {discount > 0 && <span className="pd-discount-badge">{discount}% OFF</span>}
          <img src={imageUrl} alt={product.name} />
          {product.stock === 0 && <div className="pd-out-overlay">Out of Stock</div>}
        </div>

        {/* Info */}
        <div className="pd-info">
          <span className="pd-category">{product.category_name}</span>
          <h1 className="pd-name">{product.name}</h1>
          {product.unit && <p className="pd-unit">Unit: <strong>{product.unit}</strong></p>}

          <div className="pd-pricing">
            {discountPrice ? (
              <>
                <span className="pd-price">₹{discountPrice.toFixed(2)}</span>
                <span className="pd-original">₹{price.toFixed(2)}</span>
                <span className="pd-save">You save ₹{(price - discountPrice).toFixed(2)}</span>
              </>
            ) : (
              <span className="pd-price">₹{price.toFixed(2)}</span>
            )}
          </div>

          {product.description && (
            <div className="pd-description">
              <h3>About this product</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="pd-stock">
            {product.stock > 0
              ? <span className="in-stock">✓ In Stock ({product.stock} available)</span>
              : <span className="no-stock">✗ Out of Stock</span>}
          </div>

          {product.stock > 0 && (
            <div className="pd-actions">
              <div className="qty-selector">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <button
                className={`pd-add-btn ${added ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? 'Adding...' : added ? '✓ Added to Cart!' : '+ Add to Cart'}
              </button>
            </div>
          )}

          {added && (
            <div className="pd-added-msg">
              Item added to cart! <Link to="/cart">View Cart →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
