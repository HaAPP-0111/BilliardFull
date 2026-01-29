import React, { useMemo, useState } from "react";
import api from "../api/axios";

export default function RevenueChatBox({ stats }) {
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState([
    {
      role: "assistant",
      text:
        "Bạn có thể hỏi mình về doanh thu hôm nay (tổng tiền, giảm giá, thuế, top sản phẩm).",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const quickQuestions = useMemo(
    () => [
      "Tóm tắt doanh thu hôm nay theo văn phong báo cáo.",
      "Doanh thu hôm nay là bao nhiêu? Nêu 3 nhận xét chính.",
      "Giảm giá và thuế hôm nay chiếm tỷ trọng thế nào?",
      "Top 5 sản phẩm/dịch vụ theo doanh thu hôm nay là gì?",
      "Gợi ý 3 cách tăng doanh thu dựa trên số liệu hôm nay.",
    ],
    []
  );

  const send = async (text) => {
    const content = (text ?? message).trim();
    if (!content || loading) return;

    setLogs((prev) => [...prev, { role: "user", text: content }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/admin/ai/chat", { message: content });
      const reply = res.data?.reply ?? "";
      setLogs((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      setLogs((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "Lỗi gọi AI. Kiểm tra backend đang chạy, JWT token, và GOOGLE_API_KEY.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 20,
        background: "white",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            Chat thống kê doanh thu
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Hỏi đáp nhanh dựa trên số liệu dashboard hôm nay.
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", textAlign: "right" }}>
          <div>
            Doanh thu:{" "}
            <b>{money(stats?.revenueToday ?? 0)}</b>
          </div>
          <div>
            Hóa đơn: <b>{stats?.billsToday ?? 0}</b>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 12,
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          height: 260,
          overflow: "auto",
          background: "#f8fafc",
          borderRadius: 10,
          padding: 12,
          border: "1px solid #e2e8f0",
        }}
      >
        {logs.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 12,
                color: m.role === "user" ? "#0f172a" : "#334155",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {m.role === "user" ? "Bạn" : "AI"}
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#0f172a" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ fontSize: 13, color: "#64748b" }}>Đang trả lời...</div>
        )}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập câu hỏi... (vd: Doanh thu hôm nay bao nhiêu?)"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            outline: "none",
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#06b6d4",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("vi-VN") + " đ";
}
