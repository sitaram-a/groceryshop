import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const price = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const discount = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;

  const imageUrl = product.image
    ? `${API_URL}${product.image}`
    : 'https://placehold.co/300x200/e8f5e9/2e7d32?text=No+Image';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setAdding(true);
    const result = await addToCart(product.id);
    setAdding(false);
    if (result?.needsLogin) return navigate('/login');
    if (result?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-img-wrap">
        {discount > 0 && <span className="discount-badge">{discount}% OFF</span>}
        {product.stock === 0 && <span className="out-of-stock-badge">Out of Stock</span>}
        <img src={imageUrl} alt={product.name} loading="lazy" />
      </Link>

      <div className="product-info">
        <span className="product-category">{product.category_name}</span>
        <Link to={`/product/${product.id}`} className="product-name">{product.name}</Link>
        {product.unit && <span className="product-unit">{product.unit}</span>}

        <div className="product-pricing">
          {discountPrice ? (
            <>
              <span className="price-current">₹{discountPrice.toFixed(2)}</span>
              <span className="price-original">₹{price.toFixed(2)}</span>
            </>
          ) : (
            <span className="price-current">₹{price.toFixed(2)}</span>
          )}
        </div>

        <button
          className={`add-to-cart-btn ${added ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding...' : added ? '✓ Added!' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  );
}
