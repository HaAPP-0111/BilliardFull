// src/pages/Bills.jsx

import React, { useEffect, useState } from "react";
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

export default function Bills() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);

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

  useEffect(() => {
    load(page);
  }, []);

  const openDetail = async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      setInvoiceDetail(res.data);
      setDetailOpen(true);
    } catch (err) {
      console.error("Failed to load invoice detail", err);
    }
  };

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
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Tax</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.id}</TableCell>
                    <TableCell>{inv.customerName || '-'}</TableCell>
                    <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "-"}</TableCell>
                    <TableCell>{inv.subtotal ?? 0}</TableCell>
                    <TableCell>{inv.discountAmount ?? 0}</TableCell>
                    <TableCell>{inv.taxAmount ?? 0}</TableCell>
                    <TableCell>{inv.total ?? 0}</TableCell>
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
                      <TableCell>{it.unitPrice}</TableCell>
                      <TableCell>{it.lineTotal}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Stack direction="column" spacing={1} mt={2}>
                <Typography>Subtotal: {invoiceDetail.subtotal}</Typography>
                <Typography>Discount: {invoiceDetail.discountAmount} ({invoiceDetail.discountPercent}%)</Typography>
                <Typography>Tax: {invoiceDetail.taxAmount} ({invoiceDetail.taxPercent}%)</Typography>
                <Typography variant="h6">Total: {invoiceDetail.total}</Typography>
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
