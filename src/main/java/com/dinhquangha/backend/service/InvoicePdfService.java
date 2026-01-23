package com.dinhquangha.backend.service;

import com.dinhquangha.backend.model.Invoice;
import com.dinhquangha.backend.model.InvoiceItem;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.io.font.PdfEncodings;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class InvoicePdfService {

    public byte[] generateInvoicePdf(Invoice invoice) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        
        try {
            PdfWriter writer = new PdfWriter(output);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            
            // Load font hỗ trợ tiếng Việt (Arial Unicode hoặc font-asian)
            PdfFont font = PdfFontFactory.createFont("STSong-Light", "UniGB-UCS2-H");
            document.setFont(font);
            
            // Header
            document.add(new Paragraph("HÓA ĐƠN")
                    .setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBold());
            
            document.add(new Paragraph("QUÁN BILLIARD 2TL")
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER));
            
            document.add(new Paragraph("")); // spacing
            
            // Invoice info
            document.add(new Paragraph("Mã hoá đơn: " + invoice.getId())
                    .setFontSize(10));
            
            if (invoice.getCreatedAt() != null) {
                String dateStr = invoice.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
                document.add(new Paragraph("Ngày: " + dateStr).setFontSize(10));
            }
            
            if (invoice.getCustomerName() != null && !invoice.getCustomerName().isEmpty()) {
                document.add(new Paragraph("Khách hàng: " + invoice.getCustomerName())
                        .setFontSize(10));
            }
            
            document.add(new Paragraph("")); // spacing
            
            // Items table
            Table table = new Table(new float[]{3, 1, 2, 2});
            table.setWidth(100);
            
            // Header row
            table.addCell(new Cell().add(new Paragraph("Sản phẩm").setBold()).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph("SL").setBold()).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph("Giá").setBold()).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph("Thành tiền").setBold()).setTextAlignment(TextAlignment.CENTER));
            
            // Data rows
                        if (invoice.getItems() != null) {
                                for (InvoiceItem item : invoice.getItems()) {
                                        String productName;
                                        if (item.getProduct() != null && item.getProduct().getName() != null) {
                                                productName = item.getProduct().getName();
                                        } else if (item.getCustomName() != null && !item.getCustomName().isBlank()) {
                                                productName = item.getCustomName();
                                        } else {
                                                productName = "N/A";
                                        }
                                        table.addCell(new Cell().add(new Paragraph(productName)));
                    table.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantity())))
                            .setTextAlignment(TextAlignment.CENTER));
                    table.addCell(new Cell().add(new Paragraph(formatPrice(item.getUnitPrice())))
                            .setTextAlignment(TextAlignment.RIGHT));
                    table.addCell(new Cell().add(new Paragraph(formatPrice(item.getLineTotal())))
                            .setTextAlignment(TextAlignment.RIGHT));
                }
            }
            
            document.add(table);
            document.add(new Paragraph("")); // spacing
            
            // Totals
            document.add(new Paragraph("Tổng cộng: " + formatPrice(invoice.getSubtotal()))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(12)
                    .setBold());
            
            if (invoice.getDiscountAmount() != null && invoice.getDiscountAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                document.add(new Paragraph("Chiết khấu: -" + formatPrice(invoice.getDiscountAmount()))
                        .setTextAlignment(TextAlignment.RIGHT)
                        .setFontSize(10));
            }
            
            if (invoice.getTaxAmount() != null && invoice.getTaxAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                document.add(new Paragraph("Thuế: +" + formatPrice(invoice.getTaxAmount()))
                        .setTextAlignment(TextAlignment.RIGHT)
                        .setFontSize(10));
            }
            
            document.add(new Paragraph("")); // spacing
            
            document.add(new Paragraph("Tổng thanh toán: " + formatPrice(invoice.getTotal()))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFontSize(14)
                    .setBold());
            
            document.add(new Paragraph("")); // spacing
            document.add(new Paragraph("Cảm ơn quý khách!")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setItalic());
            
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo PDF: " + e.getMessage(), e);
        }
        
        return output.toByteArray();
    }
    
    private String formatPrice(Number price) {
        if (price == null) return "0đ";
        return String.format("%.0fđ", price.doubleValue());
    }
}
