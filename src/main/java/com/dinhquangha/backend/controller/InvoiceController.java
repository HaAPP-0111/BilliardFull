package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.model.Invoice;
import com.dinhquangha.backend.model.TableSession;
import com.dinhquangha.backend.service.InvoicePdfService;
import com.dinhquangha.backend.service.InvoiceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(
    origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    },
    allowCredentials = "true"
)
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;

    public InvoiceController(InvoiceService invoiceService, InvoicePdfService invoicePdfService) {
        this.invoiceService = invoiceService;
        this.invoicePdfService = invoicePdfService;
    }

    @PostMapping("/sessions/{tableId}/start")
    public ResponseEntity<TableSession> startSession(@PathVariable Long tableId) {
        return ResponseEntity.ok(invoiceService.startSession(tableId));
    }

    @GetMapping("/sessions/{tableId}")
    public ResponseEntity<TableSession> getActiveSession(@PathVariable Long tableId) {
        return invoiceService.findActiveSessionByTableId(tableId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/sessions/{tableId}/end")
    public ResponseEntity<TableSession> endSession(@PathVariable Long tableId) {
        return ResponseEntity.ok(invoiceService.endSession(tableId));
    }

    @PostMapping("/sessions/{sessionId}/create-invoice")
    public ResponseEntity<Invoice> createInvoice(@PathVariable Long sessionId) {
        return ResponseEntity.ok(invoiceService.createInvoiceForSession(sessionId));
    }

    @GetMapping
    public Page<Invoice> list(@PageableDefault(size = 10) Pageable pageable) {
        return invoiceService.listInvoices(pageable);
    }

    @PostMapping
    public ResponseEntity<Invoice> createInvoiceWithItems(@RequestBody Map<String, Object> body) {
        try {
            Long tableId = Long.valueOf(body.get("tableId").toString());
            String customerName = (String) body.get("customerName");
            java.util.List<?> itemsList = (java.util.List<?>) body.get("items");

            BigDecimal discountPercent = body.get("discountPercent") != null
                    ? new BigDecimal(body.get("discountPercent").toString())
                    : BigDecimal.ZERO;

            BigDecimal taxPercent = body.get("taxPercent") != null
                    ? new BigDecimal(body.get("taxPercent").toString())
                    : BigDecimal.ZERO;

            Invoice invoice = invoiceService.createInvoiceWithItemsAndDiscount(
                    tableId, customerName, itemsList, discountPercent, taxPercent
            );
            return ResponseEntity.ok(invoice);

        } catch (AccessDeniedException ade) {
            throw ade;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo hoá đơn: " + e.getMessage(), e);
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<Invoice> checkout(@RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        int qty = body.get("quantity") == null ? 1 : Integer.parseInt(body.get("quantity").toString());

        Invoice invoice = invoiceService.createInvoiceWithProduct(productId, qty);
        return ResponseEntity.ok(invoice);
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable Long invoiceId) {
        return invoiceService.findInvoiceById(invoiceId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{invoiceId}/items")
    public ResponseEntity<Invoice> addItem(@PathVariable Long invoiceId,
                                           @RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        int qty = body.get("quantity") == null ? 1 : Integer.parseInt(body.get("quantity").toString());

        return ResponseEntity.ok(invoiceService.addProductToInvoice(invoiceId, productId, qty));
    }

    @DeleteMapping("/{invoiceId}/items/{itemId}")
    public ResponseEntity<Invoice> removeItem(@PathVariable Long invoiceId,
                                              @PathVariable Long itemId) {
        return ResponseEntity.ok(invoiceService.removeItemFromInvoice(invoiceId, itemId));
    }

    @PatchMapping("/{invoiceId}/items/{itemId}")
    public ResponseEntity<Invoice> updateItemQuantity(@PathVariable Long invoiceId,
                                                      @PathVariable Long itemId,
                                                      @RequestBody Map<String, Object> body) {
        int qty = Integer.parseInt(body.get("quantity").toString());
        return ResponseEntity.ok(invoiceService.updateItemQuantity(invoiceId, itemId, qty));
    }

    @PostMapping("/{invoiceId}/discount")
    public ResponseEntity<Invoice> applyDiscount(@PathVariable Long invoiceId,
                                                 @RequestBody Map<String, Object> body) {
        BigDecimal percent = new BigDecimal(body.get("percent").toString());
        return ResponseEntity.ok(invoiceService.applyDiscountPercent(invoiceId, percent));
    }

    @PostMapping("/{invoiceId}/tax")
    public ResponseEntity<Invoice> applyTax(@PathVariable Long invoiceId,
                                            @RequestBody Map<String, Object> body) {
        BigDecimal percent = new BigDecimal(body.get("percent").toString());
        return ResponseEntity.ok(invoiceService.applyTaxPercent(invoiceId, percent));
    }

    @DeleteMapping("/{invoiceId}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long invoiceId) {
        invoiceService.deleteInvoice(invoiceId);
        return ResponseEntity.noContent().build();
    }

    // ✅ EXPORT PDF
    @GetMapping(value = "/{invoiceId}/export-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportInvoicePdf(@PathVariable Long invoiceId) {
        return invoiceService.findInvoiceById(invoiceId)
                .map(invoice -> {
                    byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice);
                    return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_PDF)
                            .header(HttpHeaders.CONTENT_DISPOSITION,
                                    "attachment; filename=\"HoaDon_" + invoiceId + ".pdf\"")
                            .body(pdfBytes);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
