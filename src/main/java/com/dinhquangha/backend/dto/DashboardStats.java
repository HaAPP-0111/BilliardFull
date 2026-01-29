package com.dinhquangha.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardStats {

    private long tableCount;
    private long productCount;
    private long employeeCount;

    private long todayInvoiceCount;

    // ✅ tiền
    private BigDecimal todayRevenue;
    private BigDecimal todaySubtotal;
    private BigDecimal todayDiscount;
    private BigDecimal todayTax;

    // ✅ top items hôm nay
    private List<TopItem> topItemsToday;

    public DashboardStats() {}

    public DashboardStats(long tableCount,
                          long productCount,
                          long employeeCount,
                          long todayInvoiceCount,
                          BigDecimal todayRevenue,
                          BigDecimal todaySubtotal,
                          BigDecimal todayDiscount,
                          BigDecimal todayTax,
                          List<TopItem> topItemsToday) {
        this.tableCount = tableCount;
        this.productCount = productCount;
        this.employeeCount = employeeCount;
        this.todayInvoiceCount = todayInvoiceCount;
        this.todayRevenue = todayRevenue;
        this.todaySubtotal = todaySubtotal;
        this.todayDiscount = todayDiscount;
        this.todayTax = todayTax;
        this.topItemsToday = topItemsToday;
    }

    public long getTableCount() { return tableCount; }
    public void setTableCount(long tableCount) { this.tableCount = tableCount; }

    public long getProductCount() { return productCount; }
    public void setProductCount(long productCount) { this.productCount = productCount; }

    public long getEmployeeCount() { return employeeCount; }
    public void setEmployeeCount(long employeeCount) { this.employeeCount = employeeCount; }

    public long getTodayInvoiceCount() { return todayInvoiceCount; }
    public void setTodayInvoiceCount(long todayInvoiceCount) { this.todayInvoiceCount = todayInvoiceCount; }

    public BigDecimal getTodayRevenue() { return todayRevenue; }
    public void setTodayRevenue(BigDecimal todayRevenue) { this.todayRevenue = todayRevenue; }

    public BigDecimal getTodaySubtotal() { return todaySubtotal; }
    public void setTodaySubtotal(BigDecimal todaySubtotal) { this.todaySubtotal = todaySubtotal; }

    public BigDecimal getTodayDiscount() { return todayDiscount; }
    public void setTodayDiscount(BigDecimal todayDiscount) { this.todayDiscount = todayDiscount; }

    public BigDecimal getTodayTax() { return todayTax; }
    public void setTodayTax(BigDecimal todayTax) { this.todayTax = todayTax; }

    public List<TopItem> getTopItemsToday() { return topItemsToday; }
    public void setTopItemsToday(List<TopItem> topItemsToday) { this.topItemsToday = topItemsToday; }

    public static class TopItem {
        private String name;
        private long quantity;
        private BigDecimal revenue;

        public TopItem() {}

        public TopItem(String name, long quantity, BigDecimal revenue) {
            this.name = name;
            this.quantity = quantity;
            this.revenue = revenue;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public long getQuantity() { return quantity; }
        public void setQuantity(long quantity) { this.quantity = quantity; }

        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
    }
}
