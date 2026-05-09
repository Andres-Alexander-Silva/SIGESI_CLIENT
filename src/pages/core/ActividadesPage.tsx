// src/pages/core/ActividadesPage.tsx
import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  AssignmentOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { actividadesService } from "@/services/actividades.service";
import { proyectosService } from "@/services/core.service";
import { usersService } from "@/services/config.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Actividad,
  ActividadCreate,
  EstadoActividad,
} from "@/types/actividades";
import { Proyecto } from "@/types/core";
import { UserAdmin } from "@/types";

const ESTADOS: { value: EstadoActividad; label: string; color: string }[] = [
  { value: "pendiente", label: "Pendiente", color: "#FF9800" },
  { value: "en_progreso", label: "En Progreso", color: "#2196F3" },
  { value: "completada", label: "Completada", color: "#4CAF50" },
  { value: "cancelada", label: "Cancelada", color: "#757575" },
];

const EMPTY_FORM: ActividadCreate = {
  titulo: "",
  descripcion: "",
  proyecto: 0,
  responsable: null,
  fecha_inicio: new Date().toISOString().split("T")[0],
  fecha_fin_estimada: null,
  estado: "pendiente",
  is_active: true,
};

export default function ActividadesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { user, activeRole } = useAuth();

  const isStudent =
    activeRole === "estudiante" || activeRole === "lider_estudiantil";
  const canCreate = can("/actividades", "crear");
  const canEdit = can("/actividades", "editar");
  const canDelete = can("/actividades", "eliminar");

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [filterProyecto, setFilterProyecto] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Actividad | null>(null);
  const [form, setForm] = useState<ActividadCreate>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      if (filterEstado) params.estado = filterEstado;
      if (filterProyecto) params.proyecto = filterProyecto;
      if (search) params.search = search;
      const [acts, projs] = await Promise.all([
        actividadesService.list(params),
        proyectosService.list(),
      ]);
      setActividades(acts);
      setProyectos(projs);
    } catch {
      setError("No se pudieron cargar las actividades.");
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterProyecto, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (dialogOpen && !isStudent) {
      usersService
        .list()
        .then(setUsers)
        .catch(() => {});
    }
  }, [dialogOpen, isStudent]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.titulo.trim()) errs.titulo = "El título es requerido.";
    if (!form.descripcion.trim())
      errs.descripcion = "La descripción es requerida.";
    if (!form.proyecto) errs.proyecto = "El proyecto es requerido.";
    if (!form.fecha_inicio)
      errs.fecha_inicio = "La fecha de inicio es requerida.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpen = (act?: Actividad) => {
    if (act) {
      setEditing(act);
      setForm({
        titulo: act.titulo,
        descripcion: act.descripcion,
        proyecto: act.proyecto,
        responsable: act.responsable ?? null,
        fecha_inicio: act.fecha_inicio,
        fecha_fin_estimada: act.fecha_fin_estimada ?? null,
        estado: act.estado,
        is_active: act.is_active,
      });
    } else {
      setEditing(null);
      setForm(EMPTY_FORM);
    }
    setFormErrors({});
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) {
        await actividadesService.update(editing.id, form);
      } else {
        await actividadesService.create(form);
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
        setSaveError("Error al guardar la actividad.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await actividadesService.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError("No se pudo eliminar la actividad.");
    } finally {
      setDeleting(false);
    }
  };

  const getEstado = (val: string) =>
    ESTADOS.find((e) => e.value === val) ?? { label: val, color: "#999" };

  const filtered = actividades.filter(
    (a) =>
      a.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (a.proyecto_nombre ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

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
          <AssignmentOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Actividades
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de actividades por proyecto
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
              Nueva Actividad
            </Button>
          )}
        </Box>
      </Box>

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
          placeholder="Buscar actividad..."
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
            {ESTADOS.map((e) => (
              <MenuItem key={e.value} value={e.value}>
                {e.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {!isStudent && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
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
                <TableCell sx={{ fontWeight: 700 }}>Proyecto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha Inicio</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha Fin</TableCell>
                {!isStudent && (
                  <TableCell sx={{ fontWeight: 700 }}>Responsable</TableCell>
                )}
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
                    <Typography color="text.secondary">
                      No hay actividades registradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((act) => {
                  const estado = getEstado(act.estado);
                  return (
                    <TableRow
                      key={act.id}
                      hover
                      sx={{
                        "&:last-child td": { border: 0 },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {act.titulo}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {act.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {act.proyecto_nombre ?? `Proyecto #${act.proyecto}`}
                        </Typography>
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
                        <Typography variant="body2">
                          {act.fecha_inicio}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {act.fecha_fin_estimada ?? "—"}
                        </Typography>
                      </TableCell>
                      {!isStudent && (
                        <TableCell>
                          <Typography variant="body2">
                            {act.responsable_nombre ?? "—"}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          {canEdit && (
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpen(act)}
                                color="primary"
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete && !isStudent && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => setDeleteId(act.id)}
                                color="error"
                              >
                                <DeleteOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
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

      {/* Dialog Crear / Editar */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editing ? "Editar Actividad" : "Nueva Actividad"}
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

            <Autocomplete
              options={proyectos}
              getOptionLabel={(o) => o.titulo}
              value={proyectos.find((p) => p.id === form.proyecto) ?? null}
              onChange={(_, v) => setForm({ ...form, proyecto: v?.id ?? 0 })}
              disabled={saving}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Proyecto *"
                  error={!!formErrors.proyecto}
                  helperText={formErrors.proyecto}
                />
              )}
            />

            {!isStudent && (
              <Autocomplete
                options={users}
                getOptionLabel={(u) => `${u.first_name} ${u.last_name}`}
                value={users.find((u) => u.id === form.responsable) ?? null}
                onChange={(_, v) =>
                  setForm({ ...form, responsable: v?.id ?? null })
                }
                disabled={saving}
                renderInput={(params) => (
                  <TextField {...params} label="Responsable" />
                )}
              />
            )}

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Fecha Inicio *"
                type="date"
                value={form.fecha_inicio}
                onChange={(e) =>
                  setForm({ ...form, fecha_inicio: e.target.value })
                }
                error={!!formErrors.fecha_inicio}
                helperText={formErrors.fecha_inicio}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Fecha Fin Estimada"
                type="date"
                value={form.fecha_fin_estimada ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fecha_fin_estimada: e.target.value || null,
                  })
                }
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            <FormControl fullWidth disabled={saving}>
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={form.estado}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estado: e.target.value as EstadoActividad,
                  })
                }
              >
                {ESTADOS.map((e) => (
                  <MenuItem key={e.value} value={e.value}>
                    {e.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? "Guardando…" : editing ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar eliminación */}
      <Dialog
        open={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar actividad?</DialogTitle>
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
