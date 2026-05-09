// src/pages/core/AvancesPage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  TablePagination,
  Autocomplete,
  Divider,
  LinearProgress,
  Stack,
  Card,
  CardContent,
  Grid,
  Badge,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  TrendingUpOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  AttachFileOutlined,
  VisibilityOutlined,
  CommentOutlined,
  FilterListOutlined,
  HistoryOutlined,
  PersonOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import {
  avancesService,
  actividadesService,
} from "@/services/actividades.service";
import { proyectosService } from "@/services/core.service";
import { usersService } from "@/services/config.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Avance,
  AvanceCreate,
  AvanceUpdate,
  EstadoAvance,
  Actividad,
} from "@/types/actividades";
import { Proyecto } from "@/types/core";
import { UserAdmin } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const ESTADOS: {
  value: EstadoAvance;
  label: string;
  color: string;
}[] = [
  { value: "borrador", label: "Borrador", color: "#9E9E9E" },
  { value: "enviado", label: "Enviado", color: "#2196F3" },
  { value: "en_revision", label: "En Revisión", color: "#FF9800" },
  { value: "aprobado", label: "Aprobado", color: "#4CAF50" },
  { value: "rechazado", label: "Rechazado", color: "#F44336" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_LABELS = ["PDF", "JPG", "PNG", "DOCX"];

const EMPTY_FORM: AvanceCreate = {
  descripcion: "",
  fecha: new Date().toISOString().split("T")[0],
  actividad: 0,
  evidencia: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
export default function AvancesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { user, activeRole } = useAuth();

  // Rol actual
  const isStudent =
    activeRole === "estudiante" || activeRole === "lider_estudiantil";
  const isDirector =
    activeRole === "director_semillero" || activeRole === "director_grupo";
  const isAdmin = activeRole === "administrador";

  const canCreate = can("/avances", "crear") || isStudent;
  const canEdit = can("/avances", "editar");
  const canDelete = can("/avances", "eliminar") && !isStudent;
  const canAprobar = can("/avances", "aprobar") || isDirector || isAdmin;

  // ── Estado principal ────────────────────────────────────────────────────────
  const [avances, setAvances] = useState<Avance[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [estudiantes, setEstudiantes] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [filterProyecto, setFilterProyecto] = useState<number | "">("");
  const [filterEstudiante, setFilterEstudiante] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog Crear/Editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Avance | null>(null);
  const [form, setForm] = useState<AvanceCreate>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Dialog Observaciones/Aprobar
  const [obsDialog, setObsDialog] = useState<{
    avance: Avance;
    mode: "aprobar" | "rechazar" | "ver";
  } | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [processingObs, setProcessingObs] = useState(false);

  // Dialog eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      if (filterEstado) params.estado = filterEstado;
      if (filterProyecto) params.proyecto = filterProyecto;
      if (filterEstudiante && !isStudent) params.estudiante = filterEstudiante;

      const [avs, acts, projs] = await Promise.all([
        avancesService.list(params),
        actividadesService.list(),
        proyectosService.list(),
      ]);
      setAvances(avs);
      setActividades(acts);
      setProyectos(projs);
    } catch {
      setError("No se pudieron cargar los avances.");
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterProyecto, filterEstudiante, isStudent]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isStudent) {
      usersService
        .list()
        .then(setEstudiantes)
        .catch(() => {});
    }
  }, [isStudent]);

  // ── Métricas (para directores/admin) ───────────────────────────────────────
  const metrics = {
    total: avances.length,
    aprobados: avances.filter((a) => a.estado === "aprobado").length,
    pendientes: avances.filter((a) =>
      ["enviado", "en_revision"].includes(a.estado),
    ).length,
    rechazados: avances.filter((a) => a.estado === "rechazado").length,
  };

  // ── Validaciones ────────────────────────────────────────────────────────────
  const validateFile = (file: File | null): string | null => {
    if (!file) return null;
    if (!ALLOWED_TYPES.includes(file.type))
      return `Tipo no permitido. Usa: ${ALLOWED_LABELS.join(", ")}`;
    if (file.size > MAX_FILE_SIZE) return "El archivo supera los 5 MB.";
    return null;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.descripcion.trim())
      errs.descripcion = "La descripción es requerida.";
    if (!form.fecha) errs.fecha = "La fecha es requerida.";
    if (!form.actividad) errs.actividad = "La actividad es requerida.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Abrir dialog ────────────────────────────────────────────────────────────
  const handleOpen = (av?: Avance) => {
    if (av) {
      // Solo puede editar su propio avance antes de aprobación
      if (isStudent && av.estado === "aprobado") return;
      setEditing(av);
      setForm({
        descripcion: av.descripcion,
        fecha: av.fecha,
        actividad: av.actividad,
        evidencia: null,
      });
    } else {
      setEditing(null);
      setForm(EMPTY_FORM);
    }
    setFormErrors({});
    setFileError(null);
    setSaveError(null);
    setDialogOpen(true);
  };

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    if (fileError) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) {
        const update: AvanceUpdate = {
          descripcion: form.descripcion,
          fecha: form.fecha,
          actividad: form.actividad,
        };
        await avancesService.update(editing.id, update);
      } else {
        await avancesService.create({ ...form, estado: "enviado" });
      }
      setDialogOpen(false);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, string[]> } };
      if (err?.response?.data) {
        const data = err.response.data;
        const fieldErrs: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setFormErrors(fieldErrs);
        setSaveError("Revisa los campos marcados.");
      } else {
        setSaveError("Error al guardar el avance.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Aprobar / Rechazar ───────────────────────────────────────────────────────
  const handleObsAction = async () => {
    if (!obsDialog || obsDialog.mode === "ver") {
      setObsDialog(null);
      return;
    }
    if (obsDialog.mode === "rechazar" && !observaciones.trim()) return;
    setProcessingObs(true);
    try {
      if (obsDialog.mode === "aprobar") {
        await avancesService.aprobar(obsDialog.avance.id, observaciones);
      } else {
        await avancesService.rechazar(obsDialog.avance.id, observaciones);
      }
      setObsDialog(null);
      setObservaciones("");
      await load();
    } catch {
      setError("No se pudo procesar la acción.");
    } finally {
      setProcessingObs(false);
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await avancesService.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError("No se pudo eliminar el avance.");
    } finally {
      setDeleting(false);
    }
  };

  const getEstado = (val: string) =>
    ESTADOS.find((e) => e.value === val) ?? { label: val, color: "#999" };

  // ── Filtrado cliente ────────────────────────────────────────────────────────
  const filtered = avances.filter(
    (a) =>
      (a.descripcion ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.actividad_titulo ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.estudiante_nombre ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TrendingUpOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {isStudent ? "Mis Avances" : "Avances del Semillero"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isStudent
                ? "Registra y consulta el progreso de tus actividades"
                : "Seguimiento de avances académicos de estudiantes"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refrescar">
            <IconButton onClick={load} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => handleOpen()}
            >
              Registrar Avance
            </Button>
          )}
        </Box>
      </Box>

      {/* Métricas (directores/admin) */}
      {!isStudent && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: "Total",
              value: metrics.total,
              color: "primary.main",
              icon: <HistoryOutlined />,
            },
            {
              label: "Aprobados",
              value: metrics.aprobados,
              color: "#4CAF50",
              icon: <CheckCircleOutlined />,
            },
            {
              label: "Pendientes",
              value: metrics.pendientes,
              color: "#FF9800",
              icon: <FilterListOutlined />,
            },
            {
              label: "Rechazados",
              value: metrics.rechazados,
              color: "#F44336",
              icon: <CancelOutlined />,
            },
          ].map((m) => (
            <Grid item xs={6} sm={3} key={m.label}>
              <Card
                variant="outlined"
                sx={{ borderColor: "divider", borderRadius: 2 }}
              >
                <CardContent sx={{ p: "12px !important" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ color: m.color }}>{m.icon}</Box>
                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{ color: m.color, lineHeight: 1 }}
                      >
                        {m.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {m.label}
                      </Typography>
                    </Box>
                  </Box>
                  {metrics.total > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={(m.value / metrics.total) * 100}
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        "& .MuiLinearProgress-bar": { bgcolor: m.color },
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filtros */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          bgcolor: isDark ? "grey.900" : "grey.50",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar avance..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            label="Estado"
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS.map((e) => (
              <MenuItem key={e.value} value={e.value}>
                {e.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {!isStudent && (
          <>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Proyecto</InputLabel>
              <Select
                label="Proyecto"
                value={filterProyecto}
                onChange={(e) => {
                  setFilterProyecto(e.target.value as number | "");
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {proyectos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.titulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Estudiante</InputLabel>
              <Select
                label="Estudiante"
                value={filterEstudiante}
                onChange={(e) => {
                  setFilterEstudiante(e.target.value as number | "");
                  setPage(0);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {estudiantes.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "grey.800" : "grey.100" }}>
                <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actividad</TableCell>
                {!isStudent && (
                  <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Evidencia</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                      <TrendingUpOutlined
                        sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                      />
                      <Typography>
                        {isStudent
                          ? "Aún no tienes avances registrados."
                          : "No hay avances registrados."}
                      </Typography>
                      {isStudent && canCreate && (
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 2 }}
                          startIcon={<AddOutlined />}
                          onClick={() => handleOpen()}
                        >
                          Registrar primer avance
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((av) => {
                  const estado = getEstado(av.estado);
                  const canEditThis =
                    (canEdit || isStudent) && av.estado !== "aprobado";
                  return (
                    <TableRow
                      key={av.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {av.descripcion}
                        </Typography>
                        {av.observaciones && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontStyle: "italic" }}
                          >
                            Obs: {av.observaciones.slice(0, 60)}…
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {av.actividad_titulo ?? `Actividad #${av.actividad}`}
                        </Typography>
                      </TableCell>
                      {!isStudent && (
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <PersonOutlined fontSize="small" color="action" />
                            <Typography variant="body2">
                              {av.estudiante_nombre ?? "—"}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2">{av.fecha}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={estado.label}
                          size="small"
                          sx={{
                            bgcolor: estado.color + "22",
                            color: estado.color,
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {av.evidencia ? (
                          <Tooltip title="Ver evidencia">
                            <IconButton
                              size="small"
                              href={av.evidencia}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="primary"
                            >
                              <AttachFileOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Sin archivo
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          justifyContent="center"
                          spacing={0.5}
                        >
                          {/* Ver observaciones */}
                          {av.observaciones && (
                            <Tooltip title="Ver observaciones">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setObsDialog({ avance: av, mode: "ver" })
                                }
                              >
                                <CommentOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Editar (propio o con permiso, antes de aprobado) */}
                          {canEditThis && (
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpen(av)}
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Aprobar (director/admin) */}
                          {canAprobar &&
                            av.estado !== "aprobado" &&
                            av.estado !== "rechazado" && (
                              <>
                                <Tooltip title="Aprobar">
                                  <IconButton
                                    size="small"
                                    sx={{ color: "#4CAF50" }}
                                    onClick={() => {
                                      setObsDialog({
                                        avance: av,
                                        mode: "aprobar",
                                      });
                                      setObservaciones("");
                                    }}
                                  >
                                    <CheckCircleOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Rechazar">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setObsDialog({
                                        avance: av,
                                        mode: "rechazar",
                                      });
                                      setObservaciones("");
                                    }}
                                  >
                                    <CancelOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}

                          {/* Eliminar */}
                          {canDelete && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteId(av.id)}
                              >
                                <DeleteOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
        />
      </Paper>

      {/* ── Dialog Crear / Editar ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editing ? "Editar Avance" : "Registrar Avance"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}

            <TextField
              label="Descripción *"
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              error={!!formErrors.descripcion}
              helperText={
                formErrors.descripcion ||
                "Describe detalladamente el avance realizado."
              }
              disabled={saving}
              multiline
              rows={4}
              fullWidth
            />

            <TextField
              label="Fecha *"
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              error={!!formErrors.fecha}
              helperText={formErrors.fecha}
              disabled={saving}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Autocomplete
              options={actividades}
              getOptionLabel={(a) => a.titulo}
              value={actividades.find((a) => a.id === form.actividad) ?? null}
              onChange={(_, v) => setForm({ ...form, actividad: v?.id ?? 0 })}
              disabled={saving}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Actividad *"
                  error={!!formErrors.actividad}
                  helperText={formErrors.actividad}
                />
              )}
            />

            {/* Evidencia */}
            <Box>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Evidencia (opcional)
              </Typography>
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: fileError ? "error.main" : "divider",
                  borderRadius: 1,
                  p: 2,
                  textAlign: "center",
                  bgcolor: isDark ? "grey.900" : "grey.50",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  style={{ display: "none" }}
                  disabled={saving}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    const err = validateFile(file);
                    setFileError(err);
                    if (!err) setForm({ ...form, evidencia: file });
                  }}
                />
                <AttachFileOutlined color="action" sx={{ mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {form.evidencia
                    ? form.evidencia.name
                    : "Haz clic para adjuntar un archivo"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ALLOWED_LABELS.join(", ")} · Máx 5 MB
                </Typography>
              </Box>
              {fileError && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {fileError}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !!fileError}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? "Guardando…" : editing ? "Actualizar" : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Aprobar / Rechazar / Ver obs ── */}
      <Dialog
        open={!!obsDialog}
        onClose={() => !processingObs && setObsDialog(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {obsDialog?.mode === "aprobar"
            ? "Aprobar Avance"
            : obsDialog?.mode === "rechazar"
              ? "Rechazar Avance"
              : "Observaciones"}
        </DialogTitle>
        <DialogContent>
          {obsDialog?.avance && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Avance:
              </Typography>
              <Typography variant="body2">
                {obsDialog.avance.descripcion.slice(0, 120)}
                {obsDialog.avance.descripcion.length > 120 ? "…" : ""}
              </Typography>
            </Box>
          )}
          {obsDialog?.mode !== "ver" ? (
            <TextField
              label={
                obsDialog?.mode === "rechazar"
                  ? "Motivo del rechazo *"
                  : "Observaciones (opcional)"
              }
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              multiline
              rows={3}
              fullWidth
              disabled={processingObs}
              error={obsDialog?.mode === "rechazar" && !observaciones.trim()}
              helperText={
                obsDialog?.mode === "rechazar" && !observaciones.trim()
                  ? "El motivo es requerido."
                  : ""
              }
            />
          ) : (
            <Paper
              variant="outlined"
              sx={{ p: 2, bgcolor: isDark ? "grey.900" : "grey.50" }}
            >
              <Typography variant="body2">
                {obsDialog?.avance?.observaciones ?? "Sin observaciones."}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setObsDialog(null)}
            disabled={processingObs}
            color="inherit"
          >
            {obsDialog?.mode === "ver" ? "Cerrar" : "Cancelar"}
          </Button>
          {obsDialog?.mode !== "ver" && (
            <Button
              variant="contained"
              color={obsDialog?.mode === "rechazar" ? "error" : "success"}
              onClick={handleObsAction}
              disabled={
                processingObs ||
                (obsDialog?.mode === "rechazar" && !observaciones.trim())
              }
              startIcon={processingObs ? <CircularProgress size={16} /> : null}
            >
              {processingObs
                ? "Procesando…"
                : obsDialog?.mode === "aprobar"
                  ? "Confirmar Aprobación"
                  : "Confirmar Rechazo"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Confirmar eliminación ── */}
      <Dialog
        open={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar avance?</DialogTitle>
        <DialogContent>
          <Typography>Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteId(null)}
            disabled={deleting}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
