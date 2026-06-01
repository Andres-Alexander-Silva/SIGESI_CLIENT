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
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlaceOutlined,
  RefreshOutlined,
  SearchOutlined,
  SendOutlined,
  VideocamOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import {
  convocatoriasService,
  eventosService,
  participacionesEventoService,
} from "@/services/convocatorias.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Convocatoria,
  EstadoConvocatoria,
  EstadoEvento,
  ModalidadEvento,
  ParticipacionEvento,
  TipoConvocatoria,
  TipoParticipacion,
} from "@/types/convocatorias";

// ─── Constantes visuales ──────────────────────────────────────────────────────

const ESTADOS_CONV: {
  value: EstadoConvocatoria;
  label: string;
  color: string;
}[] = [
  { value: "borrador", label: "Borrador", color: "#9E9E9E" },
  { value: "activa", label: "Activa", color: "#4CAF50" },
  { value: "cerrada", label: "Cerrada", color: "#F44336" },
  { value: "cancelada", label: "Cancelada", color: "#FF9800" },
];

const TIPOS_CONV: { value: TipoConvocatoria; label: string; color: string }[] =
  [
    { value: "interna", label: "Interna", color: "#2196F3" },
    { value: "externa", label: "Externa", color: "#9C27B0" },
  ];

const MODALIDADES: { value: ModalidadEvento; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "hibrida", label: "Híbrida" },
];

