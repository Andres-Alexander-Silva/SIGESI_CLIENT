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
  AttachFileOutlined,
  VisibilityOutlined,
  HistoryOutlined,
  PersonOutlined,
  DescriptionOutlined,
  ArticleOutlined,
  CollectionsOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import {
  avancesService,
  actividadesService,
} from "@/services/actividades.service";
import { proyectosService } from "@/services/core.service";
import { usersService } from "@/services/config.service";
import { usePermissions } from "@/context/PermissionsContext";
import { downloadFile } from "@/utils/downloadFile";
import { useAuth } from "@/context/AuthContext";
import {
  Avance,
  AvanceCreate,
  AvanceUpdate,
  TipoEvidencia,
  Actividad,
} from "@/types/actividades";
import { Proyecto } from "@/types/core";
import { UserAdmin } from "@/types";
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from "@/utils/fileValidation";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
//
// El recurso real es `Evidencia` (archivo adjunto a una Actividad, sin flujo
// de aprobación); "Avance" es solo la nomenclatura de esta página.
// Ver docs/HU-021_PLAN_IMPLEMENTACION.md, fase F0.
// ─────────────────────────────────────────────────────────────────────────────
const TIPOS: { value: TipoEvidencia; label: string; color: string }[] = [
  { value: "documento", label: "Documento", color: "#2196F3" },
  { value: "acta", label: "Acta", color: "#4CAF50" },
  { value: "fotografia", label: "Fotografía", color: "#FF9800" },
  { value: "video", label: "Video", color: "#9C27B0" },
  { value: "otro", label: "Otro", color: "#9E9E9E" },
];

const MAX_FILE_SIZE = MAX_UPLOAD_SIZE_BYTES;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_LABELS = ["PDF", "JPG", "PNG", "DOCX"];

interface AvanceFormState {
  actividad: number;
  tipo: TipoEvidencia;
  titulo: string;
  descripcion: string;
  archivo: File | null;
}

