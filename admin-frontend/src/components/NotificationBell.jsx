import React, { useEffect, useState, useRef } from "react";
import { Bell, Trash2, ExternalLink } from "lucide-react";
import io from "socket.io-client";
import { useAdminAuth, api } from "../context/AdminAuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const SOCKET_URL =
  process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

const NotificationBell = () => {
  const { admin } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!admin || !token) return;

    // Fetch initial data
    fetchNotifications();
    fetchUnreadCount();

    // Connect socket
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      console.log("Admin socket connected to server!");
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Admin socket connection error:", err.message);
    });

    socketRef.current.on("new_order", (notification) => {
      // 1. Immediately update UI with socket payload (fixes empty dropdown)
      if (notification && notification._id) {
        setNotifications((prev) => [notification, ...prev]);
      }
      // 2. Re-fetch with a cache buster to guarantee DB sync
      fetchNotifications();
      fetchUnreadCount();
      toast.success(notification?.title || "New order received!");
      
      // 3. Dispatch a custom event so other components (like OrdersPage) can react
      window.dispatchEvent(new CustomEvent("newOrderReceived", { detail: notification }));
    });

    // Fallback polling every 30s
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Cache buster prevents browser from returning stale empty arrays
      const res = await api.get(`/notifications?limit=10&_t=${Date.now()}`);
      if (res.data.success) setNotifications(res.data.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get(`/notifications/unread-count`);
      if (res.data.success) setUnreadCount(res.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(`/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchUnreadCount(); // Recalculate unread count
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await api.delete(`/notifications/all`);
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) markAsRead(n._id);

    if (n.actionUrl) {
      setOpen(false);
      if (n.actionUrl.startsWith("http")) {
        window.open(n.actionUrl, "_blank", "noopener,noreferrer");
      } else {
        navigate(n.actionUrl);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[70vh]">
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h3 className="text-sm font-semibold text-gray-800">
              Notifications
            </h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  className="text-xs text-red-500 font-medium hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-6">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-lg flex gap-3 items-start transition-colors cursor-pointer ${
                    n.isRead
                      ? "hover:bg-gray-50 bg-white"
                      : "bg-orange-50/50 hover:bg-orange-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === "order"
                        ? "bg-green-100 text-green-600"
                        : "bg-orange-100 text-primary"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${n.isRead ? "text-gray-700" : "text-gray-900 font-semibold"}`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                      {n.actionUrl && (
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 mt-1 shrink-0">
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n._id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
