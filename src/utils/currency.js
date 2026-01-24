export const formatVND = (value) => {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(safe);
};