const EMPTY_FORM: AvanceFormState = {
  actividad: 0,
  tipo: "documento",
  titulo: "",
  descripcion: "",
  archivo: null,
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

  const canCreate = can("/avances", "crear") || isStudent;
  const canEdit = can("/avances", "editar") || isStudent;
  const canDelete = can("/avances", "eliminar") && !isStudent;

  // ── Estado principal ────────────────────────────────────────────────────────
  const [avances, setAvances] = useState<Avance[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [estudiantes, setEstudiantes] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterProyecto, setFilterProyecto] = useState<number | "">("");
  const [filterEstudiante, setFilterEstudiante] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog Crear/Editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Avance | null>(null);
  const [form, setForm] = useState<AvanceFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Dialog eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);

  const handleDownloadEvidencia = async (av: Avance) => {
    setDownloadingId(av.id);
    try {
      await downloadFile(
        avancesService.archiveDownloadUrl(av.id),
        av.titulo || `avance_${av.id}`,
      );
    } catch {
      setError("No se pudo descargar el archivo.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUploadEvidencia = async (av: Avance, file: File) => {
    setDownloadingId(`upload_${av.id}`);
    try {
      await avancesService.archiveUpload(av.id, file, {
        actividad: av.actividad,
        tipo: av.tipo,
        titulo: av.titulo,
        descripcion: av.descripcion,
      });
      setError(null);
      await load();
    } catch {
      setError("No se pudo subir el archivo.");
    } finally {
      setDownloadingId(null);
    }
  };
  // ── Carga de datos ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      if (filterTipo) params.tipo = filterTipo;
      if (filterProyecto) params.proyecto_id = filterProyecto;
      if (filterEstudiante && !isStudent) params.usuario_id = filterEstudiante;

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
  }, [filterTipo, filterProyecto, filterEstudiante, isStudent]);

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
    documentos: avances.filter((a) => a.tipo === "documento").length,
    actas: avances.filter((a) => a.tipo === "acta").length,
    otros: avances.filter((a) => !["documento", "acta"].includes(a.tipo)).length,
  };

  // ── Validaciones ────────────────────────────────────────────────────────────
  const validateFile = (file: File | null): string | null => {
    if (!file) return null;
    if (!ALLOWED_TYPES.includes(file.type))
      return `Tipo no permitido. Usa: ${ALLOWED_LABELS.join(", ")}`;
    if (file.size > MAX_FILE_SIZE) return `El archivo supera los ${MAX_UPLOAD_SIZE_MB} MB.`;
    return null;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.titulo.trim()) errs.titulo = "El título es requerido.";
    if (!form.descripcion.trim())
      errs.descripcion = "La descripción es requerida.";
    if (!form.actividad) errs.actividad = "La actividad es requerida.";
    if (!editing && !form.archivo) errs.archivo = "El archivo es requerido.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Abrir dialog ────────────────────────────────────────────────────────────
  const handleOpen = (av?: Avance) => {
    if (av) {
      setEditing(av);
      setForm({
        actividad: av.actividad,
        tipo: av.tipo,
        titulo: av.titulo,
        descripcion: av.descripcion,
        archivo: null,
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
          actividad: form.actividad,
          tipo: form.tipo,
          titulo: form.titulo,
          descripcion: form.descripcion,
        };
        await avancesService.update(editing.id, update);
      } else {
        const create: AvanceCreate = {
          actividad: form.actividad,
          tipo: form.tipo,
          titulo: form.titulo,
          descripcion: form.descripcion,
          archivo: form.archivo as File,
        };
        await avancesService.create(create);
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

  const getTipo = (val: string) =>
    TIPOS.find((t) => t.value === val) ?? { label: val, color: "#999" };

  // ── Filtrado cliente ────────────────────────────────────────────────────────
  const filtered = avances.filter(
    (a) =>
      (a.titulo ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.descripcion ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.actividad_titulo ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.subido_por_nombre ?? "").toLowerCase().includes(search.toLowerCase()),
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
                ? "Registra y consulta las evidencias de tus actividades"
                : "Seguimiento de evidencias académicas de estudiantes"}
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
              label: "Documentos",
              value: metrics.documentos,
              color: "#2196F3",
              icon: <DescriptionOutlined />,
            },
            {
              label: "Actas",
              value: metrics.actas,
              color: "#4CAF50",
              icon: <ArticleOutlined />,
            },
            {
              label: "Otros",
              value: metrics.otros,
              color: "#FF9800",
              icon: <CollectionsOutlined />,
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
          <InputLabel>Tipo</InputLabel>
          <Select
            label="Tipo"
            value={filterTipo}
            onChange={(e) => {
              setFilterTipo(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {TIPOS.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
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
              <InputLabel>Subido por</InputLabel>
              <Select
                label="Subido por"
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
                <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actividad</TableCell>
                {!isStudent && (
                  <TableCell sx={{ fontWeight: 700 }}>Subido por</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700 }}>Registrado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Archivo</TableCell>
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
                  const tipo = getTipo(av.tipo);
                  const canEditThis = canEdit;
                  return (
                    <TableRow
                      key={av.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {av.titulo}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {av.descripcion}
                        </Typography>
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
                              {av.subido_por_nombre ?? "—"}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2">
                          {av.created_at?.slice(0, 10) ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tipo.label}
                          size="small"
                          sx={{
                            bgcolor: tipo.color + "22",
                            color: tipo.color,
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {av.archivo ? (
                          <Tooltip title="Descargar archivo">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={downloadingId === av.id}
                                onClick={() => handleDownloadEvidencia(av)}
                              >
                                {downloadingId === av.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <AttachFileOutlined fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Sin archivo
                          </Typography>
                        )}
                        {canEditThis && (
                          <Tooltip title="Subir / reemplazar archivo">
                            <span>
                              <IconButton
                                size="small"
                                disabled={
                                  downloadingId === `upload_${av.id}`
                                }
                                component="label"
                              >
                                {downloadingId === `upload_${av.id}` ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <AttachFileOutlined
                                    fontSize="small"
                                    color="action"
                                  />
                                )}
                                <input
                                  type="file"
                                  hidden
                                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleUploadEvidencia(av, file);
                                    e.target.value = "";
                                  }}
                                />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          justifyContent="center"
                          spacing={0.5}
                        >
                          {/* Editar (propio o con permiso) */}
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
              label="Título *"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              error={!!formErrors.titulo}
              helperText={formErrors.titulo}
              disabled={saving}
              fullWidth
            />

            <FormControl fullWidth disabled={saving}>
              <InputLabel>Tipo *</InputLabel>
              <Select
                label="Tipo *"
                value={form.tipo}
                onChange={(e) =>
                  setForm({ ...form, tipo: e.target.value as TipoEvidencia })
                }
              >
                {TIPOS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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

            {/* Archivo — solo al crear; para reemplazarlo en un avance
                existente se usa el botón dedicado de la tabla. */}
            {editing ? (
              <Alert severity="info" variant="outlined">
                El archivo se reemplaza con el botón de la tabla, no desde
                este formulario.
              </Alert>
            ) : (
              <Box>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Archivo *
                </Typography>
                <Box
                  sx={{
                    border: "2px dashed",
                    borderColor:
                      fileError || formErrors.archivo
                        ? "error.main"
                        : "divider",
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
                      if (!err) setForm({ ...form, archivo: file });
                    }}
                  />
                  <AttachFileOutlined color="action" sx={{ mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {form.archivo
                      ? form.archivo.name
                      : "Haz clic para adjuntar un archivo"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ALLOWED_LABELS.join(", ")} · Máx {MAX_UPLOAD_SIZE_MB} MB
                  </Typography>
                </Box>
                {(fileError || formErrors.archivo) && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {fileError || formErrors.archivo}
                  </Typography>
                )}
              </Box>
            )}
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
