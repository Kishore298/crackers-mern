import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Users,
  Mail,
  Phone,
  ShoppingBag,
  IndianRupee,
  Clock,
  ShieldOff,
  Shield,
  X,
  ChevronRight,
  Package,
  MapPin,
  Calendar,
} from "lucide-react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

/* ─── Helpers ─────────────────────────────────────────── */
const fmt = (n) => (n || 0).toLocaleString("en-IN");
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusColors = {
  processing: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  shipped: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
};

/* ─── Detail Panel ────────────────────────────────────── */
const UserDetailPanel = ({ userId, onClose, onStatusToggle }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api
      .get(`/users/${userId}`)
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load user details"))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await api.patch(`/users/${userId}/toggle-status`);
      toast.success(res.data.message);
      setData((prev) => ({
        ...prev,
        user: { ...prev.user, isActive: res.data.isActive },
      }));
      onStatusToggle(userId, res.data.isActive);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="p-5 flex items-center justify-between shrink-0"
          style={{
            background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
          }}
        >
          <div>
            <h2 className="text-white font-heading font-bold text-lg">
              {data?.user?.name || "Customer Details"}
            </h2>
            <p className="text-white/80 text-xs mt-0.5">{data?.user?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-orange-100 border-t-primary animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Contact Info */}
            <div className="p-5 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="text-sm font-semibold text-gray-800 break-all">
                    {data?.user?.email}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {data?.user?.phone || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Member Since
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {fmtDate(data?.user?.createdAt)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Last Order</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {fmtDate(data?.stats?.lastOrder)}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center bg-orange-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-primary">
                    {data?.stats?.totalOrders || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Orders</p>
                </div>
                <div className="text-center bg-orange-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-primary">
                    ₹{fmt(data?.stats?.totalSpend)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Spend</p>
                </div>
                <div className="text-center bg-orange-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-primary">
                    {data?.user?.addresses?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Addresses</p>
                </div>
              </div>

              {/* Block / Unblock */}
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  data?.user?.isActive
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {data?.user?.isActive ? (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    {toggling ? "Blocking..." : "Block Customer"}
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    {toggling ? "Unblocking..." : "Unblock Customer"}
                  </>
                )}
              </button>
            </div>

            {/* Saved Addresses */}
            {(data?.user?.addresses?.length || 0) > 0 && (
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Saved Addresses
                </h3>
                <div className="space-y-2">
                  {data.user.addresses.map((addr, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600"
                    >
                      <p className="font-semibold text-gray-800">
                        {addr.fullName} · {addr.phone}
                        {addr.isDefault && (
                          <span className="ml-2 text-primary font-bold">
                            (Default)
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5">
                        {addr.addressLine1}
                        {addr.addressLine2
                          ? `, ${addr.addressLine2}`
                          : ""}, {addr.city}, {addr.state} – {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History */}
            <div className="p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Package className="w-3 h-3" /> Order History (
                {data?.orders?.length || 0})
              </h3>
              {(data?.orders || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No orders yet
                </p>
              ) : (
                <div className="space-y-3">
                  {data.orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-gray-50 rounded-xl p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">
                            #{order.invoiceNo}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {fmtDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                              statusColors[order.orderStatus] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              order.saleType === "online"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {order.saleType === "online"
                              ? "🌐 Online"
                              : "🏪 POS"}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {order.items?.length || 0} item
                          {order.items?.length !== 1 ? "s" : ""}
                          {order.paymentMethod && ` · ${order.paymentMethod}`}
                        </p>
                        <p className="font-bold text-primary text-sm">
                          ₹{fmt(order.finalPayable)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────── */
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/users?search=${encodeURIComponent(search)}&page=${page}&limit=${LIMIT}`,
      );
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusToggle = (userId, isActive) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isActive } : u)),
    );
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-gray-900">
            Customer Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} total customers
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-admin overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Customer",
                  "Contact",
                  "Orders",
                  "Total Spend",
                  "Last Order",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No customers found</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUserId(u._id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{
                            background:
                              "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                          }}
                        >
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {fmtDate(u.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-700">{u.email}</p>
                      <p className="text-xs text-gray-400">{u.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold text-gray-800">
                          {u.totalOrders}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 text-primary" />
                        <span className="font-semibold text-primary">
                          {fmt(u.totalSpend)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {fmtDate(u.lastOrder)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {u.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-50">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                  page === pg
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={
                  page === pg
                    ? {
                        background:
                          "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
                      }
                    : {}
                }
              >
                {pg}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedUserId && (
        <UserDetailPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onStatusToggle={handleStatusToggle}
        />
      )}
    </div>
  );
};

export default UsersPage;
