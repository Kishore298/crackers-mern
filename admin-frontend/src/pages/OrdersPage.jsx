import React, { useEffect, useState, useCallback } from "react";
import { Search, ChevronDown } from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  processing: "badge-processing",
  packed: "badge-packed",
  shipped: "badge-shipped",
  delivered: "badge-delivered",
  cancelled: "badge-cancelled",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expanding, setExpanding] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/orders/admin?${params}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Status updated to "${status}"`);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const STATUSES = [
    "processing",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-heading font-bold text-xl text-gray-900">
          Orders{" "}
          <span className="text-gray-400 font-normal text-base">({total})</span>
        </h2>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary w-44"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-admin overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {[
                "Invoice",
                "Customer",
                "Type",
                "Amount",
                "Date",
                "Status",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                >
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
                    onClick={() =>
                      setExpanding(expanding === order._id ? null : order._id)
                    }
                  >
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">
                      {order.invoiceNo}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800 text-xs">
                        {order.billingInfo?.name || "—"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {order.billingInfo?.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.type === "offline" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {order.type === "offline" ? "POS" : "Online"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">
                      ₹{order.finalPayable}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          STATUS_CONFIG[order.orderStatus] || "badge-gray"
                        }
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          updateStatus(order._id, e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expanding === order._id && (
                    <tr className="bg-orange-50/50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-bold text-gray-700 mb-2">
                              Items
                            </p>
                            {order.items?.map((item, i) => (
                              <div
                                key={i}
                                className="flex justify-between py-1 border-b border-orange-100"
                              >
                                <span className="text-gray-700">
                                  {item.name} × {item.quantity}
                                </span>
                                <span className="font-semibold">
                                  ₹{item.subtotal}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 mb-2">
                              Shipping Address
                            </p>
                            {order.shippingAddress ? (
                              <>
                                <p className="text-gray-600">
                                  {order.shippingAddress.fullName} ·{" "}
                                  {order.shippingAddress.phone}
                                </p>
                                <p className="text-gray-400">
                                  {order.shippingAddress.addressLine1},{" "}
                                  {order.shippingAddress.city},{" "}
                                  {order.shippingAddress.state} –{" "}
                                  {order.shippingAddress.pincode}
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-400">POS / Walk-in</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400">
                  No orders found
                </td>
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
                style={
                  page === pg
                    ? { background: "linear-gradient(135deg,#FF4500,#FF6B00)" }
                    : {}
                }
              >
                {pg}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
