package com.dinhquangha.backend.repository;

import com.dinhquangha.backend.model.TableSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TableSessionRepository extends JpaRepository<TableSession, Long> {
    Optional<TableSession> findByTableIdAndEndTimeIsNull(Long tableId);
}
