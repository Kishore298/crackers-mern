import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
// We must import requestFirebaseToken dynamically to avoid circular dependency since firebase.js imports api


const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Milesweb Workaround: Override PUT/DELETE with POST to bypass server-level blocks
  const method = config.method?.toLowerCase();
  if (method === "put" || method === "delete" || method === "patch") {
    if (config.data instanceof FormData) {
      config.data.append("_method", method.toUpperCase());
    } else {
      config.data = {
        ...(config.data || {}),
        _method: method.toUpperCase(),
      };
    }
    config.method = "post";
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Prevent redirect loop if the login request itself returns 401
    if (err.response?.status === 401 && !err.config.url.includes("/auth/login")) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export { api };

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem("adminUser");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (user, token) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(user));
    setAdmin(user);
    
    // Request push notification permission after login
    setTimeout(async () => {
      try {
        const { requestFirebaseToken } = await import("../config/firebase");
        requestFirebaseToken();
      } catch (err) {
        console.warn("Could not load firebase module", err);
      }
    }, 1500);
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setAdmin(null);
  };
  
  // Try to register token on app load if already logged in
  useEffect(() => {
    if (admin) {
      import("../config/firebase").then(({ requestFirebaseToken, onForegroundMessage }) => {
        requestFirebaseToken();
        onForegroundMessage();
      }).catch(() => {});
    }
  }, [admin]);

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
