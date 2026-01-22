import axios from "axios";

let baseURL = import.meta.env.VITE_API_URL;

// Ép phải có env
if (!baseURL) {
  throw new Error("Missing VITE_API_URL. Set it in Vercel Environment Variables.");
}

// Xoá slash cuối
baseURL = baseURL.replace(/\/+$/, "");

// ✅ ĐẢM BẢO CÓ /api
if (!baseURL.endsWith("/api")) {
  baseURL = `${baseURL}/api`;
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== Request interceptor (JWT) =====
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Response interceptor =====
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("token");

      // Tránh loop redirect
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;
