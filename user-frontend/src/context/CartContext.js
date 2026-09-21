import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const CartContext = createContext(null);

const CART_KEY = "lash_cart";
const OWNER_KEY = "lash_cart_owner"; // Prevent double merge

const MIN_CART_VALUE = 4000;

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  const cartRef = useRef(cartItems);

  // Sync to local storage on change
  useEffect(() => {
    cartRef.current = cartItems;
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Auth Effect: Handle login / logout sync
  useEffect(() => {
    if (user) {
      const owner = localStorage.getItem(OWNER_KEY);
      
      const isGuestCart = (owner === "guest" || (!owner && cartItems.length > 0));

      if (isGuestCart) {
        // First time login with guest cart: Sync merge
        api.post("/users/cart/sync", { items: cartItems })
          .then((res) => {
            if (res.data.success) {
              setCartItems(res.data.cart);
              localStorage.setItem(OWNER_KEY, user._id);
            }
          })
          .catch(() => toast.error("Failed to sync cart"));
      } else if (owner !== user._id) {
        // Logging in without guest cart, or from another account: Fetch DB cart
        api.get("/users/cart")
          .then((res) => {
            if (res.data.success) {
              setCartItems(res.data.cart);
              localStorage.setItem(OWNER_KEY, user._id);
            }
          })
          .catch(() => toast.error("Failed to load cart"));
      }
    } else {
      // Logout: Clear local cart
      setCartItems([]);
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(OWNER_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Run when user logs in/out

  // Helper to mark guest cart if empty
  const ensureOwnerMarker = () => {
    if (!user && !localStorage.getItem(OWNER_KEY)) {
      localStorage.setItem(OWNER_KEY, "guest");
    }
  };

  const addToCart = async (product, quantity = 1) => {
    ensureOwnerMarker();
    const existing = cartRef.current.find((i) => i._id === product._id);
    const newQty = existing ? existing.quantity + quantity : quantity;
    
    if (newQty > product.stock) {
      toast.error("Not enough stock!", { id: `stock-${product._id}` });
      return;
    }

    // Optimistic UI Update
    const previousCart = [...cartRef.current];
    setCartItems((prev) => {
      if (existing) {
        return prev.map((i) => (i._id === product._id ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { ...product, quantity }];
    });

    toast.success(existing ? "Cart updated!" : "Added to cart! 🎆", { id: `cart-${product._id}` });

    // API Call
    if (user) {
      try {
        await api.post("/users/cart/items", { productId: product._id, quantity });
      } catch (error) {
        // Rollback on failure
        setCartItems(previousCart);
        toast.error("Failed to update server cart");
      }
    }
  };

  const removeFromCart = async (productId) => {
    const previousCart = [...cartRef.current];
    
    // Optimistic Update
    setCartItems((prev) => prev.filter((i) => i._id !== productId));

    // API Call
    if (user) {
      try {
        await api.delete(`/users/cart/items/${productId}`);
      } catch (error) {
        setCartItems(previousCart);
        toast.error("Failed to remove item");
      }
    }
  };

  const updateQty = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);

    const existing = cartRef.current.find((i) => i._id === productId);
    if (!existing) return;

    if (quantity > existing.stock) {
      toast.error("Not enough stock!");
      return;
    }

    const previousCart = [...cartRef.current];

    // Optimistic Update
    setCartItems((prev) =>
      prev.map((i) => (i._id === productId ? { ...i, quantity } : i))
    );

    // API Call
    if (user) {
      try {
        await api.patch(`/users/cart/items/${productId}`, { quantity });
      } catch (error) {
        setCartItems(previousCart);
        toast.error("Failed to update quantity");
      }
    }
  };

  const clearCart = async (productIds = null) => {
    // If specific products are provided (after checkout)
    if (productIds && productIds.length > 0) {
      setCartItems((prev) => prev.filter((i) => !productIds.includes(i._id)));
    } else {
      setCartItems([]);
    }
    
    // API Call (Fire and forget, since it's usually post-checkout)
    if (user) {
      try {
        if (productIds) {
          await api.delete("/users/cart", { data: { productIds } });
        } else {
          await api.delete("/users/cart");
        }
      } catch (error) {
        console.error("Failed to clear cart on server", error);
      }
    }
  };

  const getCartItem = (productId) => cartItems.find(i => i._id === productId);

  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = cartItems.reduce((sum, i) => {
    const price = i.effectivePrice ?? i.discountedPrice ?? i.price;
    return sum + price * i.quantity;
  }, 0);

  const total = subtotal;

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
        getCartItem,
        itemCount,
        subtotal,
        total,
        canCheckout,
        minCartShortfall,
        MIN_CART_VALUE,
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