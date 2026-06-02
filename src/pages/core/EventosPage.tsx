// src/pages/core/EventosPage.tsx
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
  DeleteOutlined,
  EditOutlined,
  EventOutlined,
  PlaceOutlined,
  RefreshOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { eventosService } from "@/services/convocatorias.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Evento,
  EventoCreate,
  EstadoEvento,
  ModalidadEvento,
} from "@/types/convocatorias";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS_EVENTO: { value: EstadoEvento; label: string; color: string }[] = [
  { value: "activo", label: "Activo", color: "#4CAF50" },
  { value: "finalizado", label: "Finalizado", color: "#9E9E9E" },
  { value: "cancelado", label: "Cancelado", color: "#F44336" },
];

const MODALIDADES: { value: ModalidadEvento; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "hibrido", label: "Híbrido" },
];

interface EventoForm {
  nombre: string;
  descripcion: string;
  modalidad: ModalidadEvento;
  lugar: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoEvento;
}

const EMPTY_FORM: EventoForm = {
  nombre: "",
  descripcion: "",
  modalidad: "presencial",
  lugar: "",
  fecha_inicio: "",
  fecha_fin: "",
  estado: "activo",
};

const fmtDate = (d: string | null) => (d ? dayjs(d).format("DD MMM YYYY") : "—");
const getEstado = (v: string) =>
  ESTADOS_EVENTO.find((e) => e.value === v) ?? { label: v, color: "#9E9E9E" };
