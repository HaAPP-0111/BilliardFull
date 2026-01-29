package com.dinhquangha.backend.repository;

import com.dinhquangha.backend.model.TableSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TableSessionRepository extends JpaRepository<TableSession, Long> {

    // Truy vấn dẫn xuất: lấy session đang hoạt động (nếu có) - chỉ lấy 1 bản ghi (first/top)
    Optional<TableSession> findFirstByTableIdAndEndTimeIsNull(Long tableId);

    // Lấy session đã kết thúc gần nhất (top 1 theo endTime desc)
    Optional<TableSession> findTopByTableIdAndEndTimeIsNotNullOrderByEndTimeDesc(Long tableId);
}
