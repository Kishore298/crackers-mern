import React, { useState, useRef, useEffect } from "react";
import { Bell, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        className="relative p-1.5 hover:bg-surface rounded-xl transition-colors flex flex-col items-center min-w-[44px]"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-1 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
            style={{
              background: "linear-gradient(140deg,#8b0000,#ff6600,#ffcc33)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-orange-100 py-1 z-50 flex flex-col max-h-[75vh] sm:max-h-[60vh] overflow-hidden">
          <div className="px-4 py-3 border-b border-orange-50 flex items-center justify-between shrink-0 bg-gray-50/50">
            <h3 className="font-heading font-bold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-white">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-orange-200" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  We'll let you know when there's an update or promotion.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-xl flex gap-3 items-start transition-colors cursor-pointer border border-transparent ${
                    !n.isRead
                      ? "bg-orange-50/40 hover:bg-orange-50/80 border-orange-100/50"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === "promo"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-orange-100 text-primary"
                    }`}
                  >
                    {n.type === "promo" ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${n.isRead ? "text-gray-700" : "text-gray-900 font-bold"}`}
                    >
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>

                    {n.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-gray-100">
                        <img
                          src={n.imageUrl}
                          alt="Promo"
                          className="w-full h-auto max-h-32 object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {n.actionUrl && (
                        <span className="text-[10px] sm:text-xs font-semibold text-primary flex items-center gap-1">
                          View details <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></div>
                  )}
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
