package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.dto.DashboardStats;
import com.dinhquangha.backend.repository.BilliardTableRepository;
import com.dinhquangha.backend.repository.EmployeeRepository;
import com.dinhquangha.backend.repository.InvoiceRepository;
import com.dinhquangha.backend.repository.ProductRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

    private final BilliardTableRepository tableRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;
    private final InvoiceRepository invoiceRepository;

    public DashboardController(
            BilliardTableRepository tableRepository,
            ProductRepository productRepository,
            EmployeeRepository employeeRepository,
            InvoiceRepository invoiceRepository
    ) {
        this.tableRepository = tableRepository;
        this.productRepository = productRepository;
        this.employeeRepository = employeeRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping
    public DashboardStats getStats() {

        long tableCount = tableRepository.count();
        long productCount = productRepository.count();
        long employeeCount = employeeRepository.count();

        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        long todayInvoiceCount = invoiceRepository.countByCreatedAtBetween(start, end);

        return new DashboardStats(
                tableCount,
                productCount,
                employeeCount,
                todayInvoiceCount
        );
    }
}
