import axios from "axios";

// ⚠️ BẮT BUỘC phải có trong production
const baseURL = import.meta.env.VITE_API_URL;

// Fail sớm nếu quên set env (đỡ deploy nhầm localhost)
if (!baseURL) {
  throw new Error("VITE_API_URL is not defined");
}

const api = axios.create({
  baseURL: baseURL.replace(/\/+$/, ""), // bỏ / cuối nếu có
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("token");

      // tránh redirect loop
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;
