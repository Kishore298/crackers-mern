import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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

  // Mirror of cartItems for synchronous reads inside addToCart
  const cartRef = useRef(cartItems);
  useEffect(() => {
    cartRef.current = cartItems;
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    // Read the current cart synchronously before state update
    const existing = cartRef.current.find((i) => i._id === product._id);

    setCartItems((prev) => {
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) return prev;
        return prev.map((i) =>
          i._id === product._id ? { ...i, quantity: newQty } : i,
        );
      }
      if (quantity > product.stock) return prev;
      return [...prev, { ...product, quantity }];
    });

    // Toast is fired outside the updater — avoids double-fire in React StrictMode
    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        toast.error("Not enough stock!", { id: `stock-${product._id}` });
      } else {
        toast.success("Cart updated!", { id: `cart-${product._id}` });
      }
    } else {
      if (quantity > product.stock) {
        toast.error("Not enough stock!", { id: `stock-${product._id}` });
      } else {
        toast.success("Added to cart! 🎆", { id: `cart-${product._id}` });
      }
    }
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
