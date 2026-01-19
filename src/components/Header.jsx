import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const navItems = [
    { label: "Tổng quan", path: "/dashboard" },
    { label: "Hàng hóa", path: "/products" },
    { label: "Phòng/Bàn", path: "/tables" },
    { label: "Hóa đơn", path: "/bills" },
    // { label: "Đối tác", path: "#" },
    { label: "Nhân viên", path: "/employees" },
    // { label: "Sổ quỹ", path: "#" },
    // { label: "Báo cáo", path: "#" },
  ];

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          background: "#0b64b3",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: "linear-gradient(135deg,#19a2ff,#00c2a8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            BL
          </div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>2TL</div>
        </div>

        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          {navItems.map((n) => (
            <div
              key={n.label}
              onClick={() => n.path !== "#" && navigate(n.path)}
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: 14,
                cursor: n.path !== "#" ? "pointer" : "default",
                opacity: n.path === "#" ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) =>
                n.path !== "#" && (e.target.style.opacity = "0.8")
              }
              onMouseLeave={(e) =>
                n.path !== "#" && (e.target.style.opacity = "1")
              }
            >
              {n.label}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.95 }}>admin</div>
          <button
            onClick={logout}
            style={{
              padding: "6px 12px",
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={{ height: 8, background: "#f1f5f9" }} />
    </div>
  );
}
