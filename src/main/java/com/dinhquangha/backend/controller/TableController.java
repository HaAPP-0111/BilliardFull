package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.model.BilliardTable;
import com.dinhquangha.backend.model.TableSession;
import com.dinhquangha.backend.repository.BilliardTableRepository;
import com.dinhquangha.backend.repository.TableSessionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final BilliardTableRepository tableRepository;
    private final TableSessionRepository sessionRepository;

    public TableController(BilliardTableRepository tableRepository, TableSessionRepository sessionRepository) {
        this.tableRepository = tableRepository;
        this.sessionRepository = sessionRepository;
    }

    @GetMapping
    public List<BilliardTable> list() {
        return tableRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable long id) {
        return tableRepository.findById(id)
                .map(table -> {
                    // Tìm session hiện tại (chưa kết thúc hoặc mới kết thúc gần nhất)
                    TableSession session = sessionRepository.findByTableIdAndEndTimeIsNull(id).orElse(null);
                    
                    // Nếu không có session đang active, tìm session gần nhất đã kết thúc
                    if (session == null) {
                        session = sessionRepository.findAll().stream()
                                .filter(s -> s.getTable().getId().equals(id) && s.getEndTime() != null)
                                .max((s1, s2) -> s1.getEndTime().compareTo(s2.getEndTime()))
                                .orElse(null);
                    }
                    
                    return ResponseEntity.ok(new com.dinhquangha.backend.dto.TableWithSessionDTO(table, session));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BilliardTable> create(@RequestBody BilliardTable table) {
        BilliardTable saved = Objects.requireNonNull(
                tableRepository.save(table),
                "Saved table must not be null"
        );

        URI location = Objects.requireNonNull(
                URI.create("/api/tables/" + saved.getId())
        );

        return ResponseEntity.created(location).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BilliardTable> update(@PathVariable long id,      // primitive long
                                                @RequestBody BilliardTable payload) {
        return tableRepository.findById(id)
                .map(existing -> {
                    existing.setName(payload.getName());
                    existing.setPricePerHour(payload.getPricePerHour());
                    existing.setDescription(payload.getDescription());
                    existing.setReservationTime(payload.getReservationTime());
                    existing.setStatus(payload.getStatus());

                    BilliardTable updated = Objects.requireNonNull(
                            tableRepository.save(existing),
                            "Updated table must not be null"
                    );

                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable long id) {    // primitive long
        return tableRepository.findById(id)
                .map(t -> {
                    tableRepository.delete(t);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
