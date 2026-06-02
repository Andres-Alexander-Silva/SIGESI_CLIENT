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
  Rating,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  RateReviewOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { formatApiError } from "@/utils/apiError";
import {
  EvaluacionProyecto,
  EvaluacionProyectoCreate,
  Proyecto,
  EstadoProyecto,
} from "@/types/core";
import { evaluacionProyectoService } from "@/services/evaluacionProyecto.service";
import { proyectosService } from "@/services/core.service";
import { usePermissions } from "@/context/PermissionsContext";

const EMPTY_FORM: EvaluacionProyectoCreate = {
  proyecto: 0,
  calificacion: 3.0,
  estado_proyecto: "en_ejecucion",
  observaciones: "",
  recomendaciones: "",
};

const ESTADO_PROYECTO_LABEL: Record<EstadoProyecto, string> = {
  idea: "Idea",
  propuesta: "Propuesta",
  en_ejecucion: "En ejecución",
  en_resultados: "En resultados",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

const ESTADO_COLORS: Record<
  EstadoProyecto,
  "default" | "warning" | "info" | "success" | "error" | "primary"
> = {
  idea: "default",
  propuesta: "warning",
  en_ejecucion: "info",
  en_resultados: "primary",
  cerrado: "success",
  cancelado: "error",
};

export default function EvaluacionesProyectoPage() {
  const theme = useTheme();
  const { can } = usePermissions();

  const canCreate = can("/evaluaciones-proyecto", "crear") || true;
  const canEdit = can("/evaluaciones-proyecto", "editar") || true;
  const canDelete = can("/evaluaciones-proyecto", "eliminar") || true;

  const [evaluaciones, setEvaluaciones] = useState<EvaluacionProyecto[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EvaluacionProyecto | null>(null);
  const [form, setForm] = useState<EvaluacionProyectoCreate>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await evaluacionProyectoService.list({
        search: search || undefined,
      });
      setEvaluaciones(data);

      const projs = await proyectosService.list();
      setProyectos(projs);
    } catch {
      setError("No se pudieron cargar las evaluaciones académicas.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const paginated = evaluaciones.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, proyecto: proyectos[0]?.id || 0 });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (e: EvaluacionProyecto) => {
    setEditing(e);
    setForm({
      proyecto: e.proyecto,
      calificacion: Number(e.calificacion),
      estado_proyecto: e.estado_proyecto,
      observaciones: e.observaciones,
      recomendaciones: e.recomendaciones || "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.proyecto) {
      setFormError("El proyecto es obligatorio.");
      return;
    }
    if (form.calificacion < 0.0 || form.calificacion > 5.0) {
      setFormError("La calificación debe estar entre 0.0 y 5.0.");
      return;
    }
    if (!form.observaciones?.trim() || form.observaciones.trim().length < 10) {
      setFormError("Las observaciones son requeridas y deben tener al menos 10 caracteres.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await evaluacionProyectoService.update(editing.id, form);
        setSuccessMsg("Evaluación actualizada correctamente.");
      } else {
        await evaluacionProyectoService.create(form);
        setSuccessMsg("Evaluación creada correctamente.");
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
      await evaluacionProyectoService.remove(deleteId);
      setSuccessMsg("Evaluación eliminada correctamente.");
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.response?.data?.detail || "No se pudo eliminar la evaluación.");
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
            <RateReviewOutlined
              sx={{ color: theme.palette.primary.main, fontSize: 28 }}
            />
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            fontFamily='"DM Sans", sans-serif'
          >
            Evaluación de Proyectos
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Recargar">
            <IconButton onClick={load} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {canCreate && proyectos.length > 0 && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={openCreate}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Nueva Evaluación
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

      <TextField
        size="small"
        placeholder="Buscar por observaciones, recomendaciones..."
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
        sx={{ mb: 3, width: { xs: "100%", sm: 380 } }}
      />

      <Paper
        sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Proyecto</strong></TableCell>
                <TableCell><strong>Evaluador</strong></TableCell>
                <TableCell align="center"><strong>Calificación</strong></TableCell>
                <TableCell align="center"><strong>Estado Académico</strong></TableCell>
                <TableCell><strong>Observaciones</strong></TableCell>
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
                    No se encontraron evaluaciones de proyectos
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((ev) => (
                  <TableRow key={ev.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {ev.proyecto_titulo || `Proyecto ID: ${ev.proyecto}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {ev.evaluador_nombre || `Evaluador ID: ${ev.evaluador}`}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                        <Rating
                          value={Number(ev.calificacion)}
                          precision={0.1}
                          max={5}
                          readOnly
                          size="small"
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {ev.calificacion}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={ESTADO_PROYECTO_LABEL[ev.estado_proyecto]}
                        color={ESTADO_COLORS[ev.estado_proyecto]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {ev.observaciones}
                      </Typography>
                      {ev.recomendaciones && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Recomendaciones: {ev.recomendaciones}
                        </Typography>
                      )}
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="center">
                        {canEdit && (
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEdit(ev)}>
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
          count={evaluaciones.length}
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

      {/* Diálogo Crear / Editar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Editar Evaluación" : "Nueva Evaluación de Proyecto"}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}

          <FormControl size="small" fullWidth margin="normal" disabled={!!editing}>
            <InputLabel>Proyecto</InputLabel>
            <Select
              label="Proyecto"
              value={form.proyecto}
              onChange={(e) => setForm((f) => ({ ...f, proyecto: Number(e.target.value) }))}
            >
              {proyectos.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.titulo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Calificación (0.0 a 5.0)
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Rating
                value={form.calificacion}
                precision={0.1}
                max={5}
                onChange={(_, val) => setForm((f) => ({ ...f, calificacion: val || 0.0 }))}
              />
              <TextField
                type="number"
                value={form.calificacion}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    calificacion: Math.min(5.0, Math.max(0.0, Number(e.target.value))),
                  }))
                }
                size="small"
                slotProps={{ htmlInput: { min: 0.0, max: 5.0, step: 0.1 } }}
                sx={{ width: 80 }}
              />
            </Stack>
          </Box>

          <FormControl size="small" fullWidth margin="normal">
            <InputLabel>Estado Recomendado</InputLabel>
            <Select
              label="Estado Recomendado"
              value={form.estado_proyecto}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  estado_proyecto: e.target.value as EstadoProyecto,
                }))
              }
            >
              {Object.entries(ESTADO_PROYECTO_LABEL).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Observaciones *"
            multiline
            rows={4}
            value={form.observaciones}
            onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
            size="small"
            margin="normal"
            helperText="Mínimo 10 caracteres"
          />

          <TextField
            fullWidth
            label="Recomendaciones"
            multiline
            rows={2}
            value={form.recomendaciones}
            onChange={(e) => setForm((f) => ({ ...f, recomendaciones: e.target.value }))}
            size="small"
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.proyecto || form.observaciones.length < 10}
          >
            {saving ? <CircularProgress size={18} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Eliminar */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar evaluación?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción eliminará la evaluación del proyecto de forma permanente.
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
