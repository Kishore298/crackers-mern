import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const CartPage = () => {
  const { cartItems, updateQty, removeFromCart, subtotal, total, itemCount } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate("/login?redirect=/checkout");
      return;
    }
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-20 text-center px-4">
        <ShoppingBag className="w-20 h-20 text-orange-200 mb-6" />
        <h2 className="font-heading font-bold text-2xl text-gray-800 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-400 mb-8">
          Start adding some amazing crackers to your cart!
        </p>
        <Link to="/products" className="btn-fire px-8 py-3.5">
          Shop Now 🎆
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-8">
          Shopping Cart{" "}
          <span className="text-primary">({itemCount} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item) => {
              const price =
                item.effectivePrice ?? item.discountedPrice ?? item.price;
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-orange-100 p-4 flex items-center gap-4"
                >
                  <Link
                    to={`/products/${item.slug}`}
                    className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface"
                  >
                    {item.images?.[0]?.url ? (
                      <img
                        src={item.images[0].url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: "linear-gradient(135deg,#FFE4D0,#FFB347)",
                        }}
                      />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-sm text-gray-900 leading-snug truncate">
                      {item.name}
                    </h3>
                    <p className="text-primary font-bold mt-1">
                      ₹{price}{" "}
                      <span className="text-gray-400 font-normal text-xs">
                        per unit
                      </span>
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-orange-100 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(item._id, item.quantity - 1)}
                          className="px-2.5 py-1.5 hover:bg-surface transition-colors text-gray-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-bold text-gray-900 border-x border-orange-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item._id, item.quantity + 1)}
                          className="px-2.5 py-1.5 hover:bg-surface transition-colors text-gray-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">
                      ₹{price * item.quantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-orange-100 p-6 sticky top-24">
              <h2 className="font-heading font-semibold text-lg text-gray-900 mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 border-t border-orange-50 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span
                    className={`font-semibold ${total >= 999 ? "text-green-600" : ""}`}
                  >
                    {total >= 999 ? "FREE" : "₹99"}
                  </span>
                </div>
                {total < 999 && (
                  <p className="text-xs text-gray-400">
                    Add ₹{999 - total} more for free delivery
                  </p>
                )}
              </div>

              <div className="border-t border-orange-100 mt-4 pt-4 flex justify-between items-center">
                <span className="font-heading font-bold text-gray-900">
                  Total
                </span>
                <span className="font-heading font-bold text-xl text-primary">
                  ₹{total + (total >= 999 ? 0 : 99)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="btn-fire w-full justify-center mt-5 py-3.5 text-base rounded-xl"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