const ESTADOS_EVENTO: { value: EstadoEvento; label: string }[] = [
  { value: "programado", label: "Programado" },
  { value: "en_curso", label: "En Curso" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

const TIPOS_PART: { value: TipoParticipacion; label: string }[] = [
  { value: "ponente", label: "Ponente" },
  { value: "asistente", label: "Asistente" },
  { value: "organizador", label: "Organizador" },
  { value: "poster", label: "Póster" },
];

// ─── Tipos internos del formulario ────────────────────────────────────────────

interface ConvForm {
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  modalidad: ModalidadEvento;
  estado_evento: EstadoEvento;
  ubicacion: string;
  enlace_virtual: string;
  tipo: TipoConvocatoria;
  estado: EstadoConvocatoria;
}

const EMPTY_FORM: ConvForm = {
  nombre: "",
  descripcion: "",
  fecha_inicio: "",
  fecha_fin: "",
  modalidad: "presencial",
  estado_evento: "programado",
  ubicacion: "",
  enlace_virtual: "",
  tipo: "interna",
  estado: "borrador",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) => dayjs(d).format("DD MMM YYYY");

const getEstado = (v: string) =>
  ESTADOS_CONV.find((e) => e.value === v) ?? { label: v, color: "#9E9E9E" };

const getTipo = (v: string) =>
  TIPOS_CONV.find((t) => t.value === v) ?? { label: v, color: "#2196F3" };

const getModalidad = (v: string) =>
  MODALIDADES.find((m) => m.value === v)?.label ?? v;

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ConvocatoriasPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { activeRole, user } = useAuth();

  const canCreate = can("/convocatorias", "crear");
  const canEdit = can("/convocatorias", "editar");
  const canDelete = can("/convocatorias", "eliminar");
  const isEstudiante = activeRole === "estudiante";

  // ─── Estado de datos ─────────────────────────────────────────────────────────
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [misParticipaciones, setMisParticipaciones] = useState<
    ParticipacionEvento[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Filtros y paginación ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);

  // ─── Dialog detalle ──────────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Convocatoria | null>(null);

  // ─── Dialog crear / editar ────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Convocatoria | null>(null);
  const [form, setForm] = useState<ConvForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ─── Dialog eliminar ─────────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Dialog postulación ───────────────────────────────────────────────────────
  const [postularOpen, setPostularOpen] = useState(false);
  const [postularConv, setPostularConv] = useState<Convocatoria | null>(null);
  const [tipoParticipacion, setTipoParticipacion] =
    useState<TipoParticipacion>("asistente");
  const [postulando, setPostulando] = useState(false);
  const [postularError, setPostularError] = useState<string | null>(null);
  const [postularSuccess, setPostularSuccess] = useState(false);

  // ─── Carga de datos ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterTipo) params.tipo = filterTipo;
      if (filterEstado) params.estado = filterEstado;
      if (search) params.search = search;

      const [data, participaciones] = await Promise.all([
        convocatoriasService.list(params),
        isEstudiante && user?.id
          ? participacionesEventoService.list({ participante: user.id })
          : Promise.resolve([] as ParticipacionEvento[]),
      ]);

      setConvocatorias(data);
      setMisParticipaciones(participaciones);
    } catch {
      setError("No se pudieron cargar las convocatorias.");
    } finally {
      setLoading(false);
    }
  }, [filterTipo, filterEstado, search, isEstudiante, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Computed ─────────────────────────────────────────────────────────────────
  const filtered = convocatorias.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.evento.nombre.toLowerCase().includes(q) ||
      c.evento.descripcion.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const yaPostulado = (conv: Convocatoria) =>
    misParticipaciones.some((p) => p.evento === conv.evento.id);

  // ─── Validación del formulario ────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre es requerido.";
    if (!form.descripcion.trim())
      errs.descripcion = "La descripción es requerida.";
    if (!form.fecha_inicio)
      errs.fecha_inicio = "La fecha de inicio es requerida.";
    if (!form.fecha_fin) errs.fecha_fin = "La fecha de fin es requerida.";
    if (
      form.fecha_inicio &&
      form.fecha_fin &&
      form.fecha_fin < form.fecha_inicio
    )
      errs.fecha_fin = "Debe ser posterior a la fecha de inicio.";
    if (!form.modalidad) errs.modalidad = "La modalidad es requerida.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Handlers de formulario ───────────────────────────────────────────────────
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
      nombre: conv.evento.nombre,
      descripcion: conv.evento.descripcion,
      fecha_inicio: conv.evento.fecha_inicio,
      fecha_fin: conv.evento.fecha_fin,
      modalidad: conv.evento.modalidad,
      estado_evento: conv.evento.estado,
      ubicacion: conv.evento.ubicacion ?? "",
      enlace_virtual: conv.evento.enlace_virtual ?? "",
      tipo: conv.tipo,
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
      const eventoPayload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        modalidad: form.modalidad,
        estado: form.estado_evento,
        ubicacion: form.ubicacion || undefined,
        enlace_virtual: form.enlace_virtual || null,
      };

      if (editing) {
        await eventosService.update(editing.evento.id, eventoPayload);
        await convocatoriasService.update(editing.id, {
          tipo: form.tipo,
          estado: form.estado,
        });
      } else {
        const newEvento = await eventosService.create(eventoPayload);
        await convocatoriasService.create({
          evento: newEvento.id,
          tipo: form.tipo,
          estado: form.estado,
        });
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

  // ─── Handler de postulación ───────────────────────────────────────────────────
  const handlePostular = async () => {
    if (!postularConv || !user?.id) return;
    setPostulando(true);
    setPostularError(null);
    try {
      await participacionesEventoService.create({
        evento: postularConv.evento.id,
        participante: user.id,
        tipo_participacion: tipoParticipacion,
      });
      setPostularSuccess(true);
      await load();
    } catch (e: unknown) {
      const err = e as {
        response?: {
          data?: { detail?: string; non_field_errors?: string[] };
        };
      };
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "No se pudo completar la postulación.";
      setPostularError(msg);
    } finally {
      setPostulando(false);
    }
  };

  const openPostular = (conv: Convocatoria) => {
    setPostularConv(conv);
    setTipoParticipacion("asistente");
    setPostularError(null);
    setPostularSuccess(false);
    setPostularOpen(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
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
              Gestión y participación en convocatorias académicas e
              investigativas
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
          <CampaignOutlined sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
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
              const postulado = yaPostulado(conv);
              const puedePostular =
                isEstudiante && conv.estado === "activa" && !postulado;

              return (
                <Grid item xs={12} sm={6} md={4} key={conv.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid",
                      borderColor:
                        conv.estado === "activa"
                          ? "primary.main" + "55"
                          : "divider",
                      borderRadius: 2,
                      transition: "box-shadow 0.2s, transform 0.15s",
                      "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
                    }}
                  >
                    {/* Franja de color según estado */}
                    <Box
                      sx={{
                        height: 4,
                        bgcolor: estado.color,
                        borderRadius: "8px 8px 0 0",
                        flexShrink: 0,
                      }}
                    />

                    <CardContent sx={{ flex: 1, p: 2.5, pb: 1 }}>
                      {/* Chips de tipo + estado + postulado */}
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
                        {postulado && (
                          <Chip
                            icon={
                              <CheckCircleOutlined sx={{ fontSize: "14px !important" }} />
                            }
                            label="Postulado"
                            size="small"
                            sx={{
                              bgcolor: "#4CAF5022",
                              color: "#4CAF50",
                              fontWeight: 600,
                              borderRadius: 1,
                            }}
                          />
                        )}
                      </Stack>

                      {/* Nombre del evento */}
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        gutterBottom
                        sx={{ lineHeight: 1.35 }}
                      >
                        {conv.evento.nombre}
                      </Typography>

                      {/* Descripción truncada */}
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
                        {conv.evento.descripcion}
                      </Typography>

                      {/* Fechas */}
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        mb={0.75}
                      >
                        <CalendarTodayOutlined
                          sx={{ fontSize: 14, color: "text.disabled" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(conv.evento.fecha_inicio)} →{" "}
                          {fmtDate(conv.evento.fecha_fin)}
                        </Typography>
                      </Stack>

                      {/* Modalidad y ubicación */}
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                      >
                        {conv.evento.modalidad === "virtual" ? (
                          <VideocamOutlined
                            sx={{ fontSize: 14, color: "text.disabled" }}
                          />
                        ) : (
                          <PlaceOutlined
                            sx={{ fontSize: 14, color: "text.disabled" }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {getModalidad(conv.evento.modalidad)}
                          {conv.evento.ubicacion
                            ? ` · ${conv.evento.ubicacion}`
                            : ""}
                        </Typography>
                      </Stack>
                    </CardContent>

                    <Divider />

                    <CardActions
                      sx={{ px: 2, py: 1.25, justifyContent: "flex-end", gap: 0.5 }}
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
                          startIcon={<SendOutlined sx={{ fontSize: "15px !important" }} />}
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

      {/* ════════════════════════════════════════════════════════════════════════
          Dialog: Detalle de convocatoria
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selected && (() => {
          const e = getEstado(selected.estado);
          const t = getTipo(selected.tipo);
          return (
            <>
              <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CampaignOutlined color="primary" />
                  <span>{selected.evento.nombre}</span>
                </Stack>
              </DialogTitle>

              <DialogContent dividers>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                  {/* Chips de estado y tipo */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={t.label}
                      size="small"
                      sx={{
                        bgcolor: t.color + "22",
                        color: t.color,
                        fontWeight: 600,
                        borderRadius: 1,
                      }}
                    />
                    <Chip
                      label={e.label}
                      size="small"
                      sx={{
                        bgcolor: e.color + "22",
                        color: e.color,
                        fontWeight: 600,
                        borderRadius: 1,
                      }}
                    />
                    <Chip
                      label={getModalidad(selected.evento.modalidad)}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    />
                  </Stack>

                  {/* Descripción / Requisitos */}
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
                      Descripción / Requisitos
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75, whiteSpace: "pre-line" }}
                    >
                      {selected.evento.descripcion}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Fechas */}
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
                      Fechas
                    </Typography>
                    <Stack direction="row" spacing={4} mt={0.75}>
                      <Box>
                        <Typography variant="caption" color="text.disabled">
                          Inicio
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {fmtDate(selected.evento.fecha_inicio)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.disabled">
                          Fin
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {fmtDate(selected.evento.fecha_fin)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Ubicación / Enlace */}
                  {(selected.evento.ubicacion ||
                    selected.evento.enlace_virtual) && (
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
                        {selected.evento.modalidad === "virtual"
                          ? "Enlace virtual"
                          : "Ubicación"}
                      </Typography>
                      {selected.evento.ubicacion && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          mt={0.75}
                        >
                          <PlaceOutlined
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            {selected.evento.ubicacion}
                          </Typography>
                        </Stack>
                      )}
                      {selected.evento.enlace_virtual && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          mt={0.75}
                        >
                          <VideocamOutlined
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ wordBreak: "break-all" }}
                          >
                            {selected.evento.enlace_virtual}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  )}

                  {/* Estado postulación del estudiante */}
                  {isEstudiante && yaPostulado(selected) && (
                    <Alert
                      severity="success"
                      icon={<CheckCircleOutlined fontSize="inherit" />}
                    >
                      Ya te has postulado a esta convocatoria.
                    </Alert>
                  )}

                  {isEstudiante &&
                    selected.estado === "cerrada" &&
                    !yaPostulado(selected) && (
                      <Alert severity="warning">
                        Esta convocatoria ya está cerrada y no acepta nuevas
                        postulaciones.
                      </Alert>
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
                {isEstudiante &&
                  selected.estado === "activa" &&
                  !yaPostulado(selected) && (
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
          );
        })()}
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════
          Dialog: Crear / Editar convocatoria
      ════════════════════════════════════════════════════════════════════════ */}
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}

            {/* Sección: Evento */}
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Información del Evento
            </Typography>

            <TextField
              label="Nombre del evento *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
              disabled={saving}
              fullWidth
            />

            <TextField
              label="Descripción / Requisitos *"
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              error={!!formErrors.descripcion}
              helperText={formErrors.descripcion}
              disabled={saving}
              multiline
              rows={4}
              fullWidth
              placeholder="Detalla los objetivos, requisitos de participación, documentos necesarios..."
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Fecha de inicio *"
                type="date"
                value={form.fecha_inicio}
                onChange={(e) =>
                  setForm({ ...form, fecha_inicio: e.target.value })
                }
                error={!!formErrors.fecha_inicio}
                helperText={formErrors.fecha_inicio}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 180 }}
              />
              <TextField
                label="Fecha de fin *"
                type="date"
                value={form.fecha_fin}
                onChange={(e) =>
                  setForm({ ...form, fecha_fin: e.target.value })
                }
                error={!!formErrors.fecha_fin}
                helperText={formErrors.fecha_fin}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 180 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl
                sx={{ flex: 1, minWidth: 160 }}
                disabled={saving}
                error={!!formErrors.modalidad}
              >
                <InputLabel>Modalidad *</InputLabel>
                <Select
                  label="Modalidad *"
                  value={form.modalidad}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      modalidad: e.target.value as ModalidadEvento,
                    })
                  }
                >
                  {MODALIDADES.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1, minWidth: 160 }} disabled={saving}>
                <InputLabel>Estado del evento</InputLabel>
                <Select
                  label="Estado del evento"
                  value={form.estado_evento}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estado_evento: e.target.value as EstadoEvento,
                    })
                  }
                >
                  {ESTADOS_EVENTO.map((e) => (
                    <MenuItem key={e.value} value={e.value}>
                      {e.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Ubicación"
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              disabled={saving}
              placeholder="Ej: Auditorio principal, Sala 201"
              fullWidth
            />

            {(form.modalidad === "virtual" || form.modalidad === "hibrida") && (
              <TextField
                label="Enlace virtual"
                value={form.enlace_virtual}
                onChange={(e) =>
                  setForm({ ...form, enlace_virtual: e.target.value })
                }
                disabled={saving}
                placeholder="https://meet.google.com/..."
                fullWidth
              />
            )}

            <Divider sx={{ my: 0.5 }} />

            {/* Sección: Convocatoria */}
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Configuración de la Convocatoria
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ flex: 1, minWidth: 160 }} disabled={saving}>
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: t.color,
                            flexShrink: 0,
                          }}
                        />
                        {t.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1, minWidth: 160 }} disabled={saving}>
                <InputLabel>Estado *</InputLabel>
                <Select
                  label="Estado *"
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: e.color,
                            flexShrink: 0,
                          }}
                        />
                        {e.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

      {/* ════════════════════════════════════════════════════════════════════════
          Dialog: Confirmar eliminación
      ════════════════════════════════════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════════════════════════════════════
          Dialog: Formulario de postulación
      ════════════════════════════════════════════════════════════════════════ */}
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
            <span>Postulación a Convocatoria</span>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {postularSuccess ? (
            <Alert
              severity="success"
              icon={<CheckCircleOutlined fontSize="inherit" />}
              sx={{ mt: 1 }}
            >
              ¡Postulación enviada con éxito! Tu solicitud ha sido registrada.
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
                  {postularConv?.evento.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {postularConv &&
                    `${fmtDate(postularConv.evento.fecha_inicio)} → ${fmtDate(postularConv.evento.fecha_fin)}`}
                </Typography>
              </Box>

              <FormControl fullWidth disabled={postulando}>
                <InputLabel>Tipo de participación *</InputLabel>
                <Select
                  label="Tipo de participación *"
                  value={tipoParticipacion}
                  onChange={(e) =>
                    setTipoParticipacion(e.target.value as TipoParticipacion)
                  }
                >
                  {TIPOS_PART.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="caption" color="text.secondary">
                Al confirmar, tu postulación quedará registrada en el sistema y
                será procesada por los administradores.
              </Typography>
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
                postulando ? (
                  <CircularProgress size={16} />
                ) : (
                  <SendOutlined />
                )
              }
            >
              {postulando ? "Enviando…" : "Confirmar Postulación"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
