import React, { useEffect, useState } from "react";
import {
  Typography,
  Paper,
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
  TextField,
} from "@mui/material";
import api from "../api/axios";

const EMPTY_TABLE = {
  id: null,
  name: "",
  pricePerHour: "",
  description: "",
  imageUrl: "",
};

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false); // false = create, true = edit
  const [form, setForm] = useState(EMPTY_TABLE);
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tables"); // -> /api/tables
      const tablesData = res.data || [];

      // For occupied tables, fetch active session to show start time / total
      const withSessions = await Promise.all(
        tablesData.map(async (t) => {
          if (t.status === "OCCUPIED") {
            try {
              const s = await api.get(`/invoices/sessions/${t.id}`);
              return { ...t, currentSession: s.data };
            } catch (err) {
              return { ...t, currentSession: null };
            }
          }
          return { ...t, currentSession: null };
        })
      );

      setTables(withSessions);
    } catch (err) {
      console.error("Failed to load tables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Bắt đầu tính giờ (tạo TableSession + đổi status sang OCCUPIED)
  const handleStart = async (id) => {
    try {
      await api.post(`/invoices/sessions/${id}/start`); // -> /api/invoices/sessions/{tableId}/start
      await load();
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  // Kết thúc tính giờ (đóng session + đổi status sang AVAILABLE)
  const handleStop = async (id) => {
    try {
      const table = tables.find(t => t.id === id);
      if (!table || !table.currentSession) {
        console.error("Session not found");
        return;
      }

      const response = await api.post(`/invoices/sessions/${id}/end`); // -> /api/invoices/sessions/{tableId}/end
      const session = response.data;

      if (session && session.startTime && session.endTime) {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        const durationMs = endTime - startTime;
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationHours = Math.floor(durationMinutes / 60);
        const remainingMinutes = durationMinutes % 60;
        
        const totalCost = session.total != null ? session.total.toLocaleString() : "0";
        const timeStr = durationHours > 0 
          ? `${durationHours}h ${remainingMinutes}m` 
          : `${durationMinutes}m`;
        
        alert(`Thời gian chơi: ${timeStr}\nTổng tiền: ${totalCost} đ`);
      }

      // Reload data after ending session
      setTimeout(() => load(), 500);
    } catch (err) {
      console.error("Failed to end session:", err);
      alert("Kết thúc ca không thành công");
    }
  };

  const openCreateDialog = () => {
    setEditing(false);
    setForm(EMPTY_TABLE);
    setError("");
    setImageFile(null);
    setPreviewUrl("");
    setDialogOpen(true);
  };

  const openEditDialog = (table) => {
    setEditing(true);
    setForm({
      id: table.id,
      name: table.name || "",
      pricePerHour: table.pricePerHour ?? "",
      description: table.description || "",
      imageUrl: table.imageUrl || "",
      status: table.status,
    });
    setError("");
    setImageFile(null);
    setPreviewUrl("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setImageFile(null);
      setPreviewUrl("");
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Tên bàn không được để trống.");
      return;
    }

    const priceNumber = Number(form.pricePerHour);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Giá không hợp lệ.");
      return;
    }

    try {
      // 1. Upload ảnh trước (nếu có chọn file mới)
      let imageUrl = form.imageUrl?.trim() || "";
      if (imageFile) {
        try {
          const fd = new FormData();
          fd.append("image", imageFile);

          const uploadRes = await api.post("/upload/product", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          imageUrl = uploadRes.data; // server trả /uploads/xxx.png
        } catch (uploadErr) {
          console.error("Failed to upload image:", uploadErr);
          setError("Upload ảnh không thành công. Hãy thử lại.");
          return;
        }
      }

      // 2. Gửi table lên backend
      const payload = {
        name: form.name.trim(),
        pricePerHour: priceNumber,
        description: form.description.trim(),
        imageUrl: imageUrl,
        status: editing ? form.status : "AVAILABLE",
      };

      if (editing) {
        await api.put(`/tables/${form.id}`, payload);
      } else {
        await api.post("/tables", payload);
      }

      setDialogOpen(false);
      await load();
    } catch (err) {
      console.error("Failed to save table:", err);
      setError(err.response?.data?.message || "Lưu bàn không thành công.");
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <div>
          <Typography variant="h6">Quản Lý Bàn Bi-a</Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý các bàn bi-a tại đây
          </Typography>
        </div>

        <Button variant="contained" onClick={openCreateDialog}>
          THÊM BÀN
        </Button>
      </Stack>

      {loading ? (
        <Typography>Đang tải danh sách bàn...</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Giờ đặt</TableCell>
              <TableCell>Tên bàn</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Giá/giờ</TableCell>
              <TableCell>Giờ bắt đầu</TableCell>
              <TableCell>Giờ kết thúc</TableCell>
              <TableCell>Thành tiền</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tables.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.description || '-'}</TableCell>
                <TableCell>{t.reservationTime ? new Date(t.reservationTime).toLocaleString() : '-'}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>
                  {typeof t.pricePerHour === "number"
                    ? t.pricePerHour.toLocaleString()
                    : t.pricePerHour}
                  {" đ"}
                </TableCell>
                <TableCell>
                  {t.currentSession && t.currentSession.startTime
                    ? new Date(t.currentSession.startTime).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  {t.currentSession && t.currentSession.endTime
                    ? new Date(t.currentSession.endTime).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  {t.currentSession && t.currentSession.total != null
                    ? (typeof t.currentSession.total === 'number'
                        ? t.currentSession.total.toLocaleString() + ' đ'
                        : t.currentSession.total + ' đ')
                    : "-"}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {(t.status === "AVAILABLE" || t.status === "RESERVED") ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleStart(t.id)}
                      >
                        Bắt đầu
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => handleStop(t.id)}
                      >
                        Kết thúc
                      </Button>
                    )}
                    {t.currentSession && t.currentSession.endTime && (
                      <Button size="small" variant="outlined" onClick={async ()=>{
                        // create invoice from session
                        try{
                          await api.post(`/invoices/sessions/${t.currentSession.id}/create-invoice`)
                          alert('Hoá đơn đã được tạo')
                          await load()
                        }catch(e){
                          console.error(e)
                          alert('Tạo hoá đơn thất bại')
                        }
                      }}>Tạo hoá đơn</Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openEditDialog(t)}
                    >
                      Sửa
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog thêm / sửa bàn */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? "Cập nhật bàn" : "Thêm bàn mới"}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <Stack spacing={2} mt={1}>
            <TextField
              label="Tên bàn"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Giá / giờ"
              name="pricePerHour"
              type="number"
              value={form.pricePerHour}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Mô tả"
              name="description"
              value={form.description}
              onChange={handleChange}
              fullWidth
              multiline
              minRows={2}
            />

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">
            {editing ? "Lưu" : "Thêm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
