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
  Pagination,
} from "@mui/material";
import api from "../api/axios";

const EMPTY_PRODUCT = {
  id: null,
  name: "",
  price: "",
  description: "",
  category: "",
  imageUrl: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // 1-based for MUI Pagination
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false); // false = create, true = edit
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/products?page=${pageNumber - 1}&size=${pageSize}`);
      // Spring Page<Product> structure: content, totalPages, totalElements, number, size
      const data = res.data || {};
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setPage((data.number || 0) + 1);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Không tải được danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, []);

  const openCreateDialog = () => {
    setEditing(false);
    setForm(EMPTY_PRODUCT);
    setError("");
    setImageFile(null);
    setPreviewUrl("");
    setDialogOpen(true);
  };

  const openEditDialog = (product) => {
    setEditing(true);
    setForm({
      id: product.id,
      name: product.name || "",
      price: product.price ?? "",
      description: product.description || "",
      category: product.category || "",
      imageUrl: product.imageUrl || "",
    });
    setError("");
    setImageFile(null);
    setPreviewUrl(""); // preview mới nếu user chọn ảnh khác
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
      setError("Tên sản phẩm không được để trống.");
      return;
    }

    const priceNumber = Number(form.price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Giá không hợp lệ.");
      return;
    }

    try {
      // 1. Upload ảnh trước (nếu có chọn file mới)
      let imageUrl = form.imageUrl?.trim() || "";
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);

        const uploadRes = await api.post("/upload/product", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        imageUrl = uploadRes.data; // server trả /uploads/xxx.png
      }

      // 2. Gửi product lên backend
      const payload = {
        name: form.name.trim(),
        price: priceNumber,
        description: form.description.trim(),
        category: form.category.trim(),
        imageUrl: imageUrl,
      };

      if (editing) {
        await api.put(`/products/${form.id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setDialogOpen(false);
      await load(page);
    } catch (err) {
      console.error("Failed to save product:", err);
      setError("Lưu sản phẩm không thành công.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await api.delete(`/products/${id}`);
      // reload same page after delete
      await load(page);
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Xóa sản phẩm không thành công.");
    }
  };

  const handlePageChange = (event, value) => {
    // value is 1-based page
    setPage(value);
    load(value);
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
          <Typography variant="h6">Products</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your products here.
          </Typography>
        </div>

        <Button variant="contained" onClick={openCreateDialog}>
          THÊM SẢN PHẨM
        </Button>
      </Stack>

      {loading ? (
        <Typography>Đang tải danh sách sản phẩm...</Typography>
      ) : products.length === 0 ? (
        <Typography>Chưa có sản phẩm nào.</Typography>
      ) : (
        <>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ảnh</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>
                      (No image)
                    </span>
                  )}
                </TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.description}</TableCell>
                <TableCell>
                  {typeof p.price === "number"
                    ? p.price.toLocaleString()
                    : p.price}{" "}
                  đ
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openEditDialog(p)}
                    >
                      EDIT
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleDelete(p.id)}
                    >
                      DELETE
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination control */}
        <Stack alignItems="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Stack>
        </>
      )}

      {/* Dialog thêm / sửa sản phẩm */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <Stack spacing={2} mt={1}>
            <TextField
              label="Tên sản phẩm"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Giá"
              name="price"
              type="number"
              value={form.price}
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
            <TextField
              label="Danh mục (Category)"
              name="category"
              value={form.category}
              onChange={handleChange}
              fullWidth
              placeholder="VD: Bia & Thức uống, Đồ ăn vặt, Bida..."
            />

            {/* Preview ảnh */}
            <div>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Hình ảnh
              </Typography>
              {previewUrl || form.imageUrl ? (
                <img
                  src={previewUrl || form.imageUrl}
                  alt="preview"
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Chưa chọn ảnh
                </Typography>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
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
