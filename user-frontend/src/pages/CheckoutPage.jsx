import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  MapPin,
  Plus,
  Check,
  ShoppingBag,
  Loader,
  AlertCircle,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import GPayIcon from "../components/GPayIcon";
import PhonePeIcon from "../components/PhonePeIcon";
import PaytmIcon from "../components/PaytmIcon";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import SEO from "../components/SEO";
import { formatComboName, calculateComboStats, getValidComboProducts } from "../utils/comboUtils";

const CheckoutPage = () => {
  const { cartItems, subtotal, total, clearCart, canCheckout, MIN_CART_VALUE } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponDiscountText, setCouponDiscountText] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);

  const [addrForm, setAddrForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });
  const [editingAddrId, setEditingAddrId] = useState(null);


  const basePayable = total - couponDiscount;
  const packagingCharges = Math.round(basePayable * 0.015);
  const finalAmount = basePayable + packagingCharges;

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
      } catch { }
    };
    
    const fetchDiscount = async () => {
      try {
        const r = await api.get("/discount");
        if (r.data.discount?.isActive) {
          setDiscountPct(r.data.discount.percentage);
        }
      } catch { }
    };

    fetchProfile();
    fetchDiscount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cartItems.length, navigate, canCheckout, MIN_CART_VALUE, orderPlaced]);

  const saveAddress = async () => {
    try {
      let data;
      if (editingAddrId) {
        const res = await api.put(`/auth/address/${editingAddrId}`, addrForm);
        data = res.data;
        toast.success("Address updated!");
      } else {
        const res = await api.post("/auth/address", addrForm);
        data = res.data;
        toast.success("Address added!");
        const added = data.addresses[data.addresses.length - 1];
        setSelectedAddr(added._id);
      }

      setAddresses(data.addresses);
      setShowAddAddr(false);
      setEditingAddrId(null);
      setAddrForm({
        fullName: "",
        email: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save address");
    }
  };

  const handleEditAddress = (e, addr) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingAddrId(addr._id);
    setAddrForm({
      fullName: addr.fullName,
      email: addr.email || "",
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setShowAddAddr(true);
  };

  const handlePayment = async () => {
    if (!selectedAddr) {
      toast.error("Please select a delivery address");
      return;
    }
    const addr = addresses.find((a) => a._id === selectedAddr);
    setPayLoading(true);

    try {
      // --- Offline Flow ---
      const { data } = await api.post("/payment/place-offline", {
        cartItems: cartItems.map((i) => ({
          product: i._id,
          quantity: i.quantity,
          name: i.name,
        })),
        shippingAddress: addr,
        couponCode: appliedCoupon,
      });

      if (data.success) {
        setOrderPlaced(true);
        clearCart();
        toast.success("Order placed successfully! 🎇");
        navigate(`/order-success/${data.sale._id}`, { state: { isNewOrder: true } });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to place order.");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="Checkout" noindex={true} />
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
                  const isCombo = item.isCombo && item.comboProducts?.length > 0;
                  const displayName = formatComboName(item);

                  return (
                    <div
                      key={item._id}
                      className="flex flex-col gap-3 p-4 rounded-xl border border-transparent transition-colors hover:bg-surface-2"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-800" style={{ background: "#0f0d1a" }}>
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
                            <div className="w-full h-full flex items-center justify-center p-2 bg-[#0f0d1a]">
                              <img
                                src="/v-crackers-logo.webp"
                                alt="V Crackers Logo"
                                className="w-full h-full object-contain opacity-40 filter grayscale"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-sm md:text-base text-white leading-snug">
                            {displayName}
                          </h3>
                          {isCombo && (
                            <span
                              className="px-2 py-0.5 mt-1.5 inline-block rounded-full text-[10px] font-extrabold text-white shadow shadow-yellow-500/20 tracking-wider"
                              style={{ background: "linear-gradient(140deg, #d4af37, #ffcc33, #d4af37)", color: "#4a3200" }}
                            >
                              COMBO PACK
                            </span>
                          )}
                          <p className="text-xs text-gray-400 mt-1.5 font-medium">
                            ₹{itemPrice.toLocaleString("en-IN")} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white text-base">
                            ₹{itemTotal.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {isCombo && (() => {
                        const stats = calculateComboStats(item, discountPct);
                        return (
                          <div className="mt-2 pt-3 border-t border-gray-800/60">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Included Products:</span>
                              {stats.showDiscount && (
                                <div className="text-right flex items-center gap-2">
                                  <span className="text-xs text-gray-500 line-through">₹{stats.originalValue.toLocaleString("en-IN")}</span>
                                  <span className="text-[11px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Save ₹{stats.savings.toLocaleString("en-IN")}</span>
                                </div>
                              )}
                            </div>
                            <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {getValidComboProducts(item).map((cp, idx) => (
                                <li key={idx} className="flex justify-between text-xs text-gray-300 items-center">
                                  <span className="truncate pr-3 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-primary/60"></span>
                                    {cp.product?.name || "Product"}
                                  </span>
                                  <span className="shrink-0 text-gray-500 font-medium">x{cp.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
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
                      {addr.email && (
                        <p className="text-xs text-gray-400 mt-0.5">{addr.email}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {addr.addressLine1}
                        {addr.addressLine2
                          ? `, ${addr.addressLine2}`
                          : ""}, {addr.city}, {addr.state} – {addr.pincode}
                      </p>
                      {addr.isDefault && (
                        <span className="badge-fire text-xs mt-1.5 inline-block mr-2">
                          Default
                        </span>
                      )}
                      <button
                        onClick={(e) => handleEditAddress(e, addr)}
                        className="text-xs text-primary hover:underline mt-1.5 inline-block"
                      >
                        Edit
                      </button>
                    </div>
                    {selectedAddr === addr._id && (
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    )}
                  </label>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!showAddAddr) {
                    setEditingAddrId(null);
                    setAddrForm({
                      fullName: "",
                      email: "",
                      phone: "",
                      addressLine1: "",
                      addressLine2: "",
                      city: "",
                      state: "",
                      pincode: "",
                      isDefault: false,
                    });
                  }
                  setShowAddAddr(!showAddAddr);
                }}
                className="flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>

              {showAddAddr && (
                <div className="mt-4 p-4 rounded-xl grid grid-cols-2 gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,102,0,0.1)" }}>
                  {[
                    { id: "fullName", label: "Full Name", colSpan: 1, type: "text" },
                    { id: "email", label: "Email", colSpan: 1, type: "email" },
                    { id: "phone", label: "Phone", colSpan: 1, type: "text" },
                    { id: "addressLine1", label: "Address Line 1", colSpan: 2, type: "text" },
                    {
                      id: "addressLine2",
                      label: "Address Line 2 (optional)",
                      colSpan: 2,
                      type: "text"
                    },
                    { id: "city", label: "City", colSpan: 1, type: "text" },
                    { id: "state", label: "State", colSpan: 1, type: "text" },
                    { id: "pincode", label: "Pincode", colSpan: 1, type: "text" },
                  ].map(({ id, label, colSpan, type }) => (
                    <div key={id} className={colSpan === 2 ? "col-span-2" : ""}>
                      <label className="text-xs font-semibold text-gray-400 block mb-1">
                        {label}
                      </label>
                      <input
                        type={type}
                        value={addrForm[id]}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, [id]: e.target.value })
                        }
                        className="input-fire text-sm py-2"
                      />
                    </div>
                  ))}
                  <div className="col-span-2 flex gap-3 mt-2">
                    <button
                      onClick={saveAddress}
                      className="btn-fire px-5 py-2 text-sm rounded-lg"
                    >
                      {editingAddrId ? "Update Address" : "Save Address"}
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

            {/* Payment Instructions */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
              <h2 className="font-heading font-semibold text-lg text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Payment Instructions
              </h2>
              <div className="bg-[#1a1726] p-4 rounded-xl border border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <GPayIcon className="w-14 h-14 shrink-0" />
                    <PhonePeIcon className="w-14 h-14 shrink-0" />
                    <PaytmIcon className="w-14 h-14 shrink-0" />
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    We accept payments via <strong className="text-white">Google Pay, PhonePe, and Paytm</strong>.
                    After clicking "Place Order", please transfer the total amount to either of the numbers below.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 p-4 rounded-lg" style={{ background: "rgba(255,102,0,0.05)", border: "1px solid rgba(255,102,0,0.1)" }}>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-base tracking-wide">+91 97896 92606</span>
                    <span className="text-xs text-gray-400 mt-0.5">Alagarsamy</span>
                  </div>
                  <div className="hidden sm:block w-px bg-gray-800"></div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-base tracking-wide">+91 88386 96953</span>
                    <span className="text-xs text-gray-400 mt-0.5">Hari Prasath</span>
                  </div>
                </div>
                <p className="text-xs text-yellow-500 font-medium mt-4 text-center">
                  * Note: Your order will only be processed once payment is received and verified.
                </p>
              </div>
            </div>
          </div>

          {/* Summary & Pay */}
          <div className="rounded-2xl p-6 h-fit sticky top-24" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
            <h2 className="font-heading font-semibold text-lg text-white mb-5">
              Order Summary
            </h2>
            <div className="space-y-2.5 text-sm">

              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-white">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-gray-400">
                <span>Shipping Cost</span>
                <span className="text-orange-400 font-semibold">Pay on Delivery</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>Coupon Discount {couponDiscountText && <span className="text-xs font-bold text-green-500 ml-1">{couponDiscountText}</span>}</span>
                  <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-400">
                <span>Packaging Charges</span>
                <span className="text-white">+₹{packagingCharges.toLocaleString("en-IN")}</span>
              </div>

              <div className="pt-3 flex justify-between font-heading font-bold text-white text-base" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
                <span>Total</span>
                <div className="text-right">
                  <span className="text-primary">₹{finalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Collapsible Coupon UI */}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
              <button
                onClick={() => setShowCouponInput(!showCouponInput)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Have a coupon code?
                </span>
                {showCouponInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCouponInput && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={isApplying || appliedCoupon}
                      className="input-fire flex-1 py-2 text-sm uppercase"
                    />
                    {appliedCoupon ? (
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                          setCouponDiscount(0);
                          setCouponDiscountText("");
                        }}
                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!couponCode) return;
                          setIsApplying(true);
                          try {
                            const { data } = await api.post("/coupons/validate", {
                              code: couponCode,
                              orderTotal: total
                            });
                            setAppliedCoupon(data.couponCode);
                            setCouponDiscount(data.discount);
                            setCouponDiscountText(data.discountText || "");
                            toast.success(data.message);
                          } catch (err) {
                            toast.error(err?.response?.data?.message || "Invalid coupon");
                          } finally {
                            setIsApplying(false);
                          }
                        }}
                        disabled={isApplying || !couponCode}
                        className="btn-fire px-4 py-2 text-sm rounded-lg disabled:opacity-50"
                      >
                        {isApplying ? "..." : "Apply"}
                      </button>
                    )}
                  </div>
                </div>
              )}
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
              className={`w-full justify-center mt-5 py-3.5 text-base rounded-xl flex items-center gap-2 font-bold transition-all ${canCheckout
                ? "btn-fire"
                : "opacity-50 cursor-not-allowed"
                }`}
              style={!canCheckout ? { background: "#1a1726", color: "#555" } : {}}
            >
              {payLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Placing Order...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Place Order
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
