import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import api from "../services/api";
import { getEffectivePrice } from "../utils/priceUtils";

const CartContext = createContext(null);

const CART_KEY = "lash_cart";
const OWNER_KEY = "lash_cart_owner";
const DISCOUNT_KEY = "lash_discount_pct";

const MIN_CART_VALUE_DEFAULT = 4000;

// ─── localStorage helpers ─────────────────────────────────────────────────────

const readLocalCart = () => {
  try {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const writeLocalCart = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  // Cart items: each item is the full product object + { quantity }
  // Price is NEVER trusted from item.effectivePrice — it is always recomputed
  // via getEffectivePrice(item, globalDiscountPct) at display / subtotal time.
  const [cartItems, setCartItems] = useState(() => readLocalCart());

  // Global discount percentage — fetched once and cached
  const [globalDiscountPct, setGlobalDiscountPct] = useState(() => {
    const cached = localStorage.getItem(DISCOUNT_KEY);
    return cached ? Number(cached) : 0;
  });

  // Minimum Order Value
  const [minCartValue, setMinCartValue] = useState(MIN_CART_VALUE_DEFAULT);

  const cartRef = useRef(cartItems);

  // Keep ref in sync
  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    writeLocalCart(cartItems);
  }, [cartItems]);

  // Fetch and cache the global discount percentage
  useEffect(() => {
    api.get("/discount")
      .then((r) => {
        const d = r.data.discount;
        const pct = d?.isActive ? d.percentage : 0;
        setGlobalDiscountPct(pct);
        localStorage.setItem(DISCOUNT_KEY, String(pct));
      })
      .catch(() => {});

    api.get("/settings")
      .then((r) => {
        if (r.data?.success && r.data?.settings?.minOrderAmount !== undefined) {
          setMinCartValue(r.data.settings.minOrderAmount);
        }
      })
      .catch(() => {});
  }, []);

  // ─── Auth transition: Login / Logout ──────────────────────────────────────

  useEffect(() => {
    if (user) {
      // ── LOGIN ──
      const owner = localStorage.getItem(OWNER_KEY);
      const currentCart = cartRef.current;

      const isGuestCart = owner === "guest" || (!owner && currentCart.length > 0);

      if (isGuestCart) {
        // Merge guest cart with server cart
        // Send only { _id, quantity } — backend validates product and price
        const guestItems = currentCart.map((i) => ({ _id: i._id, quantity: i.quantity }));
        api.post("/users/cart/sync", { items: guestItems })
          .then((res) => {
            if (res.data.success) {
              setCartItems(res.data.cart);
              localStorage.setItem(OWNER_KEY, user._id);
            }
            // If sync fails, guest cart remains intact (no removeItem called here)
          })
          .catch(() => {
            toast.error("Could not sync your cart. Your items are preserved.");
            // Guest cart is kept — do NOT clear it on failure
            localStorage.setItem(OWNER_KEY, user._id);
          });
      } else if (owner !== user._id) {
        // No guest cart, or a different account — fetch server cart
        api.get("/users/cart")
          .then((res) => {
            if (res.data.success) {
              setCartItems(res.data.cart);
              localStorage.setItem(OWNER_KEY, user._id);
            }
          })
          .catch(() => toast.error("Failed to load cart"));
      }
      // else: owner === user._id → already synced, no action needed
    } else {
      // ── LOGOUT ──
      // Convert the current authenticated cart to a guest cart in localStorage.
      // We keep the items — DO NOT clear them.
      // Just change ownership back to "guest" so the next login triggers a merge.
      const currentCart = cartRef.current;
      if (currentCart.length > 0) {
        // Keep the items in state and localStorage
        writeLocalCart(currentCart);
        localStorage.setItem(OWNER_KEY, "guest");
      } else {
        localStorage.removeItem(OWNER_KEY);
      }
      // cartItems state is NOT cleared — the user still sees their cart
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Mark guest cart ownership when a guest adds the first item
  const ensureOwnerMarker = () => {
    if (!user && !localStorage.getItem(OWNER_KEY)) {
      localStorage.setItem(OWNER_KEY, "guest");
    }
  };

  // ─── Cart mutations ───────────────────────────────────────────────────────

  const addToCart = useCallback(async (product, quantity = 1) => {
    ensureOwnerMarker();
    const existing = cartRef.current.find((i) => i._id === product._id);
    const newQty = existing ? existing.quantity + quantity : quantity;

    if (newQty > product.stock) {
      toast.error("Not enough stock!", { id: `stock-${product._id}` });
      return;
    }

    const previousCart = [...cartRef.current];

    // Store the full product object so we have name/image/fields available offline.
    // Price is NEVER read from effectivePrice here — it is recomputed from product fields.
    setCartItems((prev) => {
      if (existing) {
        return prev.map((i) => (i._id === product._id ? { ...i, quantity: newQty } : i));
      }
      // Strip any stale effectivePrice so the utility always re-derives it
      const { effectivePrice: _dropped, ...productData } = product;
      return [...prev, { ...productData, quantity }];
    });

    toast.success(existing ? "Cart updated!" : "Added to cart! 🎆", { id: `cart-${product._id}` });

    if (user) {
      try {
        await api.post("/users/cart/items", { productId: product._id, quantity });
      } catch {
        setCartItems(previousCart);
        toast.error("Failed to update server cart");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const removeFromCart = useCallback(async (productId) => {
    const previousCart = [...cartRef.current];
    setCartItems((prev) => prev.filter((i) => i._id !== productId));

    if (user) {
      try {
        await api.delete(`/users/cart/items/${productId}`);
      } catch {
        setCartItems(previousCart);
        toast.error("Failed to remove item");
      }
    }
  }, [user]);

  const updateQty = useCallback(async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);

    const existing = cartRef.current.find((i) => i._id === productId);
    if (!existing) return;

    if (quantity > existing.stock) {
      toast.error("Not enough stock!");
      return;
    }

    const previousCart = [...cartRef.current];
    setCartItems((prev) =>
      prev.map((i) => (i._id === productId ? { ...i, quantity } : i))
    );

    if (user) {
      try {
        await api.patch(`/users/cart/items/${productId}`, { quantity });
      } catch {
        setCartItems(previousCart);
        toast.error("Failed to update quantity");
      }
    }
  }, [user, removeFromCart]);

  const clearCart = useCallback(async (productIds = null) => {
    if (productIds && productIds.length > 0) {
      setCartItems((prev) => prev.filter((i) => !productIds.includes(i._id)));
    } else {
      setCartItems([]);
    }

    if (user) {
      try {
        if (productIds) {
          await api.delete("/users/cart", { data: { productIds } });
        } else {
          await api.delete("/users/cart");
        }
      } catch (err) {
        console.error("Failed to clear cart on server", err);
      }
    }
  }, [user]);

  const getCartItem = useCallback(
    (productId) => cartItems.find((i) => i._id === productId),
    [cartItems]
  );

  // ─── Derived values ───────────────────────────────────────────────────────
  // Price is always recomputed from product fields + current globalDiscountPct.
  // We never trust a cached effectivePrice field.

  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = cartItems.reduce((sum, i) => {
    const price = getEffectivePrice(i, globalDiscountPct);
    return sum + price * i.quantity;
  }, 0);

  const total = subtotal;
  const canCheckout = subtotal >= minCartValue;
  const minCartShortfall = canCheckout ? 0 : minCartValue - subtotal;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        globalDiscountPct,
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
        MIN_CART_VALUE: minCartValue,
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