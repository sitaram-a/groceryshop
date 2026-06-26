import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext({});

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(new Set());

  const loadWishlist = useCallback(async () => {
    if (!user) { setWishlist(new Set()); return; }
    try {
      const res = await api.get('/wishlist');
      setWishlist(new Set(res.data.items.map(i => i.product_id)));
    } catch { setWishlist(new Set()); }
  }, [user]);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  const toggleWishlist = async (productId) => {
    if (!user) return false;
    const inList = wishlist.has(productId);
    try {
      if (inList) {
        await api.delete(`/wishlist/${productId}`);
        setWishlist(prev => { const s = new Set(prev); s.delete(productId); return s; });
      } else {
        await api.post(`/wishlist/${productId}`);
        setWishlist(prev => new Set([...prev, productId]));
      }
      return true;
    } catch { return false; }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);