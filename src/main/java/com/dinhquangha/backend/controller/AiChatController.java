package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.dto.ChatRequest;
import com.dinhquangha.backend.dto.ChatResponse;
import com.dinhquangha.backend.service.DashboardStatsService;
import com.dinhquangha.backend.service.GeminiChatService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/ai")
public class AiChatController {

    private final GeminiChatService geminiChatService;
    private final DashboardStatsService dashboardStatsService;

    public AiChatController(GeminiChatService geminiChatService,
                            DashboardStatsService dashboardStatsService) {
        this.geminiChatService = geminiChatService;
        this.dashboardStatsService = dashboardStatsService;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest req) {
        System.out.println(">>> AI CHAT HIT: " + req.getMessage());
        var stats = dashboardStatsService.getTodayStats();
        String reply = geminiChatService.chat(req.getMessage(), stats);
        System.out.println(">>> AI CHAT DONE");
        return new ChatResponse(reply);
    }
}
