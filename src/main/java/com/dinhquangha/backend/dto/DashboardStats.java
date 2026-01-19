package com.dinhquangha.backend.dto;

public class DashboardStats {

    private long tableCount;
    private long productCount;
    private long employeeCount;
    private long todayInvoiceCount;

    public DashboardStats(long tableCount,
                          long productCount,
                          long employeeCount,
                          long todayInvoiceCount) {
        this.tableCount = tableCount;
        this.productCount = productCount;
        this.employeeCount = employeeCount;
        this.todayInvoiceCount = todayInvoiceCount;
    }

    public long getTableCount() {
        return tableCount;
    }

    public void setTableCount(long tableCount) {
        this.tableCount = tableCount;
    }

    public long getProductCount() {
        return productCount;
    }

    public void setProductCount(long productCount) {
        this.productCount = productCount;
    }

    public long getEmployeeCount() {
        return employeeCount;
    }

    public void setEmployeeCount(long employeeCount) {
        this.employeeCount = employeeCount;
    }

    public long getTodayInvoiceCount() {
        return todayInvoiceCount;
    }

    public void setTodayInvoiceCount(long todayInvoiceCount) {
        this.todayInvoiceCount = todayInvoiceCount;
    }
}
