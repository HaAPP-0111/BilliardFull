import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 14px",
  color: isActive ? "#fff" : "#cbd5e1",
  background: isActive ? "#0b64b3" : "transparent",
  textDecoration: "none",
  borderRadius: 6,
  marginBottom: 6,
  fontSize: 14,
  borderLeft: isActive ? "4px solid #06b6d4" : "4px solid transparent",
});

return (
<div
style={{
  width: 240,
  background: "#071233",
  color: "white",
  padding: 20,
}}
>
  
  <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        background: "linear-gradient(135deg,#06b6d4,#0ea5e9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
      }}
    >
      BL
    </div>
    <div>
      <div style={{ fontWeight: 700 }}>2TL</div>
      <div style={{ fontSize: 12, color: "#93c5fd" }}>Quản trị</div>
    </div>
  </div>

  <NavLink to="/dashboard" style={linkStyle}>
    📊 Tổng quan
  </NavLink>
  <NavLink to="/cashier" style={linkStyle}>
    💳 Thu Ngân
  </NavLink>
  <NavLink to="/products" style={linkStyle}>
    🛒 Hàng hóa
  </NavLink>
  <NavLink to="/tables" style={linkStyle}>
    🍽 Phòng / Bàn
  </NavLink>
  <NavLink to="/bills" style={linkStyle}>
    🧾 Giao dịch
  </NavLink>
  <NavLink to="/employees" style={linkStyle}>
    👨‍💼 Nhân viên
  </NavLink>
</div>
);
}
