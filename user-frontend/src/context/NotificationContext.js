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
import api from "../services/api";

const SOCKET_URL =
  process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) socketRef.current.disconnect();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Connect Socket.IO
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current.on("notification", (newNotification) => {
      // 1. Immediately update UI with socket payload (fixes empty dropdown)
      if (newNotification && newNotification._id) {
        setNotifications((prev) => [newNotification, ...prev]);
      }
      // 2. Re-fetch with a cache buster to guarantee DB sync
      fetchNotifications();
      fetchUnreadCount();
      toast.success(newNotification?.title || "New notification!");
    });

    // Support Firebase foreground push notifications
    const unsubscribeFCM = onForegroundMessage();

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
      if (unsubscribeFCM) unsubscribeFCM();
    };
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotifications = async () => {
    try {
      // Cache buster prevents browser from returning stale empty arrays
      const res = await api.get(`/notifications?limit=20&_t=${Date.now()}`);
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/notifications/unread-count");
      if (data.success) setUnreadCount(data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const targetNotif = notifications.find((n) => n._id === id);
      if (targetNotif?.isRead) return;

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await api.patch(`/notifications/read-all`);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const targetNotif = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (targetNotif && !targetNotif.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);

      await api.delete(`/notifications/all`);
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
        deleteNotification,
        deleteAllNotifications,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
