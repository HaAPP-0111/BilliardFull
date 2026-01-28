import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import bg from "../assets/bida-cafe.png";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(180deg, rgba(6,8,12,0.65), rgba(6,8,12,0.92)), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#fff",
        py: { xs: 4, md: 7 },
      }}
    >
      <Container maxWidth="lg">
        {/* HERO */}
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08))",
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(14px)",
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label="Bida • Cafe"
                sx={{
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  fontWeight: 800,
                }}
              />
              <Chip
                label="Hệ thống quản lý"
                sx={{
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.22)",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  fontWeight: 800,
                }}
              />
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              Bida Management System
            </Typography>

            <Typography sx={{ opacity: 0.85, maxWidth: 760 }}>
              Quản lý bàn – tính giờ – gọi món – thanh toán – xuất hoá đơn PDF.
              Demo nhanh: chọn bàn → start giờ → thêm món → checkout.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/cashier")}
                sx={{ fontWeight: 900, borderRadius: 2, textTransform: "none" }}
              >
                Vào Thu ngân
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/login")}
                sx={{
                  fontWeight: 900,
                  borderRadius: 2,
                  textTransform: "none",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.35)",
                  "&:hover": { borderColor: "rgba(255,255,255,0.6)" },
                }}
              >
                Vào Admin
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* FEATURES */}
        <Grid container spacing={2.2} sx={{ mt: 2.2 }}>
          {[
            {
              title: "Quản lý bàn & tính giờ",
              desc: "Bắt đầu / kết thúc phiên chơi, sửa giá/giờ theo bàn.",
            },
            {
              title: "Quản lý sản phẩm",
              desc: "Thêm / sửa / xoá sản phẩm (đồ uống, đồ ăn, cơ), phân trang.",
            },
            {
              title: "Thu ngân & hoá đơn",
              desc: "Chọn bàn, thêm món, chiết khấu/thuế, thanh toán.",
            },
            {
              title: "Xuất PDF hoá đơn",
              desc: "In hoá đơn nhanh, lưu file PDF theo mã hoá đơn.",
            },
          ].map((f, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper
                elevation={10}
                sx={{
                  p: 2.2,
                  borderRadius: 3,
                  height: "100%",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08))",
                  border: "1px solid rgba(255,255,255,0.16)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <Typography sx={{ fontWeight: 900, mb: 0.6 }}>
                  {f.title}
                </Typography>
                <Typography sx={{ opacity: 0.82, fontSize: 14 }}>
                  {f.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* QUICK PRICING */}
        <Paper
          elevation={10}
          sx={{
            mt: 2.2,
            p: 2.4,
            borderRadius: 4,
            backgroundColor: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.16)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
            Bảng giá nhanh (demo)
          </Typography>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.14)", mb: 1.5 }} />
          <Grid container spacing={1.2}>
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 1.6,
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>Bàn thường</Typography>
                <Typography sx={{ opacity: 0.85 }}>50.000đ / giờ</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 1.6,
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>Bàn VIP</Typography>
                <Typography sx={{ opacity: 0.85 }}>80.000đ / giờ</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 1.6,
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>Happy hour</Typography>
                <Typography sx={{ opacity: 0.85 }}>Giảm 10% (tuỳ chọn)</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Typography
          variant="caption"
          sx={{ display: "block", textAlign: "center", mt: 3, opacity: 0.65 }}
        >
          © {new Date().getFullYear()} Bida Cafe • Demo project
        </Typography>
      </Container>
    </Box>
  );
}