const getModalidad = (v: string) =>
  MODALIDADES.find((m) => m.value === v)?.label ?? v;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EventosPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { activeRole } = useAuth();

  const canCreate =
    can("/eventos", "crear") ||
    activeRole === "administrador" ||
    activeRole === "director_grupo";
  const canEdit =
    can("/eventos", "editar") ||
    activeRole === "administrador" ||
    activeRole === "director_grupo";
  const canDelete =
    can("/eventos", "eliminar") ||
    activeRole === "administrador" ||
    activeRole === "director_grupo";

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterModalidad, setFilterModalidad] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Evento | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [form, setForm] = useState<EventoForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterModalidad) params.modalidad = filterModalidad;
      if (filterEstado) params.estado = filterEstado;
      if (search) params.search = search;
      const data = await eventosService.list(params);
      setEventos(data);
    } catch {
      setError("No se pudieron cargar los eventos.");
    } finally {
      setLoading(false);
    }
  }, [filterModalidad, filterEstado, search]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = eventos.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(q) ||
      (e.descripcion ?? "").toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre es requerido.";
    if (!form.fecha_inicio) errs.fecha_inicio = "La fecha de inicio es requerida.";
    if (
      form.fecha_inicio &&
      form.fecha_fin &&
      form.fecha_fin < form.fecha_inicio
    )
      errs.fecha_fin = "Debe ser posterior a la fecha de inicio.";
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

  const handleOpenEdit = (ev: Evento) => {
    setEditing(ev);
    setForm({
      nombre: ev.nombre,
      descripcion: ev.descripcion ?? "",
      modalidad: ev.modalidad,
      lugar: ev.lugar ?? "",
      fecha_inicio: ev.fecha_inicio,
      fecha_fin: ev.fecha_fin ?? "",
      estado: ev.estado,
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
      const payload: EventoCreate = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        modalidad: form.modalidad,
        lugar: form.lugar || undefined,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || undefined,
        estado: form.estado,
      };
      if (editing) {
        await eventosService.update(editing.id, payload);
      } else {
        await eventosService.create(payload);
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
        setSaveError("Error al guardar el evento.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await eventosService.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError("No se pudo eliminar el evento.");
    } finally {
      setDeleting(false);
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
          <EventOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Eventos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de eventos académicos e investigativos
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
              Nuevo Evento
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
          placeholder="Buscar evento..."
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
          <InputLabel>Modalidad</InputLabel>
          <Select
            label="Modalidad"
            value={filterModalidad}
            onChange={(e) => {
              setFilterModalidad(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todas</MenuItem>
            {MODALIDADES.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
            {ESTADOS_EVENTO.map((e) => (
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
          <EventOutlined sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography color="text.secondary" variant="h6">
            No hay eventos registrados
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {search || filterModalidad || filterEstado
              ? "Intenta con otros filtros."
              : "Los eventos aparecerán aquí una vez sean creados."}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {paginated.map((ev) => {
              const estado = getEstado(ev.estado);
              return (
                <Grid item xs={12} sm={6} md={4} key={ev.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid",
                      borderColor:
                        ev.estado === "activo"
                          ? "primary.main" + "55"
                          : "divider",
                      borderRadius: 2,
                      transition: "box-shadow 0.2s, transform 0.15s",
                      "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
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
                          label={estado.label}
                          size="small"
                          sx={{
                            bgcolor: estado.color + "22",
                            color: estado.color,
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                        />
                        <Chip
                          label={getModalidad(ev.modalidad)}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </Stack>

                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        gutterBottom
                        sx={{ lineHeight: 1.35 }}
                      >
                        {ev.nombre}
                      </Typography>

                      {ev.descripcion && (
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
                          {ev.descripcion}
                        </Typography>
                      )}

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
                          {fmtDate(ev.fecha_inicio)}
                          {ev.fecha_fin && ` → ${fmtDate(ev.fecha_fin)}`}
                        </Typography>
                      </Stack>

                      {ev.lugar && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                        >
                          <PlaceOutlined
                            sx={{ fontSize: 14, color: "text.disabled" }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {ev.lugar}
                          </Typography>
                        </Stack>
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
                            setSelected(ev);
                            setDetailOpen(true);
                          }}
                        >
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(ev)}
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
                            onClick={() => setDeleteId(ev.id)}
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
                <EventOutlined color="primary" />
                <span>{selected.nombre}</span>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                    label={getModalidad(selected.modalidad)}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                </Stack>

                {selected.descripcion && (
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
                    Fechas
                  </Typography>
                  <Stack direction="row" spacing={4} mt={0.75}>
                    <Box>
                      <Typography variant="caption" color="text.disabled">
                        Inicio
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {fmtDate(selected.fecha_inicio)}
                      </Typography>
                    </Box>
                    {selected.fecha_fin && (
                      <Box>
                        <Typography variant="caption" color="text.disabled">
                          Fin
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {fmtDate(selected.fecha_fin)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {selected.lugar && (
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
                      Lugar
                    </Typography>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      mt={0.75}
                    >
                      <PlaceOutlined
                        sx={{ fontSize: 16, color: "text.secondary" }}
                      />
                      <Typography variant="body2">{selected.lugar}</Typography>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setDetailOpen(false)} color="inherit">
                Cerrar
              </Button>
              {canEdit && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setDetailOpen(false);
                    handleOpenEdit(selected);
                  }}
                >
                  Editar
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
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editing ? "Editar Evento" : "Nuevo Evento"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}

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
              label="Descripción"
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              disabled={saving}
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ flex: 1, minWidth: 150 }} disabled={saving}>
                <InputLabel>Modalidad</InputLabel>
                <Select
                  label="Modalidad"
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
              <FormControl sx={{ flex: 1, minWidth: 150 }} disabled={saving}>
                <InputLabel>Estado</InputLabel>
                <Select
                  label="Estado"
                  value={form.estado}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estado: e.target.value as EstadoEvento,
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
              label="Lugar"
              value={form.lugar}
              onChange={(e) => setForm({ ...form, lugar: e.target.value })}
              disabled={saving}
              placeholder="Ej: Auditorio principal, Sala 201"
              fullWidth
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
                label="Fecha de fin"
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
        <DialogTitle>¿Eliminar evento?</DialogTitle>
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
    </Box>
  );
}
