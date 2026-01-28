import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";

import api from "../api/axios";
import bg from "../assets/bida-cafe.png";

/** format VND (làm tròn để tránh số lẻ) */
function toVnd(n) {
  const val = Math.round(Number(n || 0));
  return val.toLocaleString("vi-VN") + "đ";
}
function pad2(x) {
  return String(x).padStart(2, "0");
}
function formatHMS(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}
function getTableName(t) {
  return t?.name || (t?.id != null ? `Bàn ${t.id}` : "Bàn");
}
function getHourlyRate(table) {
  const n = Number(table?.pricePerHour ?? 50000);
  return Number.isFinite(n) ? n : 50000;
}

/**
 * ✅ Parse LocalDateTime từ Spring (YYYY-MM-DDTHH:mm:ss)
 * Không dùng Date.parse(string) vì mỗi browser parse khác nhau.
 */
function parseLocalDateTime(s) {
  if (!s) return null;
  const m = String(s).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
  );
  if (!m) return null;
  const [, Y, Mo, D, H, Mi, S] = m;
  return new Date(
    Number(Y),
    Number(Mo) - 1,
    Number(D),
    Number(H),
    Number(Mi),
    Number(S)
  );
}
function getSessionStart(session) {
  return parseLocalDateTime(session?.startTime);
}

