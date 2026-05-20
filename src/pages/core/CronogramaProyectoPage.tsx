import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  LinearProgress,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  CalendarMonthOutlined,
  DownloadOutlined,
  UploadFileOutlined,
  QueryStatsOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { formatApiError } from "@/utils/apiError";
import {
  CronogramaProyecto,
  CronogramaProyectoCreate,
  Proyecto,
  EstadoCronograma,
} from "@/types/core";
import { cronogramaProyectoService } from "@/services/cronogramaProyecto.service";
import { proyectosService } from "@/services/core.service";
import { usePermissions } from "@/context/PermissionsContext";

const EMPTY_FORM: Omit<CronogramaProyectoCreate, "proyecto"> = {
  actividad: "",
  descripcion_actividad: "",
  fecha_inicio: "",
  fecha_fin: "",
  fecha_entrega: "",
  estado_actividad: "pendiente",
  archivo_cronograma: null,
  observaciones: "",
};

const ESTADO_LABELS: Record<EstadoCronograma, string> = {
  pendiente: "Pendiente",
  en_progreso: "En Progreso",
  completada: "Completada",
  cancelada: "Cancelada",
  atrasada: "Atrasada",
};

const ESTADO_COLORS: Record<
  EstadoCronograma,
  "default" | "info" | "success" | "error" | "warning"
> = {
  pendiente: "default",
  en_progreso: "info",
  completada: "success",
  cancelada: "error",
  atrasada: "warning",
};

