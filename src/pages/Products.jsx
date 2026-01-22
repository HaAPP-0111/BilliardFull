import React, { useEffect, useMemo, useState } from "react";
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

/* =========================
   FIX ẢNH CHO DEPLOY
========================= */
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const resolveImageUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url; // đã là full url
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${path}`;
};

/* ========================= */

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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [categories, setCategories] = useState(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  /* =========================
     LOAD PRODUCTS
  ========================= */
  const loadProducts = async () => {
    try {
      setLoading(true);
      const size = 100;
      let currentPage = 0;
      let fetched = [];
      let hasNext = true;

      while (hasNext) {
        const res = await api.get("/products", {
          params: { page: currentPage, size, sort: "name,asc" },
        });

        const isArray = Array.isArray(res.data);
        const content = isArray ? res.data : res.data?.content || [];
        fetched = [...fetched, ...content];

        if (isArray || res.data?.last) hasNext = false;
        else currentPage += 1;
      }

      setProducts(fetched);

      const cats = ["all"];
      fetched.forEach((p) => {
        if (p.category && !cats.includes(p.category)) {
          cats.push(p.category);
        }
      });
      setCategories(cats);
      setPage(1);
    } catch (e) {
      console.error(e);
      setError("Không tải được danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  /* =========================
     FORM HANDLERS
  ========================= */
  const openCreateDialog = () => {
    setEditing(false);
    setForm(EMPTY_PRODUCT);
    setImageFile(null);
    setPreviewUrl("");
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (p) => {
    setEditing(true);
    setForm(p);
    setImageFile(null);
    setPreviewUrl("");
    setDialogOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      let imageUrl = form.imageUrl || "";

      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const res = await api.post("/upload/product", fd);
        imageUrl = res.data;
      }

      const payload = {
        ...form,
        price: Number(form.price),
        imageUrl,
      };

      if (editing) {
        await api.put(`/products/${form.id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setDialogOpen(false);
      loadProducts();
    } catch (e) {
      console.error(e);
      setError("Lưu sản phẩm không thành công.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    await api.delete(`/products/${id}`);
    loadProducts();
  };

  /* =========================
     UI
  ========================= */
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Products</Typography>
        <Button variant="contained" onClick={openCreateDialog}>
          THÊM SẢN PHẨM
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} mb={2}>
        {categories.map((c) => (
          <Button
            key={c}
            size="small"
            variant={selectedCategory === c ? "contained" : "outlined"}
            onClick={() => setSelectedCategory(c)}
          >
            {c === "all" ? "Tất cả" : c}
          </Button>
        ))}
      </Stack>

      {loading ? (
        <Typography>Đang tải...</Typography>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Ảnh</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Giá</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>
                    {p.imageUrl ? (
                      <img
                        src={resolveImageUrl(p.imageUrl)}
                        alt={p.name}
                        style={{ width: 48, height: 48, objectFit: "cover" }}
                      />
                    ) : (
                      "(No image)"
                    )}
                  </TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.price.toLocaleString()} đ</TableCell>
                  <TableCell>
                    <Button onClick={() => openEditDialog(p)}>EDIT</Button>
                    <Button color="error" onClick={() => handleDelete(p.id)}>
                      DELETE
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            sx={{ mt: 2 }}
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
          />
        </>
      )}

      {/* DIALOG */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>{editing ? "Cập nhật" : "Thêm sản phẩm"}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error">{error}</Typography>}
          <Stack spacing={2} mt={1}>
            <TextField label="Tên" name="name" value={form.name} onChange={handleChange} />
            <TextField label="Giá" name="price" value={form.price} onChange={handleChange} />
            <TextField label="Danh mục" name="category" value={form.category} onChange={handleChange} />
            <TextField label="Mô tả" name="description" value={form.description} onChange={handleChange} />

            {(previewUrl || form.imageUrl) && (
              <img
                src={previewUrl || resolveImageUrl(form.imageUrl)}
                alt="preview"
                style={{ width: 120 }}
              />
            )}

            <input type="file" accept="image/*" onChange={handleFileChange} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
