package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.model.Reservation;
import com.dinhquangha.backend.model.BilliardTable;
import com.dinhquangha.backend.repository.ReservationRepository;
import com.dinhquangha.backend.repository.BilliardTableRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final BilliardTableRepository tableRepository;

    public ReservationController(ReservationRepository reservationRepository, BilliardTableRepository tableRepository) {
        this.reservationRepository = reservationRepository;
        this.tableRepository = tableRepository;
    }

    // Đặt bàn
    @PostMapping
    public ResponseEntity<Reservation> create(@RequestBody Reservation reservation) {
        // Validate table exists
        BilliardTable table = tableRepository.findById(reservation.getTable().getId())
                .orElseThrow(() -> new IllegalArgumentException("Bàn không tồn tại"));
        
        reservation.setTable(table);
        Reservation saved = Objects.requireNonNull(
                reservationRepository.save(reservation),
                "Saved reservation must not be null"
        );

        URI location = Objects.requireNonNull(
                URI.create("/api/reservations/" + saved.getId())
        );

        return ResponseEntity.created(location).body(saved);
    }

    // Lấy tất cả reservation
    @GetMapping
    public List<Reservation> list() {
        return reservationRepository.findAll();
    }

    // Lấy chi tiết reservation
    @GetMapping("/{id}")
    public ResponseEntity<Reservation> get(@PathVariable Long id) {
        return reservationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Hủy reservation
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        return reservationRepository.findById(id)
                .map(r -> {
                    r.setStatus(Reservation.ReservationStatus.CANCELLED);
                    reservationRepository.save(r);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
