import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

if (!baseURL) {
  // để dễ phát hiện thiếu env trên Vercel (không âm thầm gọi localhost nữa)
  throw new Error("Missing VITE_API_URL. Set it in Vercel Environment Variables.");
}

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
