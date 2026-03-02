import React, { useState, useEffect } from "react";
import { Bell, Send, Image as ImageIcon, Link2 } from "lucide-react";
import { useAdminAuth, api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";

const NotificationsPage = () => {
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    imageUrl: "",
    actionUrl: "",
  });

  useEffect(() => {
    fetchHistory();
  }, [admin]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/notifications/history?limit=10");
      if (data.success) setHistory(data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      return toast.error("Title and body are required");
    }

    setLoading(true);
    try {
      const { data } = await api.post("/notifications/send", formData);
      if (data.success) {
        toast.success(`Sent via In-App! Push sent to ${data.pushSent} devices`);
        setFormData({ title: "", body: "", imageUrl: "", actionUrl: "" });
        fetchHistory();
      } else {
        toast.error(data.message || "Failed to send notification");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-primary">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Push Notifications
          </h1>
          <p className="text-sm text-gray-500">
            Send real-time alerts and promotional push notifications to your
            customers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Composer Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400"></div>
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            Compose Message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Notification Title *
              </label>
              <input
                type="text"
                maxLength={65}
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="e.g., Flash Sale: 50% OFF on Sparklers! 🧨"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Message Body *
              </label>
              <textarea
                required
                rows={3}
                maxLength={200}
                value={formData.body}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, body: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                placeholder="Grab our biggest discounts of the season before stocks run out..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Image URL (Optional)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      imageUrl: e.target.value,
                    }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="https://example.com/promo-banner.jpg"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Displays a large rich image on Android/iOS devices.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Action Link (Optional)
              </label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.actionUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      actionUrl: e.target.value,
                    }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="/products?category=123"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Where the user is taken when they click the notification. Use
                absolute or relative URLs.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-fire py-3 rounded-xl flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Broadcast
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Sent History</h2>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-6 h-6 border-2 border-orange-200 border-t-primary rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">
                  No notifications sent yet.
                </p>
              </div>
            ) : (
              history.map((n) => (
                <div
                  key={n._id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-sm text-gray-900">
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-3">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{n.body}</p>
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100/50">
                    <span className="text-xs font-medium text-primary bg-orange-50 px-2 py-0.5 rounded-md">
                      Broadcast
                    </span>
                    {n.imageUrl && (
                      <span className="text-xs text-gray-400 line-clamp-1 w-24">
                        📷 Img linked
                      </span>
                    )}
                    {n.actionUrl && (
                      <span className="text-xs text-blue-500 hover:underline cursor-pointer">
                        🔗 Link
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
