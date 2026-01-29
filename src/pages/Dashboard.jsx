import React, { useEffect, useState } from "react";
import api from "../api/axios";
import RevenueChatBox from "../components/RevenueChatBox";

export default function Dashboard() {
  const [stats, setStats] = useState({
    tables: 0,
    products: 0,
    employees: 0,
    billsToday: 0,

    revenueToday: 0,
    subtotalToday: 0,
    discountToday: 0,
    taxToday: 0,

    topItemsToday: [],
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
      // baseURL: http://localhost:3000/api (proxy sang 8080)
      const res = await api.get("/admin/dashboard");

      setStats({
        tables: res.data.tableCount ?? 0,
        products: res.data.productCount ?? 0,
        employees: res.data.employeeCount ?? 0,
        billsToday: res.data.todayInvoiceCount ?? 0,

        revenueToday: res.data.todayRevenue ?? 0,
        subtotalToday: res.data.todaySubtotal ?? 0,
        discountToday: res.data.todayDiscount ?? 0,
        taxToday: res.data.todayTax ?? 0,

        topItemsToday: res.data.topItemsToday ?? [],
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
      <Banner />

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
            <button
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "#06b6d4",
                color: "white",
                border: "none",
              }}
            >
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

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <StatCard title="Số bàn" value={stats.tables} accentColor="#3b82f6" />
        <StatCard title="Sản phẩm" value={stats.products} accentColor="#22c55e" />
        <StatCard title="Admin" value={stats.employees} accentColor="#f97316" />
        <StatCard title="Hóa đơn hôm nay" value={stats.billsToday} accentColor="#a855f7" />
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 18 }}>
        <StatCard title="Doanh thu hôm nay" value={money(stats.revenueToday)} accentColor="#0ea5e9" />
        <StatCard title="Tạm tính" value={money(stats.subtotalToday)} accentColor="#22c55e" />
        <StatCard title="Giảm giá" value={money(stats.discountToday)} accentColor="#ef4444" />
        <StatCard title="Thuế" value={money(stats.taxToday)} accentColor="#f59e0b" />
      </div>

      <TopItemsPanel items={stats.topItemsToday} />

      <RevenueChatBox stats={stats} />
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
          fontSize: 28,
          fontWeight: 800,
          color: accentColor || "#0f172a",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TopItemsPanel({ items }) {
  return (
    <div
      style={{
        marginTop: 18,
        background: "white",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: 16,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
        Top sản phẩm/dịch vụ hôm nay (theo doanh thu)
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
        Dựa trên InvoiceItem.lineTotal
      </div>

      <div style={{ marginTop: 12 }}>
        {!items || items.length === 0 ? (
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Chưa có dữ liệu top items hôm nay.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 13, color: "#334155" }}>
                <th style={{ padding: "8px 6px", borderBottom: "1px solid #e2e8f0" }}>#</th>
                <th style={{ padding: "8px 6px", borderBottom: "1px solid #e2e8f0" }}>Tên</th>
                <th style={{ padding: "8px 6px", borderBottom: "1px solid #e2e8f0" }}>Số lượng</th>
                <th style={{ padding: "8px 6px", borderBottom: "1px solid #e2e8f0" }}>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ fontSize: 13, color: "#0f172a" }}>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{idx + 1}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{it.name}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{it.quantity}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{money(it.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Banner() {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        padding: 20,
        marginBottom: 18,
        background: "linear-gradient(90deg,#0ea5e9 0%,#6366f1 100%)",
        color: "white",
        boxShadow: "0 6px 18px rgba(99,102,241,0.12)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Xin chào, quản trị viên!</div>
        <div style={{ fontSize: 13, opacity: 0.95, marginTop: 6 }}>
          Tổng quan hệ thống và số liệu nhanh về hoạt động hôm nay.
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, opacity: 0.95 }}>Phiên bản hệ thống</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>v1.0</div>
      </div>
    </div>
  );
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + " đ";
}
