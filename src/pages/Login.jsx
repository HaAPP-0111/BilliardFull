import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Link,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import api from "../api/axios";
import bg from "../assets/bida-cafe.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const navigate = useNavigate();

  // Nếu đã có token thì không cần vào trang login nữa
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/", { replace: true });
  }, [navigate]);

  // Style field để:
  // - fix Chrome autofill (ô trắng/xanh)
  // - label không bị đè
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(255,255,255,0.10)",
      borderRadius: 2,
      color: "rgba(255,255,255,0.95)",
    },

    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.80)",
      backgroundColor: "rgba(8,10,16,0.78)",
      padding: "0 6px",
      borderRadius: 1,
    },

    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255,255,255,0.25)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255,255,255,0.45)",
    },

    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px rgba(255,255,255,0.10) inset",
      WebkitTextFillColor: "rgba(255,255,255,0.95)",
      caretColor: "rgba(255,255,255,0.95)",
      borderRadius: "inherit",
    },
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });

      const token = res?.data?.token;
      if (!token) throw new Error("Login response missing token");

      // demo: vẫn lưu localStorage như bạn đang làm
      // (Nếu muốn remember đúng nghĩa: remember=false thì lưu sessionStorage)
      localStorage.setItem("token", token);

      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 6,

        // Background theo ảnh của bạn + overlay tối để dễ đọc chữ
backgroundImage: `linear-gradient(180deg, rgba(6,8,12,0.70), rgba(6,8,12,0.88)), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08))",
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(14px)",
            color: "rgba(255,255,255,0.92)",
          }}
        >
          {/* Title center */}
          <Box sx={{ mb: 2, textAlign: "center" }}>
            <Typography variant="h4" fontWeight={900} letterSpacing={0.3}>
              Admin Panel
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.78, mt: 0.8 }}>
              Đăng nhập để quản lý hệ thống
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.14)" }} />

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={submit} noValidate>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              sx={fieldSx}
              InputLabelProps={{ shrink: true }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />

            <TextField
              label="Password"
              type={showPwd ? "text" : "password"}
              fullWidth
              margin="normal"
              sx={fieldSx}
              InputLabelProps={{ shrink: true }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPwd((v) => !v)}
                      edge="end"
                      disabled={loading}
                      sx={{ color: "rgba(255,255,255,0.80)" }}
                      aria-label="toggle password visibility"
                    >
                      {showPwd ? (
                        <VisibilityOffOutlinedIcon />
                      ) : (
                        <VisibilityOutlinedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                mt: 1,
display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading}
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      "&.Mui-checked": { color: "rgba(255,255,255,0.92)" },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ opacity: 0.88 }}>
                    Nhớ đăng nhập
                  </Typography>
                }
              />

              <Link
                component="button"
                type="button"
                onClick={() => setError("Chưa làm chức năng quên mật khẩu 😄")}
                underline="hover"
                sx={{ color: "rgba(255,255,255,0.88)", fontSize: 14 }}
              >
                Quên mật khẩu?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                py: 1.2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
              }}
              disabled={loading || !username || !password}
            >
              {loading ? <CircularProgress size={22} /> : "Đăng nhập"}
            </Button>
          </Box>
        </Paper>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 2,
            opacity: 0.65,
            color: "#fff",
          }}
        >
          © {new Date().getFullYear()} Admin Frontend
        </Typography>
      </Container>
    </Box>
  );
}