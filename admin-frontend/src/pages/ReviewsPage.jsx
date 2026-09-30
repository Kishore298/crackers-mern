import { useState, useEffect, useCallback } from "react";
import { api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";
import { Star, Check, X, Trash2, Globe, Monitor, Send } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

const TABS = [
  { key: "all", label: "All Reviews", params: {} },
  { key: "pending", label: "Pending", params: { source: "website", status: "pending" } },
  { key: "approved", label: "Approved", params: { source: "website", status: "approved" } },
  { key: "rejected", label: "Rejected", params: { source: "website", status: "rejected" } },
  { key: "google", label: "Google Reviews", params: { source: "google" } },
];

const ReviewsPage = () => {
  const [tab, setTab] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, loading: false });
  const [broadcasting, setBroadcasting] = useState(false);
  const limit = 20;

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const currentTab = TABS.find((t) => t.key === tab);
      const params = { ...currentTab.params, page, limit };
      const { data } = await api.get("/reviews/admin", { params });
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setCounts(data.counts || {});
    } catch (err) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/reviews/admin/${id}/status`, { status });
      toast.success(`Review ${status}`);
      fetchReviews();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      setConfirmDelete((c) => ({ ...c, loading: true }));
      await api.delete(`/reviews/admin/${confirmDelete.id}`);
      toast.success("Review deleted");
      setConfirmDelete({ open: false, id: null, loading: false });
      fetchReviews();
    } catch (err) {
      toast.error("Failed to delete");
      setConfirmDelete((c) => ({ ...c, loading: false }));
    }
  };

  const handleBroadcast = async () => {
    if (!window.confirm("Are you sure you want to send review requests via WhatsApp to ALL registered customers? This may take a while depending on the number of customers.")) {
      return;
    }
    
    setBroadcasting(true);
    try {
      const { data } = await api.post("/reviews/admin/broadcast");
      toast.success(data.message || "Broadcasting started");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start broadcast");
    } finally {
      setBroadcasting(false);
    }
  };

  const Stars = ({ rating }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-heading font-bold text-gray-900">Reviews</h1>
        
        <button
          onClick={handleBroadcast}
          disabled={broadcasting}
          className="flex items-center gap-2 bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
          {broadcasting ? "Broadcasting..." : "Send Review Request to All"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => {
          const count =
            t.key === "all"
              ? counts.all
              : t.key === "google"
              ? counts.google
              : counts[t.key];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              }`}
            >
              {t.label}
              {count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                  tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center text-gray-500 py-16">No reviews found.</div>
      ) : (
        <div className="card-admin overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">Rating</th>
                <th className="py-3 px-4 font-medium">Review</th>
                <th className="py-3 px-4 font-medium">Source</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr
                  key={r._id}
                  className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="text-gray-900 font-medium">
                      {r.customerName || r.customer?.name || "—"}
                    </div>
                    {r.customer?.phone && (
                      <div className="text-xs text-gray-500">{r.customer.phone}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Stars rating={r.rating} />
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-gray-700 truncate">{r.comment || "—"}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        r.source === "google"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {r.source === "google" ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <Monitor className="w-3 h-3" />
                      )}
                      {r.source === "google" ? "Google" : "Website"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : r.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    {r.source === "website" && (
                      <div className="flex gap-1">
                        {r.status !== "approved" && (
                          <button
                            onClick={() => handleStatusChange(r._id, "approved")}
                            className="p-1.5 rounded bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 border border-gray-200 hover:border-green-200 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button
                            onClick={() => handleStatusChange(r._id, "rejected")}
                            className="p-1.5 rounded bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setConfirmDelete({ open: true, id: r._id, loading: false })
                          }
                          className="p-1.5 rounded bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-colors ml-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {r.source === "google" && (
                      <span className="text-xs text-gray-500">Synced</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                page === p
                  ? "bg-primary text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null, loading: false })}
        loading={confirmDelete.loading}
      />
    </div>
  );
};

export default ReviewsPage;
