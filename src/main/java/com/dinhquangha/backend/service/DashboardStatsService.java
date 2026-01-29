package com.dinhquangha.backend.service;

import com.dinhquangha.backend.dto.DashboardStats;
import com.dinhquangha.backend.repository.BilliardTableRepository;
import com.dinhquangha.backend.repository.EmployeeRepository;
import com.dinhquangha.backend.repository.InvoiceRepository;
import com.dinhquangha.backend.repository.ProductRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardStatsService {

    private final BilliardTableRepository tableRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;
    private final InvoiceRepository invoiceRepository;

    public DashboardStatsService(BilliardTableRepository tableRepository,
                                 ProductRepository productRepository,
                                 EmployeeRepository employeeRepository,
                                 InvoiceRepository invoiceRepository) {
        this.tableRepository = tableRepository;
        this.productRepository = productRepository;
        this.employeeRepository = employeeRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public DashboardStats getTodayStats() {
        long tableCount = tableRepository.count();
        long productCount = productRepository.count();
        long employeeCount = employeeRepository.count();

        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        long todayInvoiceCount = invoiceRepository.countByCreatedAtBetween(start, end);

        BigDecimal todayRevenue = invoiceRepository.sumTotalBetween(start, end);
        BigDecimal todaySubtotal = invoiceRepository.sumSubtotalBetween(start, end);
        BigDecimal todayDiscount = invoiceRepository.sumDiscountBetween(start, end);
        BigDecimal todayTax = invoiceRepository.sumTaxBetween(start, end);

        var rows = invoiceRepository.findTopItemsBetween(start, end, PageRequest.of(0, 5));

        List<DashboardStats.TopItem> topItems = rows.stream()
                .map(r -> new DashboardStats.TopItem(
                        r.getName(),
                        r.getQty() == null ? 0 : r.getQty(),
                        r.getRevenue() == null ? BigDecimal.ZERO : r.getRevenue()
                ))
                .toList();

        return new DashboardStats(
                tableCount,
                productCount,
                employeeCount,
                todayInvoiceCount,
                todayRevenue,
                todaySubtotal,
                todayDiscount,
                todayTax,
                topItems
        );
    }
}
