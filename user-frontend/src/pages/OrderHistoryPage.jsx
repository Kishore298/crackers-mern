import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Edit2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import SEO from "../components/SEO";

const STATUS_STEPS = ["processing", "packed", "shipped", "delivered"];

const statusConfig = {
  processing: { label: "Processing", icon: Clock, color: "text-blue-400 bg-blue-500/10" },
  packed: { label: "Packed", icon: Package, color: "text-purple-400 bg-purple-500/10" },
  shipped: { label: "Shipped", icon: Truck, color: "text-amber-400 bg-amber-500/10" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-400 bg-green-500/10" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-400 bg-red-500/10" },
};

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancelModal, setCancelModal] = useState(null); // orderId
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Address edit modal state
  const [editAddressModal, setEditAddressModal] = useState(null); // order object
  const [addressForm, setAddressForm] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/orders");
      setOrders(data.orders || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login?redirect=/orders"); return; }
    fetchOrders();
  }, [user, navigate, fetchOrders]);

  const handleCancelRequest = async () => {
    setCancelLoading(true);
    try {
      await api.post(`/orders/${cancelModal}/cancel-request`, { reason: cancelReason });
      setCancelModal(null);
      setCancelReason("");
      fetchOrders();
      toast.success("Cancellation request sent");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Request failed");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      await api.put(`/orders/${editAddressModal._id}/shipping-address`, addressForm);
      setEditAddressModal(null);
      setAddressForm(null);
      fetchOrders();
      toast.success("Shipping address updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update address");
    } finally {
      setAddressLoading(false);
    }
  };

  const openAddressEdit = (order) => {
    setEditAddressModal(order);
    setAddressForm({ ...order.shippingAddress });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-96" style={{ background: "#0a0814" }}>
        <div className="w-10 h-10 rounded-full border-4 border-surface-2 border-t-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen py-8 animate-fade-in-up" style={{ background: "#0a0814" }}>
      <SEO title="My Orders" />
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-2xl text-white mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="rounded-2xl py-20 text-center border shadow-sm" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}>
            <ShoppingBag className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="font-heading font-bold text-lg text-white mb-2">No orders yet</h3>
            <p className="text-gray-400 text-sm mb-6">Start shopping and your orders will appear here</p>
            <Link to="/products" className="btn-fire px-6 py-3 rounded-xl inline-block">Shop Now 🎇</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const st = statusConfig[order.orderStatus] || statusConfig.processing;
              const StatusIcon = st.icon;
              const isCancelled = order.orderStatus === "cancelled";
              const cancelRequested = order.cancellationRequest?.requested;
              const canRequest = order.orderStatus === "processing" && !cancelRequested;
              const canEditAddress = !["delivered", "cancelled"].includes(order.orderStatus);

              // Step-tracker progress
              const currentStepIdx = STATUS_STEPS.indexOf(order.orderStatus);

              return (
                <div
                  key={order._id}
                  className="rounded-2xl p-5 hover:border-primary-light transition-all border"
                  style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-gray-400">{order.invoiceNo}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                          <StatusIcon className="w-3 h-3" /> {st.label}
                        </span>
                        {cancelRequested && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400">
                            <AlertTriangle className="w-3 h-3" /> Cancel Requested
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
                        <span>{order.items?.length} item(s)</span>
                        <span>·</span>
                        <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>·</span>
                        <span className="capitalize">{order.paymentMethod} payment</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-lg text-gray-300" style={{ background: "rgba(255,255,255,0.05)" }}>
                            {item.name} ×{item.quantity}
                          </span>
                        ))}
                        {order.items?.length > 3 && (
                          <span className="text-xs text-gray-400">+{order.items.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading font-bold text-primary text-lg">₹{order.finalPayable?.toLocaleString("en-IN")}</p>
                      {order.slabDiscount > 0 && (
                        <p className="text-xs text-green-400 font-semibold">
                          Saved ₹{order.slabDiscount?.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step Tracker */}
                  {!isCancelled && (
                    <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-1">
                      {STATUS_STEPS.map((step, i) => {
                        const passed = i <= currentStepIdx;
                        const stepCfg = statusConfig[step];
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center min-w-[64px]">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${passed ? "bg-primary" : "bg-surface-2"}`} style={!passed ? { background: "rgba(255,255,255,0.05)" } : {}}>
                                {passed ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                                )}
                              </div>
                              <span className={`text-[10px] mt-1 font-semibold ${passed ? "text-primary" : "text-gray-400"}`}>
                                {stepCfg.label}
                              </span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 max-w-[40px] min-w-[16px] ${i < currentStepIdx ? "bg-primary" : ""}`} style={i >= currentStepIdx ? { background: "rgba(255,255,255,0.05)" } : {}} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,102,0,0.08)" }}>
                    <Link
                      to={`/order-success/${order._id}`}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      View Details →
                    </Link>
                    
                    {canEditAddress && (
                       <button
                         onClick={() => openAddressEdit(order)}
                         className="text-xs text-gray-400 font-semibold hover:text-white transition-colors flex items-center gap-1"
                       >
                         <Edit2 className="w-3 h-3" /> Edit Address
                       </button>
                    )}

                    {canRequest && (
                      <button
                        onClick={() => setCancelModal(order._id)}
                        className="ml-auto text-xs text-red-400 font-semibold border border-red-500/20 rounded-lg px-3 py-1.5 hover:bg-red-500/10 transition-colors"
                      >
                        Request Cancellation
                      </button>
                    )}
                    {cancelRequested && (
                      <span className="ml-auto text-xs text-amber-400 font-semibold">
                        ⏳ Awaiting admin response
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Request Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setCancelModal(null)}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Request Order Cancellation</h3>
              <button onClick={() => setCancelModal(null)} className="p-1 rounded-lg hover:bg-surface-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              This sends a cancellation request to the store admin. You'll receive an email once it is processed.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              rows={3}
              className="input-fire resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setCancelModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-surface-2 hover:text-white transition-colors rounded-xl border border-transparent">
                Back
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50 transition-colors"
              >
                {cancelLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {editAddressModal && addressForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setEditAddressModal(null)}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "#13111f", border: "1px solid rgba(255,102,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Edit Shipping Address
              </h3>
              <button onClick={() => setEditAddressModal(null)} className="p-1 rounded-lg hover:bg-surface-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Full Name</label>
                  <input
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="input-fire py-2 text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Phone</label>
                  <input
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="input-fire py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Address Line 1</label>
                  <input
                    required
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    className="input-fire py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Address Line 2 (Optional)</label>
                  <input
                    value={addressForm.addressLine2 || ""}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    className="input-fire py-2 text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">City</label>
                  <input
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="input-fire py-2 text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">State</label>
                  <input
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="input-fire py-2 text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Pincode</label>
                  <input
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="input-fire py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditAddressModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-surface-2 hover:text-white transition-colors rounded-xl border border-transparent">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressLoading}
                  className="btn-fire px-6 py-2 text-sm rounded-xl disabled:opacity-50"
                >
                  {addressLoading ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderHistoryPage;
