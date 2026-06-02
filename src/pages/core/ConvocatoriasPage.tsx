// src/pages/core/ConvocatoriasPage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  CalendarTodayOutlined,
  CampaignOutlined,
  DeleteOutlined,
  EditOutlined,
  EventOutlined,
  GroupsOutlined,
  LinkOutlined,
  RefreshOutlined,
  SearchOutlined,
  SendOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import {
  convocatoriasService,
  eventosService,
  postulacionesService,
} from "@/services/convocatorias.service";
import { semillerosService } from "@/services/core.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Convocatoria,
  ConvocatoriaCreate,
  EstadoConvocatoria,
  Evento,
  TipoConvocatoria,
} from "@/types/convocatorias";
import { Semillero } from "@/types/core";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS_CONV: {
  value: EstadoConvocatoria;
  label: string;
  color: string;
}[] = [
  { value: "abierta", label: "Abierta", color: "#4CAF50" },
  { value: "cerrada", label: "Cerrada", color: "#9E9E9E" },
  { value: "en_evaluacion", label: "En Evaluación", color: "#2196F3" },
  { value: "finalizada", label: "Finalizada", color: "#FF9800" },
];

const TIPOS_CONV: { value: TipoConvocatoria; label: string; color: string }[] =
  [
    { value: "interna", label: "Interna", color: "#2196F3" },
    { value: "externa", label: "Externa", color: "#9C27B0" },
  ];

interface ConvForm {
  evento: string;
  titulo: string;
  descripcion: string;
  tipo: TipoConvocatoria;
  entidad: string;
  fecha_apertura: string;
  fecha_cierre: string;
  requisitos: string;
  presupuesto: string;
  url: string;
  estado: EstadoConvocatoria;
}

const EMPTY_FORM: ConvForm = {
  evento: "",
  titulo: "",
  descripcion: "",
  tipo: "interna",
  entidad: "",
  fecha_apertura: "",
  fecha_cierre: "",
  requisitos: "",
  presupuesto: "",
  url: "",
  estado: "abierta",
};

interface PostularForm {
  semillero: string;
  observaciones: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) => dayjs(d).format("DD MMM YYYY");
const getEstado = (v: string) =>
  ESTADOS_CONV.find((e) => e.value === v) ?? { label: v, color: "#9E9E9E" };
