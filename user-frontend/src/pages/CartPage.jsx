import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, AlertCircle, Sparkles, TrendingUp } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";

const CartPage = () => {
  const {
    cartItems, updateQty, removeFromCart, subtotal, total, itemCount,
    slabDiscount, nextSlabHint, canCheckout, minCartShortfall,
    MIN_CART_VALUE, DISCOUNT_SLABS,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!canCheckout) return;
    if (!user) {
      navigate("/login?redirect=/checkout");
      return;
    }
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 text-center px-4" style={{ background: "#0a0814" }}>
        <SEO title="Cart is Empty" />
        <ShoppingBag className="w-20 h-20 text-primary mb-6 opacity-80" />
        <h2 className="font-heading font-bold text-2xl text-white mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-400 mb-8">
          Start adding some amazing festive products to your cart!
        </p>
        <Link to="/products" className="btn-fire px-8 py-3.5">
          Shop Now 🎇
        </Link>
      </div>
    );
  }

  const minProgress = Math.min((subtotal / MIN_CART_VALUE) * 100, 100);

  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO 
        title="Your Shopping Cart" 
        description="Review your selected products before proceeding to checkout. Secure your celebration with V Crackers."
      />
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-bold text-2xl text-white mb-8">
          Shopping Cart{" "}
          <span className="text-primary">({itemCount} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => {
              const price =
                item.effectivePrice ?? item.discountedPrice ?? item.price;
              return (
                <div
                  key={item._id}
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}
                >
                  <Link
                    to={`/products/${item.slug}`}
                    className="w-20 h-20 rounded-xl overflow-hidden shrink-0"
                    style={{ background: "#0f0d1a" }}
                  >
                    {item.images?.[0]?.url ? (
                      <img
                        src={item.images[0].url?.replace("/upload/", "/upload/q_auto,f_auto,w_100/")}
                        alt={item.name}
                        crossOrigin="anonymous"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: "linear-gradient(135deg, #161421 0%, #1e1b2e 100%)",
                        }}
                      />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-sm text-white leading-snug truncate">
                      {item.name}
                    </h3>
                    <p className="text-primary font-bold mt-1">
                      ₹{price}{" "}
                      <span className="text-gray-400 font-normal text-xs">
                        per unit
                      </span>
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,102,0,0.15)" }}>
                        <button
                          onClick={() => updateQty(item._id, item.quantity - 1)}
                          className="px-2.5 py-1.5 hover:bg-surface-2 transition-colors text-gray-400"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-bold text-white" style={{ borderLeft: "1px solid rgba(255,102,0,0.15)", borderRight: "1px solid rgba(255,102,0,0.15)" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item._id, item.quantity + 1)}
                          className="px-2.5 py-1.5 hover:bg-surface-2 transition-colors text-gray-400"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-white">
                      ₹{(price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-2xl p-6 sticky top-24 shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
              <h2 className="font-heading font-semibold text-lg text-white mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 pt-4" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-white">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                {slabDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Slab Discount
                    </span>
                    <span className="font-bold text-green-400">
                      −₹{slabDiscount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                {nextSlabHint && (
                  <div className="rounded-xl px-3 py-2.5 text-xs text-amber-300 flex items-start gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      Add <strong>₹{nextSlabHint.addMore.toLocaleString("en-IN")}</strong> more to save{" "}
                      <strong>₹{nextSlabHint.savings.toLocaleString("en-IN")}</strong>!
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 flex justify-between items-center" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
                <span className="font-heading font-bold text-white">
                  Total
                </span>
                <div className="text-right">
                  <span className="font-heading font-bold text-xl text-primary">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                  {slabDiscount > 0 && (
                    <p className="text-xs text-green-400 font-semibold">
                      You save ₹{slabDiscount.toLocaleString("en-IN")}!
                    </p>
                  )}
                </div>
              </div>

              {!canCheckout && (
                <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div className="flex items-start gap-2 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-1">
                        Minimum order value is ₹{MIN_CART_VALUE.toLocaleString("en-IN")}
                      </p>
                      <p className="text-red-400/80">
                        Add ₹{minCartShortfall.toLocaleString("en-IN")} more to proceed with checkout.
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${minProgress}%`,
                        background: "linear-gradient(90deg, #ef4444, #f97316)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-red-400/80 mt-1 text-right">
                    {Math.round(minProgress)}% of ₹{MIN_CART_VALUE.toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={!canCheckout}
                className={`w-full flex items-center justify-center gap-2 mt-5 py-3.5 text-base rounded-xl font-bold transition-all ${
                  canCheckout
                    ? "btn-fire"
                    : "opacity-50 cursor-not-allowed"
                }`}
                style={!canCheckout ? { background: "#1a1726", color: "#555" } : {}}
              >
                {canCheckout ? (
                  <>Proceed to Checkout <ArrowRight className="w-5 h-5" /></>
                ) : (
                  <>Minimum ₹{MIN_CART_VALUE.toLocaleString("en-IN")} required</>
                )}
              </button>

              <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Discount Slabs
                </p>
                <div className="space-y-1">
                  {DISCOUNT_SLABS.map((slab, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                        subtotal >= slab.min && subtotal <= slab.max
                          ? "font-bold text-green-400"
                          : "text-gray-400"
                      }`}
                      style={subtotal >= slab.min && subtotal <= slab.max ? { background: "rgba(74,222,128,0.1)" } : {}}
                    >
                      <span>{slab.label}</span>
                      <span>
                        {slab.discount > 0
                          ? `₹${slab.discount.toLocaleString("en-IN")} OFF`
                          : "No discount"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
