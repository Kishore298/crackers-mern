import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  CheckCircle,
  Package,
  MapPin,
  Receipt,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import GPayIcon from "../components/GPayIcon";
import PhonePeIcon from "../components/PhonePeIcon";
import PaytmIcon from "../components/PaytmIcon";
import api from "../services/api";
import WelcomeFireworks from "../components/WelcomeFireworks";

const STATUS_MAP = {
  processing: { label: "Processing", color: "text-blue-400 bg-blue-500/10" },
  packed: { label: "Packed", color: "text-purple-400 bg-purple-500/10" },
  shipped: { label: "Shipped", color: "text-amber-400 bg-amber-500/10" },
  delivered: { label: "Delivered", color: "text-green-400 bg-green-500/10" },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/10" },
};


const OrderSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Only show fireworks if arriving directly from checkout
  const [showFireworks] = useState(location.state?.isNewOrder || false);

  useEffect(() => {
    // Clear state so reload doesn't trigger fireworks again
    if (location.state?.isNewOrder) {
      window.history.replaceState({}, document.title);
      // Temporarily override the WelcomeFireworks sessionStorage block since they just placed an order
      sessionStorage.removeItem("hasSeenFireworks_v12");
    }
  }, [location.state]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.order);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-96" style={{ background: "#0a0814" }}>
        <div className="w-10 h-10 rounded-full border-4 border-surface-2 border-t-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen py-6 relative" style={{ background: "#0a0814" }}>
      {showFireworks && <WelcomeFireworks />}

      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6 relative z-10 animate-fade-in-up">
        {/* Success Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="font-heading font-bold text-xl text-white mb-1">
            Order Placed! 🎇
          </h1>
          <p className="text-gray-400">Your products are on their way!</p>
          {order?.invoiceNo && (
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Invoice: {order.invoiceNo}
            </p>
          )}
        </div>

        {order && (
          <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
            {/* Order Status */}
            <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Package className="w-4 h-4 text-primary" />
                <span>Order Status</span>
              </div>
              <span
                className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md ${STATUS_MAP[order.orderStatus]?.color || "text-gray-400 bg-surface-2"}`}
              >
                {STATUS_MAP[order.orderStatus]?.label}
              </span>
            </div>

            {/* Items */}
            <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
              <h3 className="font-semibold text-sm text-gray-300 mb-3">
                Items Ordered
              </h3>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#0f0d1a] overflow-hidden shrink-0 border border-gray-800">
                        {item.product?.images?.[0]?.url ? (
                          <img
                            src={item.product.images[0].url.replace("/upload/", "/upload/w_100,q_auto/")}
                            alt={item.name}
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src="/v-crackers-logo.webp"
                            alt="VCrackers Logo"
                            className="w-full h-full object-contain opacity-80 p-2"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-white">
                      ₹{item.subtotal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
                <h3 className="font-semibold text-sm text-gray-300 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Delivery Address
                </h3>
                <p className="text-sm text-white">
                  {order.shippingAddress.fullName} ·{" "}
                  {order.shippingAddress.phone}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {order.shippingAddress.addressLine1},{" "}
                  {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
                  {order.shippingAddress.pincode}
                </p>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,102,0,0.08)" }}>
              <h3 className="font-semibold text-sm text-gray-300 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" /> Payment Instructions
              </h3>
              
              <div className="bg-[#1a1726] p-3 rounded-xl border border-gray-800 mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <GPayIcon className="w-16 h-12 shrink-0" />
                    <PhonePeIcon className="w-16 h-12 shrink-0" />
                    <PaytmIcon className="w-16 h-12 shrink-0" />
                  </div>
                  <p className="text-sm text-gray-300">Please transfer the total amount via Google Pay, PhonePe, or Paytm to either of the numbers below:</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm tracking-wide">+91 97896 92606</span>
                    <span className="text-xs text-gray-400">— Alagarsamy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm tracking-wide">+91 88386 96953</span>
                    <span className="text-xs text-gray-400">— Hari Prasath</span>
                  </div>
                </div>
              </div>

              <a 
                href="https://wa.me/919789692606" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-2 rounded-xl border-2 transition-all hover:bg-green-500/10"
                style={{ borderColor: "#25D366", color: "#25D366" }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                <span className="font-bold">Send Payment Screenshot to WhatsApp</span>
              </a>

              {order.paymentStatus === "pending" ? (
                <p className="text-xs text-yellow-500 font-medium mt-3 text-center">
                  * Order will be processed once payment is verified
                </p>
              ) : (
                <p className="text-xs text-green-400 font-bold mt-3 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Payment Verified
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="px-4 py-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              {order.slabDiscount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span className="flex items-center gap-1">
                    Slab Discount
                    {order.slabLabel && (
                      <span className="text-gray-400 text-xs">({order.slabLabel})</span>
                    )}
                  </span>
                  <span className="font-bold">−₹{order.slabDiscount?.toLocaleString("en-IN")}</span>
                </div>
              )}
              {order.discount > 0 && !order.slabDiscount && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-heading font-bold text-base text-white pt-2" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
                <span>{order.paymentStatus === "paid" ? "Total Paid" : "Total Payable"}</span>
                <div className="text-right">
                  <span className="text-primary">₹{order.finalPayable?.toLocaleString("en-IN")}</span>

                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            to="/orders"
            className="btn-fire flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold"
          >
            <Receipt className="w-4 h-4" /> My Orders
          </Link>
          <Link
            to="/products"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 text-primary rounded-xl font-semibold transition-colors"
            style={{ border: "2px solid rgba(255,102,0,0.3)", background: "rgba(255,102,0,0.05)" }}
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
