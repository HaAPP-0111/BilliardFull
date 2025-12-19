import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    tables: 0,
    products: 0,
    employees: 0,
    billsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      // axios baseURL: http://localhost:8080/api
      // => gọi /admin/dashboard = http://localhost:8080/api/admin/dashboard
      const res = await api.get("/admin/dashboard");

      setStats({
        tables: res.data.tableCount ?? 0,
        products: res.data.productCount ?? 0,
        employees: res.data.employeeCount ?? 0,
        billsToday: res.data.todayInvoiceCount ?? 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError("Không tải được dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Đang tải dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 20, margin: 0, color: "#0f172a" }}>Kết quả bán hàng hôm nay</h2>
            <div style={{ fontSize: 13, color: "#475569" }}>Tổng quan nhanh về hoạt động</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={loadStats}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              🔄 Làm mới
            </button>
            <button style={{ padding: "8px 14px", borderRadius: 8, background: "#06b6d4", color: "white", border: "none" }}>
              {/* placeholder for quick action */}
              Hành động
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#ffe5e5",
            color: "#b00020",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <StatCard title="Số bàn" value={stats.tables} accentColor="#3b82f6" />
        <StatCard
          title="Sản phẩm"
          value={stats.products}
          accentColor="#22c55e"
        />
        <StatCard
          title="Nhân viên"
          value={stats.employees}
          accentColor="#f97316"
        />
        <StatCard
          title="Hóa đơn hôm nay"
          value={stats.billsToday}
          accentColor="#a855f7"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, accentColor }) {
  return (
    <div
      style={{
        flex: "1 1 200px",
        minWidth: 200,
        padding: 20,
        background: "white",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 14, color: "#6b7280" }}>{title}</div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: accentColor || "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}
