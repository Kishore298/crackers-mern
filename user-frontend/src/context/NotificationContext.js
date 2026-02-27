import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { requestFirebaseToken, onForegroundMessage } from "../config/firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SOCKET_URL =
  process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.token) {
      if (socketRef.current) socketRef.current.disconnect();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Connect Socket.IO
    socketRef.current = io(SOCKET_URL, {
      auth: { token: user.token },
    });

    socketRef.current.on("notification", (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((c) => c + 1);
      toast.success(newNotification.title || "New notification!");
    });

    // Support Firebase foreground push notifications
    onForegroundMessage();

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Register Firebase FCM token
    requestFirebaseToken();

    // Polling fallback (every 60s instead of 30s to reduce load)
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(intervalId);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_URL}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) setUnreadCount(data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
