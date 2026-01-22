import axios from "axios";

let baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8080" : "");

if (!baseURL) {
  throw new Error("Missing VITE_API_URL");
}

baseURL = baseURL.replace(/\/+$/, "");

if (!baseURL.endsWith("/api")) {
  baseURL += "/api";
}

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
