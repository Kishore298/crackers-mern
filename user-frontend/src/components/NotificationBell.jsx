import React, { useState, useRef, useEffect } from "react";
import { Bell, Sparkles, ExternalLink } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";

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
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative p-1.5 hover:bg-surface-2 rounded-xl transition-colors flex flex-col items-center min-w-[44px]"
      >
        <Bell className="w-6 h-6 text-gray-300" />
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
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-xl py-1 z-50 flex flex-col max-h-[75vh] sm:max-h-[60vh] overflow-hidden" style={{ background: "#1a1726", border: "1px solid rgba(255,102,0,0.12)" }}>
          <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "rgba(255,102,0,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  aria-label="Mark all notifications as read"
                  className="text-xs font-semibold text-primary hover:text-primary-light transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,102,0,0.08)" }}>
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-400">
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
                      ? "border-primary/10"
                      : "hover:bg-surface-2"
                  }`}
                  style={!n.isRead ? { background: "rgba(255,102,0,0.05)" } : {}}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5`}
                    style={{
                      background: n.type === "promo"
                        ? "rgba(245,158,11,0.12)"
                        : "rgba(255,102,0,0.1)",
                    }}
                  >
                    {n.type === "promo" ? (
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Bell className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${n.isRead ? "text-gray-400" : "text-white font-bold"}`}
                    >
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>

                    {n.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,102,0,0.08)" }}>
                        <img
                          src={n.imageUrl?.replace("/upload/", "/upload/q_auto,f_auto,w_400/")}
                          alt="Promo"
                          crossOrigin="anonymous"
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
