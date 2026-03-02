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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const STATUS_STEPS = ["processing", "packed", "shipped", "delivered"];

const statusConfig = {
  processing: { label: "Processing", icon: Clock, color: "text-blue-600 bg-blue-50" },
  packed: { label: "Packed", icon: Package, color: "text-purple-600 bg-purple-50" },
  shipped: { label: "Shipped", icon: Truck, color: "text-amber-600 bg-amber-50" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-600 bg-red-50" },
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
    } catch (err) {
      alert(err?.response?.data?.message || "Request failed");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="w-full md:max-w-[90%] mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-orange-100 py-20 text-center">
            <ShoppingBag className="w-16 h-16 text-orange-200 mx-auto mb-4" />
            <h3 className="font-heading font-bold text-lg text-gray-700 mb-2">No orders yet</h3>
            <p className="text-gray-400 text-sm mb-6">Start shopping and your orders will appear here</p>
            <Link to="/products" className="btn-fire px-6 py-3 rounded-xl">Shop Now 🎆</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const st = statusConfig[order.orderStatus] || statusConfig.processing;
              const StatusIcon = st.icon;
              const isCancelled = order.orderStatus === "cancelled";
              const cancelRequested = order.cancellationRequest?.requested;
              const canRequest = order.orderStatus === "processing" && !cancelRequested;

              // Step-tracker progress
              const currentStepIdx = STATUS_STEPS.indexOf(order.orderStatus);

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-orange-100 p-5 hover:border-primary hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-gray-400">{order.invoiceNo}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                          <StatusIcon className="w-3 h-3" /> {st.label}
                        </span>
                        {cancelRequested && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                            <AlertTriangle className="w-3 h-3" /> Cancel Requested
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                        <span>{order.items?.length} item(s)</span>
                        <span>·</span>
                        <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>·</span>
                        <span className="capitalize">{order.paymentMethod} payment</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <span key={i} className="text-xs bg-surface px-2 py-1 rounded-lg text-gray-600">
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
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${passed ? "bg-primary" : "bg-gray-100"}`}>
                                {passed ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                                )}
                              </div>
                              <span className={`text-[10px] mt-1 font-semibold ${passed ? "text-primary" : "text-gray-400"}`}>
                                {stepCfg.label}
                              </span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 max-w-[40px] min-w-[16px] ${i < currentStepIdx ? "bg-primary" : "bg-gray-100"}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-orange-50">
                    <Link
                      to={`/order-success/${order._id}`}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      View Details →
                    </Link>
                    {canRequest && (
                      <button
                        onClick={() => setCancelModal(order._id)}
                        className="ml-auto text-xs text-red-600 font-semibold border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                      >
                        Request Cancellation
                      </button>
                    )}
                    {cancelRequested && (
                      <span className="ml-auto text-xs text-amber-600 font-semibold">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setCancelModal(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Request Order Cancellation</h3>
              <button onClick={() => setCancelModal(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              This sends a cancellation request to the store admin. You'll receive an email once it is processed.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setCancelModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
                Back
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={cancelLoading}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 transition-colors"
              >
                {cancelLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
