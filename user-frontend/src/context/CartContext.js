import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);

const CART_KEY = "lash_cart";

// ─── Discount Slab Config (mirrored from backend/config/discountSlabs.js) ───
const MIN_CART_VALUE = 4000;

const DISCOUNT_SLABS = [
  { min: 12500, max: Infinity, discount: 1000, label: "₹12,500 & above" },
  { min: 10000, max: 12499,   discount: 600,  label: "₹10,000 – ₹12,499" },
  { min: 8000,  max: 9999,    discount: 400,  label: "₹8,000 – ₹9,999" },
  { min: 6000,  max: 7999,    discount: 300,  label: "₹6,000 – ₹7,999" },
  { min: 4000,  max: 5999,    discount: 0,    label: "₹4,000 – ₹5,999" },
];

const calculateSlabDiscount = (subtotal) => {
  const slab = DISCOUNT_SLABS.find((s) => subtotal >= s.min && subtotal <= s.max);
  const discount = slab ? slab.discount : 0;
  const label = slab ? slab.label : "";

  // Find the next higher slab for "add more to save" hint
  let nextSlab = null;
  if (slab) {
    const currentIdx = DISCOUNT_SLABS.indexOf(slab);
    if (currentIdx > 0) {
      const higher = DISCOUNT_SLABS[currentIdx - 1];
      nextSlab = {
        threshold: higher.min,
        savings: higher.discount,
        addMore: higher.min - subtotal,
      };
    }
  } else if (subtotal < 6000 && subtotal >= 4000) {
    nextSlab = {
      threshold: 6000,
      savings: 300,
      addMore: 6000 - subtotal,
    };
  }

  return { discount, label, nextSlab };
};

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
      prev.map((i) => {
        if (i._id === productId) {
          if (quantity > i.stock) {
            toast.error("Not enough stock!");
            return i;
          }
          return { ...i, quantity };
        }
        return i;
      })
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

  // ─── Slab discount calculation ─────────────────────────────────────
  const slabInfo = useMemo(() => calculateSlabDiscount(subtotal), [subtotal]);
  const slabDiscount = slabInfo.discount;
  const slabLabel = slabInfo.label;
  const nextSlabHint = slabInfo.nextSlab;

  const total = subtotal - slabDiscount;

  // Minimum cart value check
  const canCheckout = subtotal >= MIN_CART_VALUE;
  const minCartShortfall = canCheckout ? 0 : MIN_CART_VALUE - subtotal;

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
        slabDiscount,
        slabLabel,
        nextSlabHint,
        total,
        canCheckout,
        minCartShortfall,
        MIN_CART_VALUE,
        DISCOUNT_SLABS,
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

