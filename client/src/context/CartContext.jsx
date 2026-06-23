import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  // Fetch cart from server when user logs in
  useEffect(() => {
    if (user) fetchCart();
    else setCartItems([]);
  }, [user]);

  const fetchCart = async () => {
    try {
      setCartLoading(true);
      const res = await api.get('/cart');
      setCartItems(res.data.items || []);
    } catch (err) {
      console.error('Cart fetch failed:', err);
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!user) return { needsLogin: true };
    try {
      await api.post('/cart/add', { product_id: productId, quantity });
      await fetchCart();
      return { success: true };
    } catch (err) {
      return { error: err.response?.data?.message || 'Failed to add to cart.' };
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      await api.put(`/cart/update/${cartItemId}`, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Update quantity failed:', err);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/cart/remove/${cartItemId}`);
      await fetchCart();
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCartItems([]);
    } catch (err) {
      console.error('Clear cart failed:', err);
    }
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartLoading, cartCount, cartTotal,
      addToCart, updateQuantity, removeFromCart, clearCart, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