export default function CronogramaProyectoPage() {
  const theme = useTheme();
  const { can } = usePermissions();

  const canCreate = can("/cronograma", "crear") || true;
  const canEdit = can("/cronograma", "editar") || true;
  const canDelete = can("/cronograma", "eliminar") || true;

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | "">("");

  const [items, setItems] = useState<CronogramaProyecto[]>([]);
  const [cumplimiento, setCumplimiento] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProyectos, setLoadingProyectos] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CronogramaProyecto | null>(null);
  const [form, setForm] = useState<Omit<CronogramaProyectoCreate, "proyecto">>({
    ...EMPTY_FORM,
  });
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cargar proyectos primero
  useEffect(() => {
    proyectosService
      .list()
      .then((data) => {
        setProyectos(data);
        if (data.length > 0) {
          setSelectedProyectoId(data[0].id);
        }
      })
      .catch(() => setError("No se pudieron cargar los proyectos."))
      .finally(() => setLoadingProyectos(false));
  }, []);

  const load = useCallback(async () => {
    if (!selectedProyectoId) {
      setItems([]);
      setCumplimiento(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await cronogramaProyectoService.list({
        proyecto: selectedProyectoId,
        estado_actividad: estadoFiltro || undefined,
      });
      setItems(data);

      const cumpData = await cronogramaProyectoService.porcentajeCumplimiento(
        selectedProyectoId,
      );
      setCumplimiento(cumpData.porcentaje_cumplimiento);
    } catch {
      setError("No se pudieron cargar las actividades del cronograma.");
    } finally {
      setLoading(false);
    }
  }, [selectedProyectoId, estadoFiltro]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [search, estadoFiltro]);

  const filtered = items.filter(
    (i) =>
      i.actividad.toLowerCase().includes(search.toLowerCase()) ||
      i.descripcion_actividad.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFileInput(null);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (i: CronogramaProyecto) => {
    setEditing(i);
    setForm({
      actividad: i.actividad,
      descripcion_actividad: i.descripcion_actividad,
      fecha_inicio: i.fecha_inicio,
      fecha_fin: i.fecha_fin,
      fecha_entrega: i.fecha_entrega,
      estado_actividad: i.estado_actividad,
      observaciones: i.observaciones,
    });
    setFileInput(null);
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!selectedProyectoId) {
      setFormError("Debe seleccionar un proyecto.");
      return;
    }
    if (!form.actividad?.trim()) {
      setFormError("La actividad es obligatoria.");
      return;
    }
    if (!form.fecha_inicio || !form.fecha_fin || !form.fecha_entrega) {
      setFormError("Las fechas de inicio, fin y entrega son obligatorias.");
      return;
    }
    setSaving(true);

    const payload: CronogramaProyectoCreate = {
      proyecto: selectedProyectoId,
      actividad: form.actividad,
      descripcion_actividad: form.descripcion_actividad,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      fecha_entrega: form.fecha_entrega,
      estado_actividad: form.estado_actividad,
      archivo_cronograma: fileInput,
      observaciones: form.observaciones,
    };

    try {
      if (editing) {
        await cronogramaProyectoService.update(editing.id, payload);
        setSuccessMsg("Actividad actualizada correctamente.");
      } else {
        await cronogramaProyectoService.create(payload);
        setSuccessMsg("Actividad creada correctamente.");
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      setFormError(e.response?.data?.detail || formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await cronogramaProyectoService.remove(deleteId);
      setSuccessMsg("Actividad eliminada correctamente.");
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.response?.data?.detail || "No se pudo eliminar la actividad.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
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
            <CalendarMonthOutlined
              sx={{ color: theme.palette.primary.main, fontSize: 28 }}
            />
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            fontFamily='"DM Sans", sans-serif'
          >
            Cronograma de Proyecto
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Recargar">
            <IconButton onClick={load} disabled={loading || !selectedProyectoId}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {selectedProyectoId && canCreate && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={openCreate}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Nueva Actividad
            </Button>
          )}
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Select de proyecto y KPIs de cumplimiento */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 4 }}
      >
        {loadingProyectos ? (
          <CircularProgress size={24} />
        ) : (
          <FormControl size="small" sx={{ minWidth: 320 }}>
            <InputLabel>Proyecto</InputLabel>
            <Select
              label="Proyecto"
              value={selectedProyectoId}
              onChange={(e) => setSelectedProyectoId(Number(e.target.value))}
            >
              {proyectos.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.titulo} ({p.codigo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {cumplimiento !== null && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
              flexGrow: 1,
            }}
          >
            <QueryStatsOutlined color="primary" />
            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Porcentaje de Cumplimiento
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary">
                  {Math.round(cumplimiento)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={cumplimiento}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        )}
      </Stack>

      {selectedProyectoId ? (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <TextField
              size="small"
              placeholder="Buscar actividad o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: "100%", sm: 320 } }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Paper
            sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Actividad</strong></TableCell>
                    <TableCell><strong>Fechas (Inicio / Fin)</strong></TableCell>
                    <TableCell><strong>Fecha Entrega</strong></TableCell>
                    <TableCell align="center"><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Archivo</strong></TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="center"><strong>Acciones</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 6, color: theme.palette.text.disabled }}
                      >
                        No se encontraron actividades de cronograma
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{item.actividad}</Typography>
                          {item.descripcion_actividad && (
                            <Typography variant="caption" color="text.secondary">
                              {item.descripcion_actividad}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.fecha_inicio} al {item.fecha_fin}
                        </TableCell>
                        <TableCell>{item.fecha_entrega}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={ESTADO_LABELS[item.estado_actividad]}
                            color={ESTADO_COLORS[item.estado_actividad]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {item.archivo_cronograma ? (
                            <IconButton
                              component="a"
                              href={item.archivo_cronograma}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <DownloadOutlined />
                            </IconButton>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        {(canEdit || canDelete) && (
                          <TableCell align="center">
                            {canEdit && (
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => openEdit(item)}
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
                                  onClick={() => setDeleteId(item.id)}
                                >
                                  <DeleteOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
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
                setRowsPerPage(+e.target.value);
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
        </>
      ) : (
        <Alert severity="info">
          Por favor seleccione un proyecto para ver su cronograma.
        </Alert>
      )}

      {/* Diálogo Crear / Editar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Editar Actividad" : "Nueva Actividad de Cronograma"}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}
          <TextField
            fullWidth
            label="Actividad *"
            value={form.actividad}
            onChange={(e) =>
              setForm((f) => ({ ...f, actividad: e.target.value }))
            }
            size="small"
            margin="normal"
          />
          <TextField
            fullWidth
            label="Descripción"
            multiline
            rows={3}
            value={form.descripcion_actividad}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion_actividad: e.target.value }))
            }
            size="small"
            margin="normal"
          />
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <TextField
              type="date"
              label="Fecha Inicio *"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.fecha_inicio}
              onChange={(e) =>
                setForm((f) => ({ ...f, fecha_inicio: e.target.value }))
              }
              size="small"
              fullWidth
            />
            <TextField
              type="date"
              label="Fecha Fin *"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.fecha_fin}
              onChange={(e) =>
                setForm((f) => ({ ...f, fecha_fin: e.target.value }))
              }
              size="small"
              fullWidth
            />
          </Stack>
          <TextField
            type="date"
            label="Fecha Entrega Real/Esperada *"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.fecha_entrega}
            onChange={(e) =>
              setForm((f) => ({ ...f, fecha_entrega: e.target.value }))
            }
            size="small"
            fullWidth
            sx={{ mt: 2 }}
          />

          <FormControl size="small" fullWidth sx={{ mt: 2 }}>
            <InputLabel>Estado Actividad</InputLabel>
            <Select
              label="Estado Actividad"
              value={form.estado_actividad}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  estado_actividad: e.target.value as EstadoCronograma,
                }))
              }
            >
              {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Subir archivo */}
          <Box sx={{ mt: 3, p: 2, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Archivo Soporte (Opcional)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileOutlined />}
              size="small"
            >
              Seleccionar archivo
              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFileInput(e.target.files[0]);
                  }
                }}
              />
            </Button>
            {fileInput && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Seleccionado: {fileInput.name}
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth
            label="Observaciones"
            multiline
            rows={2}
            value={form.observaciones}
            onChange={(e) =>
              setForm((f) => ({ ...f, observaciones: e.target.value }))
            }
            size="small"
            margin="normal"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.actividad}
          >
            {saving ? <CircularProgress size={18} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Eliminar */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar actividad del cronograma?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción eliminará permanentemente esta entrada del cronograma.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={18} /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