function formatDateVN(d) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export default function TvBoards() {
  const [tables, setTables] = useState([]);
  const [sessionsByTableId, setSessionsByTableId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [now, setNow] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const [filter, setFilter] = useState("all"); // all | playing | empty
  const [sort, setSort] = useState("playing_first"); // playing_first | longest | id

  const headerText = { color: "rgba(255,255,255,0.95)" };
  const lineSx = { color: "rgba(255,255,255,0.92)" };
  const subSx = { color: "rgba(255,255,255,0.75)" };

  // tick timer 1s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // fullscreen change
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const tablesRes = await api.get("/tables");
      const tableList = Array.isArray(tablesRes.data) ? tablesRes.data : [];
      setTables(tableList);

      const pairs = await Promise.all(
        tableList.map(async (t) => {
          const id = t?.id;
          if (id == null) return [null, null];

          try {
            const r = await api.get(`/invoices/sessions/${id}`);
            return [id, r.data];
          } catch (e) {
            if (e?.response?.status === 404) return [id, null];
            throw e;
          }
        })
      );

      const map = {};
      for (const [id, sess] of pairs) {
        if (id != null) map[id] = sess;
      }
      setSessionsByTableId(map);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Không tải được dữ liệu bàn/session"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // auto refresh 5s
  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, [fetchData]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const derived = useMemo(() => {
    const arr = tables.map((t) => {
      const id = t?.id;
      const session = id != null ? sessionsByTableId[id] : null;

      const start = getSessionStart(session);
      const playing = !!session && !!start && !session?.endTime;

      const hourly = getHourlyRate(t);

      // ✅ clamp elapsed tránh âm (lệch giờ / parse sai)
      const elapsedMsRaw = playing ? now - start.getTime() : 0;
      const elapsedMs = Math.max(0, elapsedMsRaw);

      // ✅ tính theo phút (không nhảy lẻ)
      const elapsedMinutes = playing ? Math.floor(elapsedMs / 60000) : 0;

      // ✅ tiền theo phút + làm tròn
      const money = playing ? Math.round((elapsedMinutes * hourly) / 60) : 0;

      const hours = playing ? elapsedMs / 3600000 : 0;
      const warnLevel = hours >= 3 ? "danger" : hours >= 2 ? "warn" : "none";

      return { table: t, session, start, playing, elapsedMs, hourly, money, warnLevel };
    });

    let filtered = arr;
    if (filter === "playing") filtered = arr.filter((x) => x.playing);
    if (filter === "empty") filtered = arr.filter((x) => !x.playing);

    const byId = (a, b) => Number(a.table?.id || 0) - Number(b.table?.id || 0);

    if (sort === "id") filtered.sort(byId);

    if (sort === "playing_first") {
      filtered.sort((a, b) => {
        if (a.playing !== b.playing) return a.playing ? -1 : 1;
        if (a.playing && b.playing) return b.elapsedMs - a.elapsedMs;
        return byId(a, b);
      });
    }

    if (sort === "longest") {
      filtered.sort((a, b) => (b.elapsedMs || 0) - (a.elapsedMs || 0));
    }

    return filtered;
  }, [tables, sessionsByTableId, now, filter, sort]);

  const countPlaying = derived.filter((x) => x.playing).length;
  const countEmpty = derived.length - countPlaying;

  const topMoney = useMemo(() => {
    return [...derived]
      .filter((x) => x.playing)
      .sort((a, b) => b.money - a.money)
      .slice(0, 3);
  }, [derived]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(180deg, rgba(6,8,12,0.70), rgba(6,8,12,0.88)), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#fff",
        py: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={10}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            mb: 2,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08))",
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(14px)",
            color: "rgba(255,255,255,0.92)",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            alignItems={{ xs: "flex-start", lg: "center" }}
            justifyContent="space-between"
            gap={2}
          >
            <Box sx={{ flex: 1 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                gap={2}
              >
                <Box>
                  <Typography variant="h4" fontWeight={900} sx={headerText}>
                    TV — Trạng thái bàn
                  </Typography>
                  <Typography sx={subSx}>
                    {formatDateVN(new Date(now))} •{" "}
                    <b style={{ color: "rgba(255,255,255,0.95)" }}>
                      {new Date(now).toLocaleTimeString()}
                    </b>
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Refresh ngay">
                    <IconButton
                      onClick={fetchData}
                      sx={{
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 2,
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>

                  <Button
                    onClick={toggleFullscreen}
                    variant="contained"
                    startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900 }}
                  >
                    {isFullscreen ? "Thoát full screen" : "Full screen"}
                  </Button>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip
                  label={`Đang chơi: ${countPlaying}`}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.14)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.18)",
                    fontWeight: 800,
                  }}
                />
                <Chip
                  label={`Trống: ${countEmpty}`}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.14)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.18)",
                    fontWeight: 800,
                  }}
                />
                <Chip
                  label={lastUpdated ? `Cập nhật: ${lastUpdated.toLocaleTimeString()}` : "Cập nhật: -"}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.14)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.18)",
                    fontWeight: 800,
                  }}
                />
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                gap={1.5}
                mt={2}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography sx={subSx} fontWeight={800}>
                    Lọc:
                  </Typography>
                  <ToggleButtonGroup
                    value={filter}
                    exclusive
                    onChange={(_, v) => v && setFilter(v)}
                    size="small"
                    sx={{
                      "& .MuiToggleButton-root": {
                        color: "rgba(255,255,255,0.9)",
                        borderColor: "rgba(255,255,255,0.2)",
                        textTransform: "none",
                        fontWeight: 800,
                      },
                      "& .MuiToggleButton-root.Mui-selected": {
                        backgroundColor: "rgba(255,255,255,0.16)",
                        borderColor: "rgba(255,255,255,0.28)",
                        color: "#fff",
                      },
                    }}
                  >
                    <ToggleButton value="all">Tất cả</ToggleButton>
                    <ToggleButton value="playing">Đang chơi</ToggleButton>
                    <ToggleButton value="empty">Trống</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <SortRoundedIcon sx={{ opacity: 0.85 }} />
                  <Typography sx={subSx} fontWeight={800}>
                    Sắp xếp:
                  </Typography>
                  <ToggleButtonGroup
                    value={sort}
                    exclusive
                    onChange={(_, v) => v && setSort(v)}
                    size="small"
                    sx={{
                      "& .MuiToggleButton-root": {
                        color: "rgba(255,255,255,0.9)",
                        borderColor: "rgba(255,255,255,0.2)",
                        textTransform: "none",
                        fontWeight: 800,
                      },
                      "& .MuiToggleButton-root.Mui-selected": {
                        backgroundColor: "rgba(255,255,255,0.16)",
                        borderColor: "rgba(255,255,255,0.28)",
                        color: "#fff",
                      },
                    }}
                  >
                    <ToggleButton value="playing_first">Đang chơi trước</ToggleButton>
                    <ToggleButton value="longest">Chơi lâu nhất</ToggleButton>
                    <ToggleButton value="id">Theo số bàn</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
              </Stack>
            </Box>

            <Paper
              elevation={0}
              sx={{
                minWidth: { xs: "100%", lg: 320 },
                p: 2,
                borderRadius: 3,
                backgroundColor: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
            >
              <Typography fontWeight={900} sx={headerText} mb={1}>
                Top bàn tạm tính
              </Typography>
              {topMoney.length === 0 ? (
                <Typography sx={subSx}>Chưa có bàn đang chơi.</Typography>
              ) : (
                <Stack spacing={0.8}>
                  {topMoney.map((x) => (
                    <Stack
                      key={x.table?.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography sx={lineSx} fontWeight={800}>
                        {getTableName(x.table)}
                      </Typography>
                      <Typography sx={lineSx} fontWeight={900}>
                        {toVnd(x.money)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Stack alignItems="center" mt={6} gap={2}>
            <CircularProgress />
            <Typography sx={lineSx}>Đang tải trạng thái bàn...</Typography>
          </Stack>
        ) : derived.length === 0 ? (
          <Typography sx={lineSx}>Không có bàn phù hợp bộ lọc.</Typography>
        ) : (
          <Grid container spacing={2}>
            {derived.map((x) => {
              const { table: t, session, playing, start, elapsedMs, hourly, money, warnLevel } = x;

              const accent = playing ? "rgba(255, 80, 80, 0.55)" : "rgba(80, 255, 140, 0.45)";

              const borderGlow =
                warnLevel === "danger"
                  ? "0 0 0 2px rgba(255,70,70,0.55)"
                  : warnLevel === "warn"
                  ? "0 0 0 2px rgba(255,170,0,0.55)"
                  : "none";

              const warnChip =
                warnLevel === "danger" ? "Quá lâu > 3h" : warnLevel === "warn" ? "Cảnh báo > 2h" : "";

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={t?.id ?? getTableName(t)}>
                  <Paper
                    elevation={10}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      height: "100%",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08))",
                      border: "1px solid rgba(255,255,255,0.16)",
                      backdropFilter: "blur(14px)",
                      position: "relative",
                      overflow: "hidden",
                      color: "#fff",
                      boxShadow: borderGlow,
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 10,
                        height: "100%",
                        background: accent,
                      }}
                    />

                    <Stack spacing={1.2} sx={{ pl: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                        <Typography variant="h5" fontWeight={900} sx={headerText}>
                          {getTableName(t)}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                          {warnLevel !== "none" && playing && (
                            <Tooltip title={warnChip}>
                              <WarningAmberRoundedIcon
                                sx={{
                                  color:
                                    warnLevel === "danger"
                                      ? "rgba(255,90,90,1)"
                                      : "rgba(255,190,80,1)",
                                }}
                              />
                            </Tooltip>
                          )}

                          <Chip
                            label={playing ? "ĐANG CHƠI" : "TRỐNG"}
                            sx={{
                              fontWeight: 900,
                              color: "#fff",
                              backgroundColor: playing
                                ? "rgba(255,80,80,0.35)"
                                : "rgba(80,255,140,0.28)",
                              border: "1px solid rgba(255,255,255,0.18)",
                            }}
                          />
                        </Stack>
                      </Stack>

                      <Divider sx={{ borderColor: "rgba(255,255,255,0.14)" }} />

                      {playing ? (
                        <>
                          <Typography sx={lineSx}>
                            Bắt đầu: <b>{start ? start.toLocaleTimeString() : "-"}</b>
                          </Typography>

                          <Typography sx={lineSx}>
                            Thời gian: <b style={{ fontSize: 18 }}>{formatHMS(elapsedMs)}</b>
                          </Typography>

                          <Typography sx={lineSx}>
                            Giá/giờ: <b>{toVnd(hourly)}</b>
                          </Typography>

                          <Typography sx={lineSx}>
                            Tạm tính (theo phút): <b style={{ fontSize: 18 }}>{toVnd(money)}</b>
                          </Typography>

                          <Typography variant="caption" sx={subSx}>
                            Session: {session?.id ?? "-"}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography sx={lineSx}>
                            Giá/giờ: <b>{toVnd(hourly)}</b>
                          </Typography>
                          <Typography sx={subSx}>Sẵn sàng phục vụ ✅</Typography>
                        </>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
