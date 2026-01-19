package com.dinhquangha.backend.repository;

import com.dinhquangha.backend.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
