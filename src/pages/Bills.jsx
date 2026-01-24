// src/pages/Bills.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TableContainer,
  Pagination,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import api from "../api/axios";
import { formatVND } from "../utils/currency";

export default function Bills() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [highlightInvoiceId, setHighlightInvoiceId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices?page=${pageNumber - 1}&size=${pageSize}`);
      const data = res.data || {};
      setInvoices(data.content || []);
      setTotalPages(data.totalPages || 0);
      setPage((data.number || 0) + 1);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = useCallback(async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      setInvoiceDetail(res.data);
      setDetailOpen(true);
    } catch (err) {
      console.error("Failed to load invoice detail", err);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, []);

  useEffect(() => {
    if (location.state?.highlightInvoiceId) {
      setHighlightInvoiceId(location.state.highlightInvoiceId);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!highlightInvoiceId || invoices.length === 0) return;
    const matched = invoices.some((inv) => inv.id === highlightInvoiceId);
    if (!matched) return;
    openDetail(highlightInvoiceId);
    setHighlightInvoiceId(null);
  }, [highlightInvoiceId, invoices, openDetail]);

  const closeDetail = () => {
    setDetailOpen(false);
    setInvoiceDetail(null);
  };

  const handlePageChange = (e, value) => {
    setPage(value);
    load(value);
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
      return;
    }
    try {
      await api.delete(`/invoices/${invoiceId}`);
      alert('Đã xóa hóa đơn');
      load(page);
    } catch (err) {
      console.error('Failed to delete invoice', err);
      alert('Xóa hóa đơn thất bại');
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Danh sách hoá đơn
      </Typography>

      {loading ? (
        <Typography>Đang tải...</Typography>
      ) : invoices.length === 0 ? (
        <Typography>Chưa có hoá đơn nào.</Typography>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Tạm tính</TableCell>
                  <TableCell>Giảm giá</TableCell>
                  <TableCell>Thuế</TableCell>
                  <TableCell>Tổng cộng</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.id}</TableCell>
                    <TableCell>{inv.customerName || '-'}</TableCell>
                    <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "-"}</TableCell>
                    <TableCell>{formatVND(inv.subtotal)}</TableCell>
                    <TableCell>{formatVND(inv.discountAmount)}</TableCell>
                    <TableCell>{formatVND(inv.taxAmount)}</TableCell>
                    <TableCell>{formatVND(inv.total)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => openDetail(inv.id)}>
                          Xem
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(inv.id)}>
                          Xóa
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack alignItems="center" mt={2}>
            <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
          </Stack>
        </>
      )}

      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth>
        <DialogTitle>
          Hoá đơn #{invoiceDetail?.id}
          <IconButton
            aria-label="close"
            onClick={closeDetail}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {invoiceDetail ? (
            <div>
              <Typography>Session: {invoiceDetail.session?.id ?? '-'}</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Line Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceDetail.items?.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.product?.name}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>{formatVND(it.unitPrice)}</TableCell>
                      <TableCell>{formatVND(it.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Stack direction="column" spacing={1} mt={2}>
                <Typography>Subtotal: {formatVND(invoiceDetail.subtotal)}</Typography>
                <Typography>Discount: {formatVND(invoiceDetail.discountAmount)} ({invoiceDetail.discountPercent}%)</Typography>
                <Typography>Tax: {formatVND(invoiceDetail.taxAmount)} ({invoiceDetail.taxPercent}%)</Typography>
                <Typography variant="h6">Total: {formatVND(invoiceDetail.total)}</Typography>
              </Stack>
            </div>
          ) : (
            <Typography>Đang tải...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Đóng</Button>
          {invoiceDetail && (
            <Button variant="contained" color="primary" onClick={async () => {
              try {
                const response = await api.get(`/invoices/${invoiceDetail.id}/export-pdf`, {
                  responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `HoaDon_${invoiceDetail.id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
              } catch (err) {
                alert("❌ Lỗi xuất PDF: " + (err.response?.data?.message || err.message));
              }
            }}>📄 In hoá đơn</Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
