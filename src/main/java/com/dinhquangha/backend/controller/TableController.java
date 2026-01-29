package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.dto.TableWithSessionDTO;
import com.dinhquangha.backend.model.BilliardTable;
import com.dinhquangha.backend.model.TableSession;
import com.dinhquangha.backend.repository.BilliardTableRepository;
import com.dinhquangha.backend.repository.TableSessionRepository;
import com.dinhquangha.backend.repository.InvoiceRepository;
import com.dinhquangha.backend.service.InvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://127.0.0.1:3000"},
        allowCredentials = "true"
)
public class TableController {

    private final BilliardTableRepository tableRepository;
    private final TableSessionRepository sessionRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;

    public TableController(BilliardTableRepository tableRepository,
                           TableSessionRepository sessionRepository,
                           InvoiceRepository invoiceRepository,
                           InvoiceService invoiceService) {
        this.tableRepository = tableRepository;
        this.sessionRepository = sessionRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceService = invoiceService;
    }

    // ✅ trả list DTO có currentSession
    @GetMapping
    public List<TableWithSessionDTO> list() {
        List<BilliardTable> tables = tableRepository.findAll();
        return tables.stream().map(t -> {
            TableSession active = sessionRepository.findFirstByTableIdAndEndTimeIsNull(t.getId()).orElse(null);
            return new TableWithSessionDTO(t, active);
        }).toList();
    }

    // ✅ 1 bàn + session active (hoặc gần nhất)
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable long id) {
        return tableRepository.findById(id)
                .map(table -> {
                    TableSession session = sessionRepository.findFirstByTableIdAndEndTimeIsNull(id).orElse(null);
                    if (session == null) {
                        session = sessionRepository.findTopByTableIdAndEndTimeIsNotNullOrderByEndTimeDesc(id).orElse(null);
                        // Nếu session đã được tạo hoá đơn thì không hiển thị làm currentSession
                        if (session != null && session.getId() != null) {
                            boolean billed = invoiceRepository.existsBySession_Id(session.getId());
                            if (billed) session = null;
                        }
                    }
                    return ResponseEntity.ok(new TableWithSessionDTO(table, session));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BilliardTable> create(@RequestBody BilliardTable table) {
        BilliardTable saved = Objects.requireNonNull(tableRepository.save(table), "Saved table must not be null");
        URI location = Objects.requireNonNull(URI.create("/api/tables/" + saved.getId()));
        return ResponseEntity.created(location).body(saved);
    }

    // ✅ BẮT ĐẦU (gọi InvoiceService để tạo TableSession + set OCCUPIED)
    @PostMapping("/{id}/start-session")
    public ResponseEntity<?> startSession(@PathVariable long id) {
        try {
            TableSession session = invoiceService.startSession(id);
            BilliardTable table = session.getTable();
            return ResponseEntity.ok(new TableWithSessionDTO(table, session));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // ✅ KẾT THÚC (gọi InvoiceService để set endTime + tính total + set AVAILABLE)
    @PostMapping("/{id}/end-session")
    public ResponseEntity<?> endSession(@PathVariable long id) {
        try {
            TableSession session = invoiceService.endSession(id);
            return ResponseEntity.ok(session);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BilliardTable> update(@PathVariable long id,
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
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return tableRepository.findById(id)
                .map(t -> {
                    tableRepository.delete(t);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