const getTipo = (v: string) =>
  TIPOS_CONV.find((t) => t.value === v) ?? { label: v, color: "#2196F3" };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ConvocatoriasPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { activeRole } = useAuth();

  const canCreate = can("/convocatorias", "crear");
  const canEdit = can("/convocatorias", "editar");
  const canDelete = can("/convocatorias", "eliminar");
  const isDirSemillero = activeRole === "director_semillero";

  // ─── Datos ───────────────────────────────────────────────────────────────
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Filtros ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);

  // ─── Dialogs ─────────────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Convocatoria | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Convocatoria | null>(null);
  const [form, setForm] = useState<ConvForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Postulación ─────────────────────────────────────────────────────────
  const [postularOpen, setPostularOpen] = useState(false);
  const [postularConv, setPostularConv] = useState<Convocatoria | null>(null);
  const [postularForm, setPostularForm] = useState<PostularForm>({
    semillero: "",
    observaciones: "",
  });
  const [postulando, setPostulando] = useState(false);
  const [postularError, setPostularError] = useState<string | null>(null);
  const [postularSuccess, setPostularSuccess] = useState(false);

  // ─── Carga ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterTipo) params.tipo = filterTipo;
      if (filterEstado) params.estado = filterEstado;
      if (search) params.search = search;

      const [convs, evs, sems] = await Promise.allSettled([
        convocatoriasService.list(params),
        eventosService.list(),
        isDirSemillero ? semillerosService.list() : Promise.resolve([]),
      ]);

      setConvocatorias(
        convs.status === "fulfilled" ? convs.value : [],
      );
      setEventos(evs.status === "fulfilled" ? evs.value : []);
      setSemilleros(sems.status === "fulfilled" ? (sems.value as Semillero[]) : []);
    } catch {
      setError("No se pudieron cargar las convocatorias.");
    } finally {
      setLoading(false);
    }
  }, [filterTipo, filterEstado, search, isDirSemillero]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Computed ────────────────────────────────────────────────────────────
  const filtered = convocatorias.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.titulo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      c.evento.nombre.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ─── Validación ──────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.evento) errs.evento = "El evento es requerido.";
    if (!form.titulo.trim()) errs.titulo = "El título es requerido.";
    if (!form.descripcion.trim()) errs.descripcion = "La descripción es requerida.";
    if (!form.fecha_apertura) errs.fecha_apertura = "La fecha de apertura es requerida.";
    if (!form.fecha_cierre) errs.fecha_cierre = "La fecha de cierre es requerida.";
    if (
      form.fecha_apertura &&
      form.fecha_cierre &&
      form.fecha_cierre < form.fecha_apertura
    )
      errs.fecha_cierre = "Debe ser posterior a la fecha de apertura.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (conv: Convocatoria) => {
    setEditing(conv);
    setForm({
      evento: String(conv.evento.id),
      titulo: conv.titulo,
      descripcion: conv.descripcion,
      tipo: conv.tipo,
      entidad: conv.entidad ?? "",
      fecha_apertura: conv.fecha_apertura,
      fecha_cierre: conv.fecha_cierre,
      requisitos: conv.requisitos ?? "",
      presupuesto: conv.presupuesto ?? "",
      url: conv.url ?? "",
      estado: conv.estado,
    });
    setFormErrors({});
    setSaveError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload: ConvocatoriaCreate = {
        evento: Number(form.evento),
        titulo: form.titulo,
        descripcion: form.descripcion,
        tipo: form.tipo,
        entidad: form.entidad || undefined,
        fecha_apertura: form.fecha_apertura,
        fecha_cierre: form.fecha_cierre,
        requisitos: form.requisitos || undefined,
        presupuesto: form.presupuesto ? Number(form.presupuesto) : null,
        url: form.url || undefined,
        estado: form.estado,
      };
      if (editing) {
        await convocatoriasService.update(editing.id, payload);
      } else {
        await convocatoriasService.create(payload);
      }
      setFormOpen(false);
      await load();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: Record<string, string | string[]> };
      };
      if (err?.response?.data) {
        const data = err.response.data;
        const fieldErrs: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setFormErrors(fieldErrs);
        setSaveError("Revisa los campos marcados.");
      } else {
        setSaveError("Error al guardar la convocatoria.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await convocatoriasService.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError("No se pudo eliminar la convocatoria.");
      setDeleting(false);
    } finally {
      setDeleting(false);
    }
  };

  const openPostular = (conv: Convocatoria) => {
    setPostularConv(conv);
    setPostularForm({ semillero: "", observaciones: "" });
    setPostularError(null);
    setPostularSuccess(false);
    setPostularOpen(true);
  };

  const handlePostular = async () => {
    if (!postularConv || !postularForm.semillero) {
      setPostularError("Selecciona un semillero.");
      return;
    }
    setPostulando(true);
    setPostularError(null);
    try {
      await postulacionesService.create({
        convocatoria: postularConv.id,
        semillero: Number(postularForm.semillero),
        estudiantes: [],
        observaciones: postularForm.observaciones || undefined,
      });
      setPostularSuccess(true);
    } catch (e: unknown) {
      const err = e as {
        response?: {
          data?: { detail?: string; non_field_errors?: string[] };
        };
      };
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "No se pudo crear la postulación.";
      setPostularError(msg);
    } finally {
      setPostulando(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Encabezado ── */}
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
          <CampaignOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Convocatorias
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Convocatorias académicas e investigativas abiertas
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
              onClick={handleOpenCreate}
            >
              Nueva Convocatoria
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Filtros ── */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
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
          placeholder="Buscar convocatoria..."
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
          sx={{ minWidth: 240 }}
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
            {TIPOS_CONV.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
            {ESTADOS_CONV.map((e) => (
              <MenuItem key={e.value} value={e.value}>
                {e.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Contenido ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <CampaignOutlined
            sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
          />
          <Typography color="text.secondary" variant="h6">
            No hay convocatorias registradas
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {search || filterTipo || filterEstado
              ? "Intenta con otros filtros de búsqueda."
              : "Las convocatorias aparecerán aquí una vez sean creadas."}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {paginated.map((conv) => {
              const estado = getEstado(conv.estado);
              const tipo = getTipo(conv.tipo);
              const puedePostular =
                isDirSemillero && conv.estado === "abierta";

              return (
                <Grid item xs={12} sm={6} md={4} key={conv.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid",
                      borderColor:
                        conv.estado === "abierta"
                          ? "primary.main" + "55"
                          : "divider",
                      borderRadius: 2,
                      transition: "box-shadow 0.2s, transform 0.15s",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: 4,
                        bgcolor: estado.color,
                        borderRadius: "8px 8px 0 0",
                        flexShrink: 0,
                      }}
                    />

                    <CardContent sx={{ flex: 1, p: 2.5, pb: 1 }}>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        mb={1.5}
                        flexWrap="wrap"
                        useFlexGap
                      >
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
                      </Stack>

                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        gutterBottom
                        sx={{ lineHeight: 1.35 }}
                      >
                        {conv.titulo}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
                      >
                        <EventOutlined sx={{ fontSize: 12 }} />
                        {conv.evento.nombre}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          mb: 2,
                          minHeight: 40,
                        }}
                      >
                        {conv.descripcion}
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        mb={0.5}
                      >
                        <CalendarTodayOutlined
                          sx={{ fontSize: 14, color: "text.disabled" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(conv.fecha_apertura)} →{" "}
                          {fmtDate(conv.fecha_cierre)}
                        </Typography>
                      </Stack>

                      {conv.entidad && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          Entidad: {conv.entidad}
                        </Typography>
                      )}

                      {conv.presupuesto && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          Presupuesto: ${Number(conv.presupuesto).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>

                    <Divider />

                    <CardActions
                      sx={{
                        px: 2,
                        py: 1.25,
                        justifyContent: "flex-end",
                        gap: 0.5,
                      }}
                    >
                      <Tooltip title="Ver detalle">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelected(conv);
                            setDetailOpen(true);
                          }}
                        >
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {puedePostular && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={
                            <SendOutlined sx={{ fontSize: "15px !important" }} />
                          }
                          onClick={() => openPostular(conv)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          Postular
                        </Button>
                      )}

                      {canEdit && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(conv)}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canDelete && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(conv.id)}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

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
            rowsPerPageOptions={[6, 9, 18]}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
            sx={{ mt: 2 }}
          />
        </>
      )}

      {/* ════ Dialog: Detalle ════ */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CampaignOutlined color="primary" />
                <span>{selected.titulo}</span>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={getTipo(selected.tipo).label}
                    size="small"
                    sx={{
                      bgcolor: getTipo(selected.tipo).color + "22",
                      color: getTipo(selected.tipo).color,
                      fontWeight: 600,
                      borderRadius: 1,
                    }}
                  />
                  <Chip
                    label={getEstado(selected.estado).label}
                    size="small"
                    sx={{
                      bgcolor: getEstado(selected.estado).color + "22",
                      color: getEstado(selected.estado).color,
                      fontWeight: 600,
                      borderRadius: 1,
                    }}
                  />
                  <Chip
                    icon={<EventOutlined sx={{ fontSize: "14px !important" }} />}
                    label={selected.evento.nombre}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                </Stack>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Descripción
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.75, whiteSpace: "pre-line" }}
                  >
                    {selected.descripcion}
                  </Typography>
                </Box>

                {selected.requisitos && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Requisitos
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75, whiteSpace: "pre-line" }}
                    >
                      {selected.requisitos}
                    </Typography>
                  </Box>
                )}

                <Divider />

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Fechas de convocatoria
                  </Typography>
                  <Stack direction="row" spacing={4} mt={0.75}>
                    <Box>
                      <Typography variant="caption" color="text.disabled">
                        Apertura
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {fmtDate(selected.fecha_apertura)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.disabled">
                        Cierre
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {fmtDate(selected.fecha_cierre)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {(selected.entidad || selected.presupuesto || selected.url) && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Información adicional
                    </Typography>
                    <Stack spacing={0.75} mt={0.75}>
                      {selected.entidad && (
                        <Typography variant="body2">
                          <strong>Entidad:</strong> {selected.entidad}
                        </Typography>
                      )}
                      {selected.presupuesto && (
                        <Typography variant="body2">
                          <strong>Presupuesto:</strong> $
                          {Number(selected.presupuesto).toLocaleString()}
                        </Typography>
                      )}
                      {selected.url && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LinkOutlined
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Link
                            href={selected.url}
                            target="_blank"
                            rel="noopener"
                            variant="body2"
                          >
                            {selected.url}
                          </Link>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                onClick={() => setDetailOpen(false)}
                color="inherit"
              >
                Cerrar
              </Button>
              {isDirSemillero && selected.estado === "abierta" && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SendOutlined />}
                  onClick={() => {
                    setDetailOpen(false);
                    openPostular(selected);
                  }}
                >
                  Postular
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ════ Dialog: Crear / Editar ════ */}
      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editing ? "Editar Convocatoria" : "Nueva Convocatoria"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            {saveError && <Alert severity="error">{saveError}</Alert>}

            {/* Evento */}
            <FormControl
              fullWidth
              disabled={saving}
              error={!!formErrors.evento}
            >
              <InputLabel>Evento *</InputLabel>
              <Select
                label="Evento *"
                value={form.evento}
                onChange={(e) => setForm({ ...form, evento: e.target.value })}
              >
                {eventos.map((ev) => (
                  <MenuItem key={ev.id} value={String(ev.id)}>
                    {ev.nombre}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.evento && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {formErrors.evento}
                </Typography>
              )}
            </FormControl>

            <TextField
              label="Título *"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              error={!!formErrors.titulo}
              helperText={formErrors.titulo}
              disabled={saving}
              fullWidth
            />

            <TextField
              label="Descripción *"
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              error={!!formErrors.descripcion}
              helperText={formErrors.descripcion}
              disabled={saving}
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ flex: 1, minWidth: 150 }} disabled={saving}>
                <InputLabel>Tipo *</InputLabel>
                <Select
                  label="Tipo *"
                  value={form.tipo}
                  onChange={(e) =>
                    setForm({ ...form, tipo: e.target.value as TipoConvocatoria })
                  }
                >
                  {TIPOS_CONV.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1, minWidth: 150 }} disabled={saving}>
                <InputLabel>Estado</InputLabel>
                <Select
                  label="Estado"
                  value={form.estado}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estado: e.target.value as EstadoConvocatoria,
                    })
                  }
                >
                  {ESTADOS_CONV.map((e) => (
                    <MenuItem key={e.value} value={e.value}>
                      {e.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Fecha de apertura *"
                type="date"
                value={form.fecha_apertura}
                onChange={(e) =>
                  setForm({ ...form, fecha_apertura: e.target.value })
                }
                error={!!formErrors.fecha_apertura}
                helperText={formErrors.fecha_apertura}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 180 }}
              />
              <TextField
                label="Fecha de cierre *"
                type="date"
                value={form.fecha_cierre}
                onChange={(e) =>
                  setForm({ ...form, fecha_cierre: e.target.value })
                }
                error={!!formErrors.fecha_cierre}
                helperText={formErrors.fecha_cierre}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 180 }}
              />
            </Box>

            <TextField
              label="Entidad convocante"
              value={form.entidad}
              onChange={(e) => setForm({ ...form, entidad: e.target.value })}
              disabled={saving}
              fullWidth
              placeholder="Ej: Colciencias, Ministerio de Educación"
            />

            <TextField
              label="Requisitos"
              value={form.requisitos}
              onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
              disabled={saving}
              multiline
              rows={3}
              fullWidth
              placeholder="Requisitos de participación..."
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Presupuesto"
                type="number"
                value={form.presupuesto}
                onChange={(e) =>
                  setForm({ ...form, presupuesto: e.target.value })
                }
                disabled={saving}
                inputProps={{ min: 0 }}
                sx={{ flex: 1, minWidth: 150 }}
              />
              <TextField
                label="URL"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                disabled={saving}
                placeholder="https://..."
                sx={{ flex: 2, minWidth: 200 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setFormOpen(false)}
            disabled={saving}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? "Guardando…" : editing ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ Dialog: Confirmar eliminación ════ */}
      <Dialog
        open={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar convocatoria?</DialogTitle>
        <DialogContent>
          <Typography>
            Esta acción no se puede deshacer. ¿Deseas continuar?
          </Typography>
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

      {/* ════ Dialog: Postulación ════ */}
      <Dialog
        open={postularOpen}
        onClose={() => !postulando && setPostularOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SendOutlined color="success" />
            <span>Nueva Postulación</span>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {postularSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              ¡Postulación creada exitosamente!
            </Alert>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              {postularError && (
                <Alert severity="error">{postularError}</Alert>
              )}

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: isDark ? "grey.900" : "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Convocatoria
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {postularConv?.titulo}
                </Typography>
              </Box>

              <FormControl fullWidth disabled={postulando}>
                <InputLabel>Semillero *</InputLabel>
                <Select
                  label="Semillero *"
                  value={postularForm.semillero}
                  onChange={(e) =>
                    setPostularForm({ ...postularForm, semillero: e.target.value })
                  }
                  startAdornment={
                    <GroupsOutlined sx={{ ml: 1, mr: 0.5, color: "text.secondary", fontSize: 20 }} />
                  }
                >
                  {semilleros.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Observaciones"
                value={postularForm.observaciones}
                onChange={(e) =>
                  setPostularForm({
                    ...postularForm,
                    observaciones: e.target.value,
                  })
                }
                multiline
                rows={3}
                disabled={postulando}
                fullWidth
                placeholder="Información adicional sobre la postulación..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPostularOpen(false)}
            disabled={postulando}
            color="inherit"
          >
            {postularSuccess ? "Cerrar" : "Cancelar"}
          </Button>
          {!postularSuccess && (
            <Button
              variant="contained"
              color="success"
              onClick={handlePostular}
              disabled={postulando}
              startIcon={
                postulando ? <CircularProgress size={16} /> : <SendOutlined />
              }
            >
              {postulando ? "Enviando…" : "Confirmar"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
