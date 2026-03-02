import React, { useEffect, useState, useCallback } from "react";
import { Search, ChevronDown, X, AlertTriangle, CheckCircle } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  processing: "badge-processing",
  packed: "badge-packed",
  shipped: "badge-shipped",
  delivered: "badge-delivered",
  cancelled: "badge-cancelled",
};

const STATUSES = ["processing", "packed", "shipped", "delivered", "cancelled"];

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [expanding, setExpanding] = useState(null);

  // Cancellation modal state
  const [cancelModal, setCancelModal] = useState(null); // { orderId, mode: 'cancel'|'reject' }
  const [cancelNote, setCancelNote] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const { data } = await api.get(`/orders/admin?${params}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, orderStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus });
      toast.success(`Status updated to "${orderStatus}"`);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    setCancelLoading(true);
    try {
      if (cancelModal.mode === "cancel") {
        await api.post(`/orders/${cancelModal.orderId}/cancel`, { adminNote: cancelNote });
        toast.success("Order cancelled and stock restocked.");
      } else {
        await api.post(`/orders/${cancelModal.orderId}/cancel-reject`, { adminNote: cancelNote });
        toast.success("Cancellation request rejected.");
      }
      setCancelModal(null);
      setCancelNote("");
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setCancelLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 20);
  const hasFilters = search || statusFilter || dateFrom || dateTo;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-heading font-bold text-xl text-gray-900">
          Orders <span className="text-gray-400 font-normal text-base">({total})</span>
        </h2>
      </div>

      {/* Filters */}
      <div className="card-admin mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search invoice or name..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="card-admin overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Invoice", "Customer", "Type", "Amount", "Date", "Status", "Update Status"].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="w-8 h-8 rounded-full border-4 border-orange-100 border-t-primary animate-spin mx-auto" />
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr
                    className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => setExpanding(expanding === order._id ? null : order._id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-600">{order.invoiceNo}</span>
                        {order.cancellationRequest?.requested && (
                          <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Cancel Req
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800 text-xs">
                        {order.customer?.name || order.billingInfo?.name || "—"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {order.customer?.email || order.billingInfo?.phone || ""}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.saleType === "offline" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {order.saleType === "offline" ? "POS" : "Online"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">₹{order.finalPayable?.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={STATUS_CONFIG[order.orderStatus] || "badge-gray"}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1.5">
                        {order.orderStatus !== "cancelled" && (
                          <select
                            value={order.orderStatus}
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        )}
                        {order.orderStatus !== "cancelled" && (
                          <button
                            onClick={() => setCancelModal({ orderId: order._id, mode: "cancel" })}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold border border-red-100 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expanding === order._id && (
                    <tr className="bg-orange-50/50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                          {/* Items */}
                          <div>
                            <p className="font-bold text-gray-700 mb-2">Items</p>
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex justify-between py-1 border-b border-orange-100">
                                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                                <span className="font-semibold">₹{item.subtotal}</span>
                              </div>
                            ))}
                          </div>

                          {/* Shipping */}
                          <div>
                            <p className="font-bold text-gray-700 mb-2">Shipping Address</p>
                            {order.shippingAddress ? (
                              <>
                                <p className="text-gray-600">{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
                                <p className="text-gray-400">{order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
                              </>
                            ) : (
                              <p className="text-gray-400">POS / Walk-in</p>
                            )}
                          </div>

                          {/* Cancellation request */}
                          {order.cancellationRequest?.requested && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                              <p className="font-bold text-red-700 mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Cancellation Requested
                              </p>
                              <p className="text-gray-600 mb-1">
                                <strong>Reason:</strong> {order.cancellationRequest.reason || "No reason given"}
                              </p>
                              <p className="text-gray-400 text-xs mb-3">
                                {new Date(order.cancellationRequest.requestedAt).toLocaleString("en-IN")}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setCancelModal({ orderId: order._id, mode: "cancel" })}
                                  className="flex-1 text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Accept & Cancel
                                </button>
                                <button
                                  onClick={() => setCancelModal({ orderId: order._id, mode: "reject" })}
                                  className="flex-1 text-xs bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400">No orders found</td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-50">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold ${page === pg ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                style={page === pg ? { background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)" } : {}}
              >
                {pg}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cancel / Reject Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setCancelModal(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {cancelModal.mode === "cancel" ? "Cancel Order" : "Reject Cancellation Request"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {cancelModal.mode === "cancel"
                ? "This will cancel the order, restock all items, and notify the customer via email."
                : "The customer's cancellation request will be rejected. Add a note to explain."}
            </p>
            <textarea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              placeholder={cancelModal.mode === "cancel" ? "Admin note (optional)" : "Reason for rejection (optional)"}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setCancelModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Back
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelLoading}
                className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors ${cancelModal.mode === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-800"}`}
              >
                {cancelLoading ? "Processing..." : cancelModal.mode === "cancel" ? "Confirm Cancel" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
