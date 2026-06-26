import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import './Wishlist.css';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return navigate('/login');
    api.get('/wishlist')
      .then(r => setItems(r.data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const removeItem = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    setItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const handleAddToCart = async (product) => {
    const result = await addToCart(product.product_id, 1);
    if (result?.needsLogin) navigate('/login');
  };

  if (loading) return <div className="wl-page"><div className="wl-loading">Loading wishlist...</div></div>;

  return (
    <div className="wl-page">
      <div className="wl-inner">
        <h1>❤️ My Wishlist <span>({items.length})</span></h1>

        {!items.length ? (
          <div className="wl-empty">
            <div style={{ fontSize:56, marginBottom:16 }}>💔</div>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love by clicking the ❤️ icon</p>
            <Link to="/shop" className="wl-shop-btn">Browse Products</Link>
          </div>
        ) : (
          <div className="wl-grid">
            {items.map(item => {
              const imageUrl = item.image
                ? item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`
                : 'https://placehold.co/300x300/e8f5e9/2e7d32?text=No+Image';
              return (
                <div key={item.product_id} className="wl-card">
                  <button className="wl-remove" onClick={() => removeItem(item.product_id)} title="Remove">✕</button>
                  <Link to={`/product/${item.product_id}`}>
                    <img src={imageUrl} alt={item.name} className="wl-img" />
                  </Link>
                  <div className="wl-info">
                    <Link to={`/product/${item.product_id}`} className="wl-name">{item.name}</Link>
                    <div className="wl-price">
                      {item.discount_price
                        ? <>
                            <span className="wl-disc">₹{parseFloat(item.discount_price).toFixed(2)}</span>
                            <span className="wl-orig">₹{parseFloat(item.price).toFixed(2)}</span>
                          </>
                        : <span className="wl-disc">₹{parseFloat(item.price).toFixed(2)}</span>
                      }
                    </div>
                    <button
                      className="wl-cart-btn"
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stock === 0}
                    >
                      {item.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}