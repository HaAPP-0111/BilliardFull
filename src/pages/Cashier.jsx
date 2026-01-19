import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Pagination,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api/axios";

const PRODUCTS_PER_PAGE = 9;
const INVOICE_STORAGE_KEY = "cashier_invoice_state";

const createEmptyInvoice = () => ({
  items: [],
  subtotal: 0,
  discountPercent: 0,
  discountAmount: 0,
  taxPercent: 0,
  taxAmount: 0,
  total: 0,
});

const readInvoiceStorage = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(INVOICE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("Không thể đọc dữ liệu hoá đơn đã lưu:", err);
    return {};
  }
};

const writeInvoiceStorage = (data) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Không thể ghi dữ liệu hoá đơn đã lưu:", err);
  }
};

const getStoredInvoiceForTable = (tableId) => {
  if (!tableId) return null;
  const allInvoices = readInvoiceStorage();
  return allInvoices?.[tableId] || null;
};

const persistInvoiceForTable = (tableId, payload) => {
  if (!tableId) return;
  const allInvoices = readInvoiceStorage();
  allInvoices[tableId] = payload;
  writeInvoiceStorage(allInvoices);
};

const clearInvoiceForTable = (tableId) => {
  if (!tableId) return;
  const allInvoices = readInvoiceStorage();
  if (allInvoices[tableId]) {
    delete allInvoices[tableId];
    writeInvoiceStorage(allInvoices);
  }
};

