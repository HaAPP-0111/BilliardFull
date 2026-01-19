package com.dinhquangha.backend.repository;

import com.dinhquangha.backend.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByTableIdAndReservationTimeBetween(Long tableId, LocalDateTime start, LocalDateTime end);
}
