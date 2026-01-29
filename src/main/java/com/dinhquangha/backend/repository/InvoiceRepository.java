package com.dinhquangha.backend.repository;

import com.dinhquangha.backend.model.Invoice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("""
        select coalesce(sum(i.total), 0)
        from Invoice i
        where i.createdAt >= :start and i.createdAt < :end
    """)
    BigDecimal sumTotalBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
        select coalesce(sum(i.subtotal), 0)
        from Invoice i
        where i.createdAt >= :start and i.createdAt < :end
    """)
    BigDecimal sumSubtotalBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
        select coalesce(sum(i.discountAmount), 0)
        from Invoice i
        where i.createdAt >= :start and i.createdAt < :end
    """)
    BigDecimal sumDiscountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
        select coalesce(sum(i.taxAmount), 0)
        from Invoice i
        where i.createdAt >= :start and i.createdAt < :end
    """)
    BigDecimal sumTaxBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    interface TopItemRow {
        String getName();
        Long getQty();
        BigDecimal getRevenue();
    }

    @Query("""
        select
          coalesce(p.name, it.customName) as name,
          coalesce(sum(it.quantity), 0) as qty,
          coalesce(sum(it.lineTotal), 0) as revenue
        from Invoice i
        join i.items it
        left join it.product p
        where i.createdAt >= :start and i.createdAt < :end
        group by coalesce(p.name, it.customName)
        order by sum(it.lineTotal) desc
    """)
    List<TopItemRow> findTopItemsBetween(@Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end,
                                        Pageable pageable);

    // ✅ Dùng cho export PDF: load luôn items + product để tránh lỗi Lazy (500)
    @Query("""
        select distinct i
        from Invoice i
        left join fetch i.items it
        left join fetch it.product p
        where i.id = :id
    """)
    Optional<Invoice> findByIdWithItems(@Param("id") Long id);

    // Kiểm tra xem có hoá đơn nào đã liên kết tới session không
    boolean existsBySession_Id(Long sessionId);
}
