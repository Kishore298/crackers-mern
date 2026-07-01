import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  Plus,
  Check,
  ShoppingBag,
  Loader,
  Truck,
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
  const payMethod = "online"; // Forced to online
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

  const shipping = 0; // Shipping is always free (min order ₹4,000 > free shipping threshold)
  const finalAmount = total; // total already has slab discount applied

  useEffect(() => {
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
  }, [user, cartItems.length, navigate]);

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
              clearCart();
              toast.success("Order placed successfully! 🎆");
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
    <div className="min-h-screen bg-surface">
      <SEO title="Checkout" />
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-heading font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> Review Items
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const itemPrice = item.effectivePrice ?? item.discountedPrice ?? item.price;
                  const itemTotal = itemPrice * item.quantity;
                  return (
                    <div
                      key={item._id}
                      className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 bg-surface/30"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-100">
                        {item.images?.[0]?.url ? (
                          <img
                            src={item.images[0].url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-sm text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ₹{itemPrice.toLocaleString("en-IN")} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ₹{itemTotal.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-heading font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Delivery Address
              </h2>

              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr._id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddr === addr._id ? "border-primary bg-surface" : "border-orange-100 hover:border-primary-light"}`}
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
                      <p className="font-semibold text-sm text-gray-900">
                        {addr.fullName} · {addr.phone}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
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
                <div className="mt-4 p-4 bg-surface rounded-xl border border-orange-100 grid grid-cols-2 gap-3">
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
                      <label className="text-xs font-semibold text-gray-600 block mb-1">
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
                      className="px-5 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-heading font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Payment Method
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all border-primary bg-surface`}
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
                    <p className="font-semibold text-sm text-gray-900">
                      Online Payment
                    </p>
                    <p className="text-xs text-gray-400">Cards, UPI, Netbanking</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Summary & Pay */}
          <div className="bg-white rounded-2xl border border-orange-100 p-6 h-fit sticky top-24">
            <h2 className="font-heading font-semibold text-lg text-gray-900 mb-5">
              Order Summary
            </h2>
            <div className="space-y-2.5 text-sm">
              {cartItems.map((item) => {
                const itemPrice = item.effectivePrice ?? item.discountedPrice ?? item.price;
                return (
                  <div key={item._id} className="flex justify-between text-gray-600">
                    <span className="truncate max-w-[150px]">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-semibold">
                      ₹{(itemPrice * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
              <div className="border-t border-orange-50 my-3" />
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {slabDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Slab Discount
                  </span>
                  <span className="font-bold text-green-600">
                    −₹{slabDiscount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">FREE</span>
              </div>
              <div className="border-t border-orange-100 pt-3 flex justify-between font-heading font-bold text-gray-900 text-base">
                <span>Total</span>
                <div className="text-right">
                  <span className="text-primary">₹{finalAmount.toLocaleString("en-IN")}</span>
                  {slabDiscount > 0 && (
                    <p className="text-xs text-green-600 font-semibold">
                      You save ₹{slabDiscount.toLocaleString("en-IN")}!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Minimum cart warning (safety - should have been caught on cart page) */}
            {!canCheckout && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Minimum order value is ₹{MIN_CART_VALUE.toLocaleString("en-IN")} to proceed with checkout.</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={payLoading || !canCheckout}
              className="btn-fire w-full justify-center mt-5 py-3.5 text-base rounded-xl disabled:opacity-50"
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
