import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const CART_STORAGE_KEY = 'e-canteen-cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const toastShownRef = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((menuItem, quantity = 1) => {
    // Reset toast flag at the start
    toastShownRef.current = false;
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === menuItem._id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > menuItem.stock) {
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            setTimeout(() => toast.error(`Only ${menuItem.stock} items available in stock`), 0);
          }
          return prevItems;
        }
        
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          setTimeout(() => toast.success(`Updated ${menuItem.name} quantity`), 0);
        }
        return prevItems.map((item) =>
          item._id === menuItem._id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      if (quantity > menuItem.stock) {
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          setTimeout(() => toast.error(`Only ${menuItem.stock} items available in stock`), 0);
        }
        return prevItems;
      }
      
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        setTimeout(() => toast.success(`${menuItem.name} added to cart`), 0);
      }
      return [...prevItems, { ...menuItem, quantity }];
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    toastShownRef.current = false;
    
    setItems((prevItems) => {
      const item = prevItems.find((i) => i._id === itemId);
      if (item && !toastShownRef.current) {
        toastShownRef.current = true;
        setTimeout(() => toast.success(`${item.name} removed from cart`), 0);
      }
      return prevItems.filter((i) => i._id !== itemId);
    });
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity < 1) return;
    
    toastShownRef.current = false;
    
    setItems((prevItems) => {
      const item = prevItems.find((i) => i._id === itemId);
      if (item && quantity > item.stock) {
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          setTimeout(() => toast.error(`Only ${item.stock} items available in stock`), 0);
        }
        return prevItems;
      }
      
      return prevItems.map((item) =>
        item._id === itemId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.success('Cart cleared');
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  // Computed values
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isEmpty = items.length === 0;

  // Format items for order API
  const getOrderItems = useCallback(() => {
    return items.map((item) => ({
      menuItem: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    }));
  }, [items]);

  const value = {
    items,
    totalItems,
    totalAmount,
    isEmpty,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    getOrderItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
