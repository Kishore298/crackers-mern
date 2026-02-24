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

  const clearCart = () => setCartItems([]);

  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // effectivePrice: use pre-computed effectivePrice if present (set by ProductCard/Detail),
  // otherwise fall back to discountedPrice or base price
  const subtotal = cartItems.reduce((sum, i) => {
    const price = i.effectivePrice ?? i.discountedPrice ?? i.price;
    return sum + price * i.quantity;
  }, 0);

  const total = subtotal; // no coupon deduction — global discount already in effectivePrice

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        itemCount,
        subtotal,
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
