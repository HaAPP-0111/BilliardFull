export const API_URL = import.meta.env.VITE_API_URL;

export const toImageUrl = (path) => {
  if (!path) return "/no-image.png";
  if (path.startsWith("http")) return path;

  // nếu DB lưu "/uploads/a.jpg" hoặc "uploads/a.jpg"
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${clean}`;
};
