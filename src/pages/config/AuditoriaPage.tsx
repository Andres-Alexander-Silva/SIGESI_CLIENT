import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  TextField,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid2 as Grid,
  Divider,
} from "@mui/material";
import {
  SearchOutlined,
  RefreshOutlined,
  ManageSearchOutlined,
  InfoOutlined,
  FilterListOutlined,
  ClearOutlined,
  LockOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "@/context/AuthContext";
import { auditoriaService } from "@/services/auditoria.service";
import { RegistroAuditoria, AuditoriaFilters } from "@/types/auditoria";

const PAGE_SIZE = 20;

const ROLES_LABEL: Record<string, string> = {
  administrador: "Administrador",
  director_grupo: "Director de Grupo",
  director_semillero: "Director de Semillero",
  lider_estudiantil: "Líder Estudiantil",
  estudiante: "Estudiante",
};

const EMPTY_FILTERS: AuditoriaFilters = {
  search: "",
  accion: "",
  modulo: "",
  usuario_email: "",
  rol_activo: "",
};

function accionColor(
  accion: string,
): "success" | "error" | "info" | "warning" | "default" {
  const a = accion?.toLowerCase() ?? "";
  if (a.includes("crear") || a.includes("create")) return "success";
  if (a.includes("eliminar") || a.includes("delete")) return "error";
  if (a.includes("actualizar") || a.includes("update") || a.includes("editar"))
    return "info";
  if (a.includes("login") || a.includes("logout") || a.includes("auth"))
    return "default";
  return "warning";
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Justo ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function AuditoriaPage() {
  const theme = useTheme();
  const { activeRole } = useAuth();

  const [logs, setLogs] = useState<RegistroAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AuditoriaFilters>({ ...EMPTY_FILTERS });
  const [pendingFilters, setPendingFilters] = useState<AuditoriaFilters>({
    ...EMPTY_FILTERS,
  });

  const [detail, setDetail] = useState<RegistroAuditoria | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const isAdmin = activeRole === "administrador";

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const params = {
        page: page + 1,
        page_size: PAGE_SIZE,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.accion ? { accion: filters.accion } : {}),
        ...(filters.modulo ? { modulo: filters.modulo } : {}),
        ...(filters.usuario_email ? { usuario_email: filters.usuario_email } : {}),
        ...(filters.rol_activo ? { rol_activo: filters.rol_activo } : {}),
        ordering: "-fecha",
      };
      const res = await auditoriaService.list(params);
      setLogs(res.results ?? []);
      setTotal(res.count ?? 0);
    } catch (e: any) {
      if (e.response?.status === 403) {
        setError("No tienes permisos para acceder a los registros de auditoría.");
      } else {
        setError("No se pudieron cargar los registros de auditoría.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setPage(0);
    setFilters({ ...pendingFilters });
  };

  const clearFilters = () => {
    const empty = { ...EMPTY_FILTERS };
    setPendingFilters(empty);
    setPage(0);
    setFilters(empty);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const todayCount = logs.filter((l) => isToday(l.fecha)).length;
  const uniqueIPs = new Set(logs.map((l) => l.ip_address).filter(Boolean)).size;
  const uniqueModules = new Set(logs.map((l) => l.modulo).filter(Boolean)).size;

  const openDetail = async (log: RegistroAuditoria) => {
    setDetail(log);
    if (log.detalles === undefined) {
      setLoadingDetail(true);
      try {
        const full = await auditoriaService.get(log.id);
        setDetail(full);
      } catch {
        // keep existing data
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 2,
        }}
      >
        <LockOutlined sx={{ fontSize: 64, color: theme.palette.text.disabled }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          Acceso restringido
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center">
          El Panel de Auditoría y Seguridad es exclusivo para el rol Administrador.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${theme.palette.primary.main}15`,
            }}
          >
            <ManageSearchOutlined
              sx={{ color: theme.palette.primary.main, fontSize: 28 }}
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              fontFamily='"DM Sans", sans-serif'
            >
              Auditoría y Seguridad
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Trazabilidad de actividad institucional
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Recargar">
          <IconButton onClick={load} disabled={loading}>
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── KPI chips ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Total registros",
            value: total,
            color: theme.palette.primary.main,
          },
          {
            label: "Registros hoy",
            value: loading ? "—" : todayCount,
            color: theme.palette.success.main,
          },
          {
            label: "IPs únicas",
            value: loading ? "—" : uniqueIPs,
            color: theme.palette.warning.main,
          },
          {
            label: "Módulos",
            value: loading ? "—" : uniqueModules,
            color: theme.palette.info.main,
          },
        ].map((k) => (
          <Grid key={k.label} size={{ xs: 6, sm: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor: `${k.color}44`,
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: k.color, lineHeight: 1.2 }}
              >
                {k.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {k.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FilterListOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
          <Typography variant="subtitle2" color="text.secondary">
            Filtros
          </Typography>
          {hasActiveFilters && (
            <Chip
              label="Activos"
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: "0.68rem" }}
            />
          )}
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Buscar"
              size="small"
              fullWidth
              value={pendingFilters.search}
              onChange={(e) =>
                setPendingFilters((f) => ({ ...f, search: e.target.value }))
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 16 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="Acción"
              size="small"
              fullWidth
              placeholder="ej: crear"
              value={pendingFilters.accion}
              onChange={(e) =>
                setPendingFilters((f) => ({ ...f, accion: e.target.value }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="Módulo"
              size="small"
              fullWidth
              placeholder="ej: usuarios"
              value={pendingFilters.modulo}
              onChange={(e) =>
                setPendingFilters((f) => ({ ...f, modulo: e.target.value }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Rol activo</InputLabel>
              <Select
                label="Rol activo"
                value={pendingFilters.rol_activo}
                onChange={(e) =>
                  setPendingFilters((f) => ({ ...f, rol_activo: e.target.value }))
                }
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(ROLES_LABEL).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="Email usuario"
              size="small"
              fullWidth
              value={pendingFilters.usuario_email}
              onChange={(e) =>
                setPendingFilters((f) => ({
                  ...f,
                  usuario_email: e.target.value,
                }))
              }
            />
          </Grid>
          <Grid
            size={{ xs: 12, sm: 6, md: 1 }}
            sx={{ display: "flex", gap: 1, alignItems: "center" }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={applyFilters}
              sx={{ textTransform: "none", flexShrink: 0 }}
            >
              Filtrar
            </Button>
            {hasActiveFilters && (
              <Tooltip title="Limpiar filtros">
                <IconButton size="small" onClick={clearFilters}>
                  <ClearOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <Paper
        sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.03)",
                }}
              >
                {[
                  "Fecha",
                  "Usuario",
                  "Rol",
                  "Módulo",
                  "Acción",
                  "Descripción",
                  "IP",
                  "",
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      color: theme.palette.text.disabled,
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 6, color: theme.palette.text.disabled }}
                  >
                    No se encontraron registros de auditoría
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell
                      sx={{ whiteSpace: "nowrap", fontSize: "0.78rem" }}
                    >
                      <Tooltip
                        title={new Date(log.fecha).toLocaleString("es-CO")}
                      >
                        <span>{formatFecha(log.fecha)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {log.usuario_email || "—"}
                    </TableCell>
                    <TableCell>
                      {log.rol_activo ? (
                        <Chip
                          label={ROLES_LABEL[log.rol_activo] ?? log.rol_activo}
                          size="small"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {log.modulo ? (
                        <Chip
                          label={log.modulo}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {log.accion ? (
                        <Chip
                          label={log.accion}
                          size="small"
                          color={accionColor(log.accion)}
                          sx={{ height: 20, fontSize: "0.65rem" }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 280,
                        fontSize: "0.78rem",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {log.descripcion || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{ fontSize: "0.75rem", color: theme.palette.text.disabled, whiteSpace: "nowrap" }}
                    >
                      {log.ip_address || "—"}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => openDetail(log)}>
                          <InfoOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
        />
      </Paper>

      {/* ── Diálogo Detalle ───────────────────────────────────────────────── */}
      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"DM Sans", sans-serif' }}>
          Detalle del Registro
          <Typography variant="caption" display="block" color="text.secondary">
            ID #{detail?.id}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetail ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : detail ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[
                { label: "Fecha", value: detail.fecha ? new Date(detail.fecha).toLocaleString("es-CO") : "—" },
                { label: "Usuario", value: detail.usuario_email || "—" },
                { label: "Rol activo", value: ROLES_LABEL[detail.rol_activo] ?? detail.rol_activo ?? "—" },
                { label: "Módulo", value: detail.modulo || "—" },
                { label: "Acción", value: detail.accion || "—" },
                { label: "IP", value: detail.ip_address || "—" },
                { label: "Descripción", value: detail.descripcion || "—" },
              ].map((row) => (
                <Box key={row.label}>
                  <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {row.label}
                  </Typography>
                  <Typography variant="body2">{row.value}</Typography>
                </Box>
              ))}
              {detail.detalles && Object.keys(detail.detalles).length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Detalles adicionales
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        mt: 0.5,
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        overflowX: "auto",
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "0.72rem",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {JSON.stringify(detail.detalles, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                </>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
