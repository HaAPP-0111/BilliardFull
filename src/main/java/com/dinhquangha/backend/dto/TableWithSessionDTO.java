package com.dinhquangha.backend.dto;

import com.dinhquangha.backend.model.BilliardTable;
import com.dinhquangha.backend.model.TableSession;

public class TableWithSessionDTO {
    private Long id;
    private String name;
    private BilliardTable.TableStatus status;
    private java.math.BigDecimal pricePerHour;
    private String description;
    private java.time.LocalDateTime reservationTime;
    private TableSession currentSession;

    public TableWithSessionDTO(BilliardTable table, TableSession session) {
        this.id = table.getId();
        this.name = table.getName();
        this.status = table.getStatus();
        this.pricePerHour = table.getPricePerHour();
        this.description = table.getDescription();
        this.reservationTime = table.getReservationTime();
        this.currentSession = session;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BilliardTable.TableStatus getStatus() {
        return status;
    }

    public void setStatus(BilliardTable.TableStatus status) {
        this.status = status;
    }

    public java.math.BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(java.math.BigDecimal pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public java.time.LocalDateTime getReservationTime() {
        return reservationTime;
    }

    public void setReservationTime(java.time.LocalDateTime reservationTime) {
        this.reservationTime = reservationTime;
    }

    public TableSession getCurrentSession() {
        return currentSession;
    }

    public void setCurrentSession(TableSession currentSession) {
        this.currentSession = currentSession;
    }
}