const Cashier = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [tableForm, setTableForm] = useState({ name: "", capacity: "", description: "", imageUrl: "" });
  const [tableImageFile, setTableImageFile] = useState(null);
  
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQty, setProductQty] = useState(1);

  const [invoice, setInvoice] = useState(createEmptyInvoice);

  const [customerName, setCustomerName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const persistInvoiceState = (nextInvoice, nextCustomerName = customerName, tableIdOverride) => {
    const tableId = tableIdOverride ?? selectedTable?.id;
    if (!tableId) return;
    const invoiceToPersist = { ...nextInvoice };
    delete invoiceToPersist.id;
    const nameToPersist = nextCustomerName || "";
    const hasMeaningfulData =
      invoiceToPersist.items.length > 0 ||
      Boolean(nameToPersist) ||
      Number(invoiceToPersist.discountPercent) > 0 ||
      Number(invoiceToPersist.taxPercent) > 0;

    if (!hasMeaningfulData) {
      clearInvoiceForTable(tableId);
      return;
    }

    persistInvoiceForTable(tableId, {
      invoice: invoiceToPersist,
      customerName: nameToPersist,
    });
  };

  const handleCustomerNameChange = (value) => {
    setCustomerName(value);
    persistInvoiceState(invoice, value);
  };

  const filteredProducts = useMemo(
    () => products.filter((p) => selectedCategory === "all" || p.category === selectedCategory),
    [products, selectedCategory]
  );

  useEffect(() => {
    loadTables();
    loadProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
    setCurrentPage((prev) => Math.min(prev, maxPage));
  }, [filteredProducts.length]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tables");
      const tableList = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setTables(tableList);
    } catch (err) {
      setError("Lỗi tải bàn: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const size = 50; // tải nhiều sản phẩm mỗi lần gọi để lấp đầy phân trang
      let page = 0;
      let allProducts = [];
      let hasNext = true;

      while (hasNext) {
        const res = await api.get("/products", { params: { page, size, sort: "name,asc" } });
        const isArrayResponse = Array.isArray(res.data);
        const pageContent = isArrayResponse ? res.data : res.data?.content || [];
        allProducts = [...allProducts, ...pageContent];

        if (isArrayResponse || !res.data) {
          hasNext = false;
        } else {
          const isLastPage = res.data.last ?? pageContent.length < size;
          hasNext = !isLastPage;
          page += 1;
        }
      }

      setProducts(allProducts);
      const cats = ["all"];
      allProducts.forEach((p) => {
        if (p.category && !cats.includes(p.category)) cats.push(p.category);
      });
      setCategories(cats);
    } catch (err) {
      setError("Lỗi tải sản phẩm: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSelectTable = async (table) => {
    setSelectedTable(table);
    setTableDialogOpen(false);
    
    // Load session data cho bàn này
    try {
      const res = await api.get(`/tables/${table.id}`);
      const tableData = res.data;

      const storedState = getStoredInvoiceForTable(table.id);
      if (storedState) {
        const storedCustomer = storedState.customerName || "";
        setCustomerName(storedCustomer);
        const restoredInvoice = { ...createEmptyInvoice(), ...storedState.invoice };
        recalcInvoice(restoredInvoice, { tableId: table.id, customerNameOverride: storedCustomer });
        return;
      }
      
      // Nếu bàn có session đã kết thúc (có endTime và total), tự động thêm vào hoá đơn
      const items = [];
      if (tableData.currentSession && tableData.currentSession.endTime && tableData.currentSession.total) {
        const startTime = new Date(tableData.currentSession.startTime);
        const endTime = new Date(tableData.currentSession.endTime);
        const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60));
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes}p` : `${minutes}p`;
        
        items.push({
          id: Date.now(),
          productId: null,
          productName: `${table.name} - ${durationText}`,
          price: Number(tableData.currentSession.total),
          quantity: 1,
          lineTotal: Number(tableData.currentSession.total),
        });
      }

      const initialInvoice = { ...createEmptyInvoice(), items };
      setCustomerName("");
      recalcInvoice(initialInvoice, { tableId: table.id, customerNameOverride: "" });
    } catch (err) {
      setError("Lỗi tải session bàn: " + (err.response?.data?.message || err.message));
      const emptyInvoice = createEmptyInvoice();
      setInvoice(emptyInvoice);
      persistInvoiceState(emptyInvoice, "", table.id);
      setCustomerName("");
    }
  };

  const handleAddProductClick = (product) => {
    setSelectedProduct(product);
    setProductQty(1);
    setAddProductOpen(true);
  };

  const handleAddTable = async () => {
    if (!tableForm.name.trim()) return alert("Vui lòng nhập tên bàn!");
    if (!tableForm.capacity) return alert("Vui lòng nhập sức chứa!");
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", tableForm.name);
      formData.append("capacity", tableForm.capacity);
      formData.append("description", tableForm.description || "");
      
      if (tableImageFile) {
        formData.append("image", tableImageFile);
      }
      
      const res = await api.post("/tables", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      alert("✅ Thêm bàn thành công!");
      setAddTableOpen(false);
      setTableForm({ name: "", capacity: "", description: "", imageUrl: "" });
      setTableImageFile(null);
      loadTables();
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToInvoice = () => {
    if (!selectedProduct || productQty <= 0) return;
    const priceNum = Number(selectedProduct.price);
    const newItem = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      price: priceNum,
      quantity: productQty,
      lineTotal: priceNum * productQty,
    };
    const newItems = [...invoice.items, newItem];
    recalcInvoice({ ...invoice, items: newItems });
    setAddProductOpen(false);
  };

  const handleRemoveItem = (itemId) => {
    const newItems = invoice.items.filter((item) => item.id !== itemId);
    recalcInvoice({ ...invoice, items: newItems });
  };

  const recalcInvoice = (inv, options = {}) => {
    const { tableId, customerNameOverride } = options;
    const subtotal = inv.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountAmount = subtotal * (inv.discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (inv.taxPercent / 100);
    const total = afterDiscount + taxAmount;
    const nextInvoice = { ...inv, subtotal, discountAmount, taxAmount, total };
    setInvoice(nextInvoice);
    persistInvoiceState(nextInvoice, customerNameOverride, tableId);
  };

  const handleCheckout = async () => {
    if (!selectedTable) return alert("Vui lòng chọn bàn!");
    if (invoice.items.length === 0) return alert("Vui lòng thêm sản phẩm!");
    try {
      setLoading(true);
      const payload = {
        tableId: selectedTable.id,
        customerName: customerName || null,
        items: invoice.items.map((i) => ({
          productId: i.productId ?? null,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
        })),
        discountPercent: invoice.discountPercent,
        taxPercent: invoice.taxPercent,
      };
      console.log("Thanh toán payload:", payload);
      const res = await api.post("/invoices", payload);
      console.log("Thanh toán response:", res.data);
      const invoiceId = res.data?.id ?? "";
      alert("✅ Tạo hoá đơn thành công: " + invoiceId);
      if (selectedTable) {
        clearInvoiceForTable(selectedTable.id);
      }
      // Reset invoice data and store ID for optional PDF export
      const resetInvoice = { ...createEmptyInvoice(), id: invoiceId };
      setInvoice(resetInvoice);
      setSelectedTable(null);
      setCustomerName("");
      loadTables();
      navigate("/bills", { state: { highlightInvoiceId: invoiceId } });
    } catch (err) {
      console.error("Thanh toán error:", err);
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!invoice.id) {
      alert("Không tìm thấy mã hoá đơn!");
      return;
    }
    try {
      const response = await api.get(`/invoices/${invoice.id}/export-pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HoaDon_${invoice.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("❌ Lỗi xuất PDF: " + (err.response?.data?.message || err.message));
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPageSafe - 1) * PRODUCTS_PER_PAGE,
    currentPageSafe * PRODUCTS_PER_PAGE
  );

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>💳 Thu Ngân</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ height: "calc(100vh - 150px)" }}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2, height: "100%", overflow: "auto" }}>
            {!selectedTable ? (
              <Box sx={{ textAlign: "center", py: 5 }}>
                <Button variant="contained" size="large" onClick={() => setTableDialogOpen(true)} sx={{ mb: 2 }}>Chọn Bàn</Button>
                <Typography color="textSecondary">Vui lòng chọn bàn để bắt đầu</Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📍 Bàn: <strong>{selectedTable.name}</strong>
                  <Button size="small" onClick={() => setTableDialogOpen(true)} sx={{ ml: 2 }}>Đổi</Button>
                </Typography>
                {categories.length > 0 && (
                  <Box sx={{ display: "flex", gap: 1, mb: 3, overflowX: "auto", pb: 1, flexWrap: "wrap" }}>
                    {categories.map((cat) => (
                      <Button key={cat} variant={selectedCategory === cat ? "contained" : "outlined"} size="small" onClick={() => setSelectedCategory(cat)} sx={{ textTransform: "none" }}>
                        {cat === "all" ? "Tất cả" : cat}
                      </Button>
                    ))}
                  </Box>
                )}
                <Grid container spacing={2}>
                  {paginatedProducts.length === 0 ? (
                    <Grid item xs={12}>
                      <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                        Không có sản phẩm phù hợp
                      </Typography>
                    </Grid>
                  ) : (
                    paginatedProducts.map((p) => (
                      <Grid item xs={6} sm={4} key={p.id}>
                        <Card onClick={() => handleAddProductClick(p)} sx={{ cursor: "pointer", transition: "transform 0.2s, boxShadow 0.2s", "&:hover": { transform: "translateY(-5px)", boxShadow: 3 } }}>
                        <Box sx={{ height: 120, bgcolor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <ShoppingCartIcon sx={{ fontSize: 60, color: "#999" }} />
                          )}
                        </Box>
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>{p.name}</Typography>
                          <Typography variant="body2" sx={{ color: "red", fontWeight: "bold" }}>{Number(p.price).toLocaleString("vi-VN")}đ</Typography>
                        </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
                {filteredProducts.length > PRODUCTS_PER_PAGE && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPageSafe}
                      onChange={(event, value) => setCurrentPage(value)}
                      color="primary"
                      showFirstButton
                      showLastButton
                      siblingCount={0}
                      size="small"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            {!selectedTable ? (
              <Typography color="textSecondary" sx={{ textAlign: "center", py: 5 }}>Chọn bàn để xem hoá đơn</Typography>
            ) : (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>📋 Hoá Đơn</Typography>
                <TextField label="Tên khách hàng (tuỳ chọn)" size="small" fullWidth value={customerName} onChange={(e) => handleCustomerNameChange(e.target.value)} sx={{ mb: 2 }} />
                <TableContainer sx={{ mb: 2, flex: 1, overflow: "auto" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>SP</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>SL</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>Giá</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>Thành tiền</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold" }}>🗑</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell sx={{ fontSize: "0.85rem" }}>{item.productName}</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.85rem" }}>{item.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.85rem" }}>{Number(item.price).toLocaleString("vi-VN")}đ</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.85rem", fontWeight: "bold" }}>{Number(item.lineTotal).toLocaleString("vi-VN")}đ</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ borderTop: "2px solid #ddd", pt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography>Tạm tính:</Typography>
                    <Typography sx={{ fontWeight: "bold" }}>{Number(invoice.subtotal).toLocaleString("vi-VN")}đ</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
                    <Typography sx={{ flex: 1 }}>Chiết khấu (%):</Typography>
                    <TextField type="number" size="small" inputProps={{ step: "0.1", min: "0", max: "100" }} sx={{ width: 80 }} value={invoice.discountPercent} onChange={(e) => { const val = parseFloat(e.target.value) || 0; const next = { ...invoice, discountPercent: val }; recalcInvoice(next); }} />
                    <Typography sx={{ fontWeight: "bold", minWidth: 100, textAlign: "right" }}>-{Number(invoice.discountAmount).toLocaleString("vi-VN")}đ</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
                    <Typography sx={{ flex: 1 }}>Thuế (%):</Typography>
                    <TextField type="number" size="small" inputProps={{ step: "0.1", min: "0", max: "100" }} sx={{ width: 80 }} value={invoice.taxPercent} onChange={(e) => { const val = parseFloat(e.target.value) || 0; const next = { ...invoice, taxPercent: val }; recalcInvoice(next); }} />
                    <Typography sx={{ fontWeight: "bold", minWidth: 100, textAlign: "right" }}>+{Number(invoice.taxAmount).toLocaleString("vi-VN")}đ</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, px: 1, bgcolor: "#e3f2fd", borderRadius: 1, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>TỔNG:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "#d32f2f" }}>{Number(invoice.total).toLocaleString("vi-VN")}đ</Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="contained" color="success" fullWidth size="large" onClick={handleCheckout} disabled={invoice.items.length === 0 || loading} sx={{ fontWeight: "bold", flex: 1 }}>{loading ? "⏳ Đang xử lý..." : "💰 Thanh Toán"}</Button>
                    {invoice.id && (
                      <Button variant="outlined" color="primary" size="large" onClick={handleExportPdf} sx={{ fontWeight: "bold" }}>📄 PDF</Button>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={tableDialogOpen} onClose={() => setTableDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.3rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          🎱 Chọn Bàn
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {tables.map((table) => {
              const getStatusColor = (status) => {
                if (!status) return "#999";
                const s = status.toLowerCase();
                if (s.includes("available") || s.includes("trống")) return "#4caf50";
                if (s.includes("occupied") || s.includes("đang dùng")) return "#f44336";
                return "#ff9800";
              };
              const statusColor = getStatusColor(table.status);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={table.id}>
                  <Card 
                    onClick={() => handleSelectTable(table)} 
                    sx={{ 
                      cursor: "pointer", 
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "2px solid #e0e0e0",
                      borderRadius: "12px",
                      overflow: "hidden",
                      "&:hover": { 
                        transform: "translateY(-8px)",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
                        borderColor: "#0b64b3"
                      }
                    }}
                  >
                    <Box sx={{ 
                      height: 180, 
                      bgcolor: "#f0f0f0", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      {table.imageUrl ? (
                        <img src={table.imageUrl} alt={table.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Box sx={{ textAlign: "center" }}>
                          <Typography sx={{ fontSize: "4rem", mb: 1 }}>🎱</Typography>
                          <Typography sx={{ color: "#999", fontWeight: "500" }}></Typography>
                        </Box>
                      )}
                    </Box>
                    
                    <CardContent sx={{ p: 2 }}>
                      <Typography 
                        sx={{ 
                          fontWeight: "bold", 
                          fontSize: "1.2rem",
                          mb: 1,
                          color: "#333"
                        }}
                      >
                        {table.name}
                      </Typography>
                      
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <Box 
                          sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: "50%", 
                            bgcolor: statusColor,
                            boxShadow: `0 0 6px ${statusColor}`
                          }} 
                        />
                        <Typography variant="body2" sx={{ fontWeight: "600", color: statusColor }}>
                          {table.status || "Không xác định"}
                        </Typography>
                      </Box>
                      
                      {table.capacity && (
                        <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 0.5 }}>
                          👥 Sức chứa: <strong>{table.capacity} chỗ</strong>
                        </Typography>
                      )}
                      
                      <Button 
                        variant="contained" 
                        fullWidth 
                        onClick={() => handleSelectTable(table)}
                        sx={{ mt: 1.5, fontWeight: "bold", textTransform: "none", fontSize: "1rem" }}
                      >
                        Chọn Bàn Này
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
      </Dialog>

      <Dialog open={addProductOpen} onClose={() => setAddProductOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Thêm Sản Phẩm</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ mb: 2 }}>
                <strong>{selectedProduct.name}</strong> - Giá: <span style={{ color: "red", fontWeight: "bold" }}>{Number(selectedProduct.price).toLocaleString("vi-VN")}đ</span>
              </Typography>
              <TextField label="Số lượng" type="number" fullWidth inputProps={{ min: "1", step: "1" }} value={productQty} onChange={(e) => setProductQty(parseInt(e.target.value) || 1)} />
              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Button onClick={() => setAddProductOpen(false)}>Hủy</Button>
                <Button variant="contained" onClick={handleAddToInvoice}>Thêm</Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Cashier;
