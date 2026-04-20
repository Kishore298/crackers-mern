import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lash_token");
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

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("lash_token");
      localStorage.removeItem("lash_user");
    }
    return Promise.reject(err);
  },
);

export default api;
