package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.model.Invoice;
import com.dinhquangha.backend.repository.InvoiceRepository;
import com.dinhquangha.backend.service.InvoicePdfService;
import com.dinhquangha.backend.repository.TableSessionRepository;
import com.dinhquangha.backend.service.InvoiceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final InvoicePdfService invoicePdfService;
    private final InvoiceService invoiceService;
    private final TableSessionRepository sessionRepository;

    public InvoiceController(InvoiceRepository invoiceRepository, InvoicePdfService invoicePdfService, InvoiceService invoiceService, TableSessionRepository sessionRepository) {
        this.invoiceRepository = invoiceRepository;
        this.invoicePdfService = invoicePdfService;
        this.invoiceService = invoiceService;
        this.sessionRepository = sessionRepository;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Invoice> createInvoice(@RequestBody CreateInvoiceRequest request) {
        List<Map<String, Object>> itemsList = request.items().stream().map(i -> {
            Map<String, Object> m = new HashMap<>();
            m.put("productId", i.productId());
            m.put("productName", i.productName());
            m.put("quantity", i.quantity());
            m.put("price", i.price());
            return m;
        }).toList();

        Invoice saved = invoiceService.createInvoiceWithItemsAndDiscount(
                request.tableId(),
                request.customerName(),
                itemsList,
                request.discountPercent(),
                request.taxPercent()
        );

        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public Page<Invoice> listInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return invoiceRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceRepository.findByIdWithItems(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
        return ResponseEntity.ok(invoice);
    }

    @GetMapping(value = "/{id}/export-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean deleteAfterExport
    ) {
        Invoice invoice = invoiceRepository.findByIdWithItems(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));

        byte[] pdf = invoicePdfService.generateInvoicePdf(invoice);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename("invoice-" + id + ".pdf")
                        .build()
        );

        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .headers(headers)
                .body(pdf);

        if (deleteAfterExport) {
            // Xoá hoá đơn sau khi đã tạo PDF thành công
            invoiceRepository.delete(invoice);
        }

        return response;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceRepository.findByIdWithItems(id).orElse(null);
        if (invoice == null) return ResponseEntity.notFound().build();

        // Nếu hoá đơn liên kết tới session bàn, xoá luôn session đó để không hiện lại sau F5
        if (invoice.getSession() != null && invoice.getSession().getId() != null) {
            try {
                sessionRepository.deleteById(invoice.getSession().getId());
            } catch (Exception ex) {
                // ignore deletion errors, proceed to delete invoice
            }
        }

        invoiceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateInvoiceRequest(
            Long tableId,
            String customerName,
            List<Item> items,
            BigDecimal discountPercent,
            BigDecimal taxPercent
    ) {
        public record Item(Long productId, String productName, Integer quantity, BigDecimal price) {}
    }
}
