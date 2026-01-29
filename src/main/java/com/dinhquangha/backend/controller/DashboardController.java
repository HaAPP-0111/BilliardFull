package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.dto.DashboardStats;
import com.dinhquangha.backend.service.DashboardStatsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(
    origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    },
    allowCredentials = "true"
)
public class DashboardController {

    private final DashboardStatsService dashboardStatsService;

    public DashboardController(DashboardStatsService dashboardStatsService) {
        this.dashboardStatsService = dashboardStatsService;
    }

    @GetMapping
    public DashboardStats getStats() {
        return dashboardStatsService.getTodayStats();
    }
}
