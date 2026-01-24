package com.dinhquangha.backend.repository;

import com.dinhquangha.backend.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // ✅ Dùng cho export PDF: load luôn items + product để tránh lỗi Lazy (500)
    @Query("""
        select distinct i
        from Invoice i
        left join fetch i.items it
        left join fetch it.product p
        where i.id = :id
    """)
    Optional<Invoice> findByIdWithItems(@Param("id") Long id);
}
