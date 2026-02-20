import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);

const CART_KEY = "lash_cart";

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          toast.error("Not enough stock!");
          return prev;
        }
        toast.success("Cart updated!");
        return prev.map((i) =>
          i._id === product._id ? { ...i, quantity: newQty } : i,
        );
      }
      if (quantity > product.stock) {
        toast.error("Not enough stock!");
        return prev;
      }
      toast.success("Added to cart! 🎆");
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((i) => i._id !== productId));
  };

  const updateQty = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    setCartItems((prev) =>
      prev.map((i) => (i._id === productId ? { ...i, quantity } : i)),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
  };

  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = cartItems.reduce((sum, i) => {
    const price = i.discountedPrice || i.price;
    return sum + price * i.quantity;
  }, 0);

  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        coupon,
        setCoupon,
        itemCount,
        subtotal,
        discount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
