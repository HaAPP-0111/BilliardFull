package com.dinhquangha.backend.service;

import com.dinhquangha.backend.model.*;
import com.dinhquangha.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
public class InvoiceService {

    private final TableSessionRepository sessionRepository;
    private final BilliardTableRepository tableRepository;
    private final ProductRepository productRepository;
    private final InvoiceRepository invoiceRepository;

    public InvoiceService(TableSessionRepository sessionRepository,
                          BilliardTableRepository tableRepository,
                          ProductRepository productRepository,
                          InvoiceRepository invoiceRepository) {
        this.sessionRepository = sessionRepository;
        this.tableRepository = tableRepository;
        this.productRepository = productRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public TableSession startSession(Long tableId) {
        Objects.requireNonNull(tableId, "tableId must not be null");

        BilliardTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));

        // Nếu có session đang chạy thì không tạo mới
        if (sessionRepository.findFirstByTableIdAndEndTimeIsNull(tableId).isPresent()) {
            throw new IllegalArgumentException("Active session already exists for table");
        }

        TableSession session = new TableSession();
        session.setTable(table);
        session.setStartTime(LocalDateTime.now());
        session.setEndTime(null);
        session.setTotal(BigDecimal.ZERO);

        table.setStatus(BilliardTable.TableStatus.OCCUPIED);
        table.setReservationTime(null);
        tableRepository.save(table);

