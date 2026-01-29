package com.dinhquangha.backend.service;

import com.dinhquangha.backend.dto.DashboardStats;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiChatService {

    private final Client client;

    

    public GeminiChatService(@Value("${gemini-key:}") String geminiKey) {
        if (geminiKey == null || geminiKey.isBlank()) {
            throw new IllegalStateException("Missing gemini-key in application.properties");
        }

        String key = geminiKey.trim(); // tránh dính space/newline/quote

        System.out.println("[GEMINI] key loaded: len=" + key.length()
                + ", last4=" + key.substring(Math.max(0, key.length() - 4)));

        this.client = Client.builder()
                .apiKey(key)
                .build();
    }

    public String chat(String userMessage, DashboardStats stats) {
        try {
            String prompt = buildPrompt(userMessage, stats);

            GenerateContentConfig cfg = GenerateContentConfig.builder()
                    .candidateCount(1)
                    .maxOutputTokens(900)
                    .build();

            GenerateContentResponse res = client.models.generateContent(
                    "gemini-2.5-flash-lite",
                    prompt,
                    cfg
            );

            String text = res.text();
            if (text == null || text.isBlank()) {
                return "Mình chưa tạo được câu trả lời. Bạn thử lại nhé.";
            }
            return text;

        } catch (Exception e) {
            e.printStackTrace();

            String msg = e.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = e.getClass().getSimpleName();
            }
            return "AI ERROR: " + msg;
        }
    }

    private String buildPrompt(String userMessage, DashboardStats s) {
        return """
Bạn là trợ lý phân tích doanh thu cho hệ thống quản lý quán bida.
CHỈ dựa trên số liệu có trong SỐ LIỆU HÔM NAY, không bịa thêm số.

Cách trả lời:
- Tiếng Việt, giọng văn báo cáo cho giảng viên.
- Có tiêu đề ngắn.
- Bullet points rõ ràng.
- Có 2-4 nhận xét/insight nếu phù hợp.
- Nếu câu hỏi vượt quá dữ liệu hiện có, nói rõ thiếu dữ liệu gì.

SỐ LIỆU HÔM NAY:
- Số bàn: %d
- Số sản phẩm: %d
- Số admin/nhân viên: %d
- Số hóa đơn hôm nay: %d
- Doanh thu (total): %s
- Tạm tính (subtotal): %s
- Giảm giá: %s
- Thuế: %s
- Top sản phẩm/dịch vụ theo doanh thu:
%s

CÂU HỎI:
%s
""".formatted(
                s.getTableCount(),
                s.getProductCount(),
                s.getEmployeeCount(),
                s.getTodayInvoiceCount(),
                String.valueOf(s.getTodayRevenue()),
                String.valueOf(s.getTodaySubtotal()),
                String.valueOf(s.getTodayDiscount()),
                String.valueOf(s.getTodayTax()),
                formatTopItems(s),
                userMessage
        );
    }

    private String formatTopItems(DashboardStats s) {
        if (s.getTopItemsToday() == null || s.getTopItemsToday().isEmpty()) {
            return "- (chưa có dữ liệu top items hôm nay)";
        }
        StringBuilder sb = new StringBuilder();
        int idx = 1;
        for (DashboardStats.TopItem it : s.getTopItemsToday()) {
            sb.append("- ").append(idx++).append(". ")
              .append(it.getName())
              .append(" | SL: ").append(it.getQuantity())
              .append(" | Doanh thu: ").append(it.getRevenue())
              .append("\n");
        }
        return sb.toString();
    }
}
