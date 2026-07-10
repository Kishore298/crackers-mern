import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  Plus,
  Check,
  ShoppingBag,
  Loader,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import SEO from "../components/SEO";

const CheckoutPage = () => {
  const { cartItems, subtotal, total, clearCart, slabDiscount, canCheckout, MIN_CART_VALUE } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [newAddr, setNewAddr] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });


  const finalAmount = total; // total already has slab discount applied

  useEffect(() => {
    if (orderPlaced) return;

    if (!user) {
      navigate("/login?redirect=/checkout");
      return;
    }
    if (cartItems.length === 0) {
      navigate("/cart");
      return;
    }
    // Redirect to cart if below minimum order value
    if (!canCheckout) {
      toast.error(`Minimum order value is ₹${MIN_CART_VALUE.toLocaleString("en-IN")} to proceed.`);
      navigate("/cart");
      return;
    }
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/profile");
        const addrs = data.user.addresses || [];
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        if (def) setSelectedAddr(def._id);
      } catch {}
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cartItems.length, navigate, canCheckout, MIN_CART_VALUE, orderPlaced]);

  const addAddress = async () => {
    try {
      const { data } = await api.post("/auth/address", newAddr);
      setAddresses(data.addresses);
      const added = data.addresses[data.addresses.length - 1];
      setSelectedAddr(added._id);
      setShowAddAddr(false);
      setNewAddr({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
      });
      toast.success("Address added!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add address");
    }
  };

  const handlePayment = async () => {
    if (!selectedAddr) {
      toast.error("Please select a delivery address");
      return;
    }
    const addr = addresses.find((a) => a._id === selectedAddr);
    setPayLoading(true);

    try {
      // --- Online Flow (Razorpay) ---
      const { data: orderData } = await api.post("/payment/create-order", {
        amount: finalAmount,
      });
      const { order, key } = orderData;

      const loadScript = () =>
        new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve(true);
          s.onerror = () => resolve(false);
          document.body.appendChild(s);
        });

      const loaded = await loadScript();
      if (!loaded) {
        toast.error("Payment gateway unavailable");
        setPayLoading(false);
        return;
      }

      const options = {
        key,
        amount: order.amount,
        currency: "INR",
        name: "V Crackers",
        description: "Festive Products Order",
        order_id: order.id,
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: "#ff6600" },
        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post("/payment/verify", {
              ...response,
              cartItems: cartItems.map((i) => ({
                product: i._id,
                quantity: i.quantity,
                name: i.name,
              })),
              shippingAddress: addr,
              totalAmount: subtotal,
              finalPayable: finalAmount,
            });
            if (verifyData.success) {
              setOrderPlaced(true);
              clearCart();
              toast.success("Order placed successfully! 🎇");
              navigate(`/order-success/${verifyData.sale._id}`);
            }
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            setPayLoading(false);
          },
        },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Payment initiation failed");
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="Checkout" />
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-bold text-2xl text-white mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items Section */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
              <h2 className="font-heading font-semibold text-lg text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> Review Items
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const itemPrice = item.effectivePrice ?? item.discountedPrice ?? item.price;
                  const itemTotal = itemPrice * item.quantity;
                  return (
                    <div
                      key={item._id}
                      className="flex items-center gap-4 p-3 rounded-xl border border-transparent"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "#0f0d1a" }}>
                        {item.images?.[0]?.url ? (
                          <img
                            src={item.images[0].url?.replace("/upload/", "/upload/q_auto,f_auto,w_100/")}
                            alt={item.name}
                            crossOrigin="anonymous"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-50 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #161421 0%, #1e1b2e 100%)" }}>
                            <ShoppingBag className="w-6 h-6 text-gray-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-sm text-white truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ₹{itemPrice.toLocaleString("en-IN")} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">
                          ₹{itemTotal.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address Section */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
              <h2 className="font-heading font-semibold text-lg text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Delivery Address
              </h2>

              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddr === addr._id ? "border-primary" : "hover:border-primary-light"}`}
                    style={selectedAddr === addr._id ? { background: "rgba(255,102,0,0.05)" } : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr._id}
                      checked={selectedAddr === addr._id}
                      onChange={() => setSelectedAddr(addr._id)}
                      className="mt-1 accent-primary"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-white">
                        {addr.fullName} · {addr.phone}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {addr.addressLine1}
                        {addr.addressLine2
                          ? `, ${addr.addressLine2}`
                          : ""}, {addr.city}, {addr.state} – {addr.pincode}
                      </p>
                      {addr.isDefault && (
                        <span className="badge-fire text-xs mt-1.5 inline-block">
                          Default
                        </span>
                      )}
                    </div>
                    {selectedAddr === addr._id && (
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={() => setShowAddAddr(!showAddAddr)}
                className="flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>

              {showAddAddr && (
                <div className="mt-4 p-4 rounded-xl grid grid-cols-2 gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,102,0,0.1)" }}>
                  {[
                    { id: "fullName", label: "Full Name", colSpan: 1 },
                    { id: "phone", label: "Phone", colSpan: 1 },
                    { id: "addressLine1", label: "Address Line 1", colSpan: 2 },
                    {
                      id: "addressLine2",
                      label: "Address Line 2 (optional)",
                      colSpan: 2,
                    },
                    { id: "city", label: "City", colSpan: 1 },
                    { id: "state", label: "State", colSpan: 1 },
                    { id: "pincode", label: "Pincode", colSpan: 1 },
                  ].map(({ id, label, colSpan }) => (
                    <div key={id} className={colSpan === 2 ? "col-span-2" : ""}>
                      <label className="text-xs font-semibold text-gray-400 block mb-1">
                        {label}
                      </label>
                      <input
                        value={newAddr[id]}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, [id]: e.target.value })
                        }
                        className="input-fire text-sm py-2"
                      />
                    </div>
                  ))}
                  <div className="col-span-2 flex gap-3 mt-2">
                    <button
                      onClick={addAddress}
                      className="btn-fire px-5 py-2 text-sm rounded-lg"
                    >
                      Save Address
                    </button>
                    <button
                      onClick={() => setShowAddAddr(false)}
                      className="px-5 py-2 text-sm text-gray-400 rounded-lg hover:bg-surface-2 transition-colors"
                      style={{ border: "1px solid rgba(255,102,0,0.1)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
              <h2 className="font-heading font-semibold text-lg text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Payment Method
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all border-primary`}
                  style={{ background: "rgba(255,102,0,0.05)" }}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    value="online"
                    checked={true}
                    readOnly
                    className="accent-primary"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">
                      Online Payment
                    </p>
                    <p className="text-xs text-gray-400">Cards, UPI, Netbanking</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Summary & Pay */}
          <div className="rounded-2xl p-6 h-fit sticky top-24" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
            <h2 className="font-heading font-semibold text-lg text-white mb-5">
              Order Summary
            </h2>
            <div className="space-y-2.5 text-sm">
              {cartItems.map((item) => {
                const itemPrice = item.effectivePrice ?? item.discountedPrice ?? item.price;
                return (
                  <div key={item._id} className="flex justify-between text-gray-400">
                    <span className="truncate max-w-[150px]">
                      {item.name} Ã— {item.quantity}
                    </span>
                    <span className="font-semibold text-white">
                      ₹{(itemPrice * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
              <div className="my-3" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }} />
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">₹{subtotal.toLocaleString("en-IN")}</span>
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
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-green-400 font-semibold">FREE</span>
              </div>
              <div className="pt-3 flex justify-between font-heading font-bold text-white text-base" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
                <span>Total</span>
                <div className="text-right">
                  <span className="text-primary">₹{finalAmount.toLocaleString("en-IN")}</span>
                  {slabDiscount > 0 && (
                    <p className="text-xs text-green-400 font-semibold">
                      You save ₹{slabDiscount.toLocaleString("en-IN")}!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Minimum cart warning */}
            {!canCheckout && (
              <div className="mt-3 rounded-xl p-3 flex items-start gap-2 text-xs text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Minimum order value is ₹{MIN_CART_VALUE.toLocaleString("en-IN")} to proceed with checkout.</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={payLoading || !canCheckout}
              className={`w-full justify-center mt-5 py-3.5 text-base rounded-xl flex items-center gap-2 font-bold transition-all ${
                canCheckout
                  ? "btn-fire"
                  : "opacity-50 cursor-not-allowed"
              }`}
              style={!canCheckout ? { background: "#1a1726", color: "#555" } : {}}
            >
              {payLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Pay ₹{finalAmount.toLocaleString("en-IN")}
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
              🔒 Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