        return sessionRepository.save(session);
    }

    public TableSession endSession(Long tableId) {
        Objects.requireNonNull(tableId, "tableId must not be null");

        TableSession session = sessionRepository.findFirstByTableIdAndEndTimeIsNull(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Active session not found for table"));

        LocalDateTime end = LocalDateTime.now();
        session.setEndTime(end);

        long minutesLong = Duration.between(session.getStartTime(), end).toMinutes();
        if (minutesLong <= 0) minutesLong = 1;

        BigDecimal minutes = BigDecimal.valueOf(minutesLong);

        BigDecimal pricePerHour = Objects.requireNonNull(
                session.getTable().getPricePerHour(),
                "Table pricePerHour must not be null"
        );

        // price per hour -> per minute
        BigDecimal pricePerMinute = pricePerHour.divide(BigDecimal.valueOf(60), 6, RoundingMode.HALF_UP);

        // ✅ Làm tròn lên để tránh hụt tiền
        BigDecimal amount = pricePerMinute.multiply(minutes)
                .setScale(0, RoundingMode.CEILING);

        session.setTotal(amount);

        session.getTable().setStatus(BilliardTable.TableStatus.AVAILABLE);
        tableRepository.save(session.getTable());

        return sessionRepository.save(session);
    }

    public Invoice createInvoiceForSession(Long sessionId) {
        Objects.requireNonNull(sessionId, "sessionId must not be null");

        TableSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        BigDecimal baseTotal = session.getTotal() == null ? BigDecimal.ZERO : session.getTotal();

        Invoice invoice = new Invoice();
        invoice.setSession(session);
        invoice.setSubtotal(baseTotal);
        invoice.setTotal(baseTotal);

        return invoiceRepository.save(invoice);
    }

    public Optional<Invoice> findInvoiceById(Long invoiceId) {
        Objects.requireNonNull(invoiceId, "invoiceId must not be null");
        return invoiceRepository.findById(invoiceId);
    }

    public Invoice addProductToInvoice(Long invoiceId, Long productId, int quantity) {
        Objects.requireNonNull(invoiceId, "invoiceId must not be null");
        Objects.requireNonNull(productId, "productId must not be null");

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        InvoiceItem item = new InvoiceItem();
        item.setProduct(product);
        item.setCustomName(product.getName());
        item.setQuantity(quantity);
        item.setUnitPrice(product.getPrice());

        BigDecimal unitPrice = product.getPrice() == null ? BigDecimal.ZERO : product.getPrice();
        item.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(quantity)));

        invoice.getItems().add(item);

        recalcInvoiceTotals(invoice);
        return invoiceRepository.save(invoice);
    }

    public Invoice removeItemFromInvoice(Long invoiceId, Long itemId) {
        Objects.requireNonNull(invoiceId, "invoiceId must not be null");
        Objects.requireNonNull(itemId, "itemId must not be null");

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        boolean removed = invoice.getItems().removeIf(i -> Objects.equals(i.getId(), itemId));
        if (!removed) throw new IllegalArgumentException("Item not found in invoice");

        recalcInvoiceTotals(invoice);
        return invoiceRepository.save(invoice);
    }

    private void recalcInvoiceTotals(Invoice invoice) {
        Objects.requireNonNull(invoice, "invoice must not be null");

        BigDecimal subtotal = invoice.getItems().stream()
                .map(InvoiceItem::getLineTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        invoice.setSubtotal(subtotal);

        BigDecimal discountPercent = invoice.getDiscountPercent() == null ? BigDecimal.ZERO : invoice.getDiscountPercent();
        BigDecimal discountAmount = subtotal.multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        invoice.setDiscountAmount(discountAmount);

        BigDecimal taxable = subtotal.subtract(discountAmount);

        BigDecimal taxPercent = invoice.getTaxPercent() == null ? BigDecimal.ZERO : invoice.getTaxPercent();
        BigDecimal taxAmount = taxable.multiply(taxPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        invoice.setTaxAmount(taxAmount);

        BigDecimal total = taxable.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        invoice.setTotal(total);
    }

    public Invoice updateItemQuantity(Long invoiceId, Long itemId, int quantity) {
        Objects.requireNonNull(invoiceId, "invoiceId must not be null");
        Objects.requireNonNull(itemId, "itemId must not be null");

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        InvoiceItem target = invoice.getItems().stream()
                .filter(i -> Objects.equals(i.getId(), itemId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Item not found in invoice"));

        target.setQuantity(quantity);

        BigDecimal unitPrice = target.getUnitPrice() == null ? BigDecimal.ZERO : target.getUnitPrice();
        target.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(quantity)));

        recalcInvoiceTotals(invoice);
        return invoiceRepository.save(invoice);
    }

    public Invoice applyDiscountPercent(Long invoiceId, BigDecimal percent) {
        Objects.requireNonNull(invoiceId, "invoiceId must not be null");

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        invoice.setDiscountPercent(percent == null ? BigDecimal.ZERO : percent);

        recalcInvoiceTotals(invoice);
        return invoiceRepository.save(invoice);
    }

    public Invoice applyTaxPercent(Long invoiceId, BigDecimal percent) {
        Objects.requireNonNull(invoiceId, "invoiceId must not be null");

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        invoice.setTaxPercent(percent == null ? BigDecimal.ZERO : percent);

        recalcInvoiceTotals(invoice);
        return invoiceRepository.save(invoice);
    }

    public Page<Invoice> listInvoices(Pageable pageable) {
        return invoiceRepository.findAll(pageable);
    }

    public Invoice createInvoiceWithProduct(Long productId, int quantity) {
        Objects.requireNonNull(productId, "productId must not be null");

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        Invoice invoice = new Invoice();

        InvoiceItem item = new InvoiceItem();
        item.setProduct(product);
        item.setCustomName(product.getName());
        item.setQuantity(quantity);
        item.setUnitPrice(product.getPrice());

        BigDecimal unitPrice = product.getPrice() == null ? BigDecimal.ZERO : product.getPrice();
        item.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(quantity)));

        invoice.getItems().add(item);

        recalcInvoiceTotals(invoice);
        return invoiceRepository.save(invoice);
    }

    public Optional<TableSession> findActiveSessionByTableId(Long tableId) {
        Objects.requireNonNull(tableId, "tableId must not be null");
        return sessionRepository.findFirstByTableIdAndEndTimeIsNull(tableId);
    }

    public void deleteInvoice(Long invoiceId) {
        Objects.requireNonNull(invoiceId, "invoiceId must not be null");
        if (!invoiceRepository.existsById(invoiceId)) {
            throw new IllegalArgumentException("Invoice not found");
        }
        invoiceRepository.deleteById(invoiceId);
    }

    // ✅ phần createInvoiceWithItemsAndDiscount của bạn giữ nguyên, chỉ cần repository chạy được là ok
    public Invoice createInvoiceWithItemsAndDiscount(Long tableId,
                                                     String customerName,
                                                     java.util.List<?> itemsList,
                                                     BigDecimal discountPercent,
                                                     BigDecimal taxPercent) {
        Objects.requireNonNull(tableId, "tableId must not be null");
        Objects.requireNonNull(itemsList, "itemsList must not be null");

        Invoice invoice = new Invoice();
        BilliardTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));

        TableSession activeSession = sessionRepository.findFirstByTableIdAndEndTimeIsNull(tableId).orElse(null);
        if (activeSession != null) {
            invoice.setSession(activeSession);
        }

        invoice.setCustomerName(customerName);
        invoice.setCreatedAt(LocalDateTime.now());

        BigDecimal subtotal = BigDecimal.ZERO;

        for (Object itemObj : itemsList) {
            if (!(itemObj instanceof java.util.Map<?, ?> itemMap)) continue;

            Long productId = itemMap.get("productId") != null
                    ? Long.valueOf(itemMap.get("productId").toString())
                    : null;
            int quantity = itemMap.get("quantity") != null
                    ? Integer.parseInt(itemMap.get("quantity").toString())
                    : 1;
            String providedName = itemMap.get("productName") != null
                    ? itemMap.get("productName").toString()
                    : null;

            Product product = null;
            if (productId != null) {
                product = productRepository.findById(productId)
                        .orElseThrow(() -> new IllegalArgumentException("Product " + productId + " not found"));
            }

            BigDecimal providedPrice = itemMap.get("price") != null
                    ? new BigDecimal(itemMap.get("price").toString())
                    : null;

            BigDecimal unitPrice;
            if (providedPrice != null) unitPrice = providedPrice;
            else if (product != null && product.getPrice() != null) unitPrice = product.getPrice();
            else unitPrice = BigDecimal.ZERO;

            InvoiceItem item = new InvoiceItem();
            item.setProduct(product);
            if (product == null) {
                String fallbackName = (providedName != null && !providedName.isBlank())
                        ? providedName
                        : "Mục tuỳ chỉnh";
                item.setCustomName(fallbackName);
            } else {
                item.setCustomName(product.getName());
            }
            item.setQuantity(quantity);
            item.setUnitPrice(unitPrice);
            item.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(quantity)));

            invoice.getItems().add(item);
            subtotal = subtotal.add(item.getLineTotal());
        }

        invoice.setSubtotal(subtotal);

        BigDecimal safeDiscountPercent = discountPercent == null ? BigDecimal.ZERO : discountPercent;
        invoice.setDiscountPercent(safeDiscountPercent);
        BigDecimal discountAmount = subtotal.multiply(safeDiscountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        invoice.setDiscountAmount(discountAmount);

        BigDecimal afterDiscount = subtotal.subtract(discountAmount);

        BigDecimal safeTaxPercent = taxPercent == null ? BigDecimal.ZERO : taxPercent;
        invoice.setTaxPercent(safeTaxPercent);
        BigDecimal taxAmount = afterDiscount.multiply(safeTaxPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        invoice.setTaxAmount(taxAmount);

        BigDecimal total = afterDiscount.add(taxAmount);
        invoice.setTotal(total);

        BilliardTable targetTable = table;
        if (activeSession != null) {
            // Nếu session chưa có endTime -> đóng session vào thời điểm hiện tại
            if (activeSession.getEndTime() == null) {
                activeSession.setEndTime(LocalDateTime.now());
            }

            // Tính toán phí theo thời gian giống logic ở endSession()
            try {
                LocalDateTime start = activeSession.getStartTime();
                LocalDateTime end = activeSession.getEndTime();
                long minutesLong = Duration.between(start, end).toMinutes();
                if (minutesLong <= 0) minutesLong = 1;
                BigDecimal minutes = BigDecimal.valueOf(minutesLong);

                BigDecimal pricePerHour = BigDecimal.ZERO;
                if (activeSession.getTable() != null && activeSession.getTable().getPricePerHour() != null) {
                    pricePerHour = activeSession.getTable().getPricePerHour();
                }

                BigDecimal pricePerMinute = pricePerHour.divide(BigDecimal.valueOf(60), 6, RoundingMode.HALF_UP);
                BigDecimal playAmount = pricePerMinute.multiply(minutes).setScale(0, RoundingMode.CEILING);

                activeSession.setTotal(playAmount);
            } catch (Exception ex) {
                // Nếu có lỗi khi tính toán, fallback giữ subtotal (ít nhất lưu được session)
                if (activeSession.getTotal() == null) {
                    activeSession.setTotal(subtotal);
                }
            }

            sessionRepository.save(activeSession);
            if (activeSession.getTable() != null) {
                targetTable = activeSession.getTable();
            }
        }

        if (targetTable != null) {
            targetTable.setStatus(BilliardTable.TableStatus.AVAILABLE);
            tableRepository.save(targetTable);
        }

        return invoiceRepository.save(invoice);
    }
}
