package com.dinhquangha.backend.repository;

import com.dinhquangha.backend.model.BilliardTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BilliardTableRepository extends JpaRepository<BilliardTable, Long> {
}
