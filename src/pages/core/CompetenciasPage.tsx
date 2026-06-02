// src/pages/core/CompetenciasPage.tsx
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
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  PsychologyOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { competenciasService } from "@/services/competencias.service";
import { semillerosService } from "@/services/core.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  CompetenciaInvestigativa,
  CompetenciaInvestigativaCreate,
  NivelCompetencia,
} from "@/types/competencias";
import { Semillero } from "@/types/core";

const NIVELES: { value: NivelCompetencia; label: string; color: string }[] = [
  { value: "basico", label: "Básico", color: "#4CAF50" },
  { value: "intermedio", label: "Intermedio", color: "#2196F3" },
  { value: "avanzado", label: "Avanzado", color: "#9C27B0" },
];

const EMPTY_FORM: CompetenciaInvestigativaCreate = {
  nombre: "",
  descripcion: "",
  nivel: "basico",
  indicadores: "",
  semillero: 0,
  is_active: true,
};

export default function CompetenciasPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { activeRole } = useAuth();

  const isDirector = activeRole === "director_semillero";
  const canCreate = can("/competencias_investigativas", "crear");
  const canEdit = can("/competencias_investigativas", "editar");
  const canDelete = can("/competencias_investigativas", "eliminar");

  const [competencias, setCompetencias] = useState<CompetenciaInvestigativa[]>(
    [],
  );
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterNivel, setFilterNivel] = useState<string>("");
  const [filterSemillero, setFilterSemillero] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog crear/editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompetenciaInvestigativa | null>(null);
  const [form, setForm] = useState<CompetenciaInvestigativaCreate>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dialog eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      if (filterNivel) params.nivel = filterNivel;
      if (filterSemillero) params.semillero = filterSemillero;
      if (search) params.search = search;
      const [comps, seeds] = await Promise.all([
        competenciasService.list(params),
        semillerosService.list(),
      ]);
      setCompetencias(comps);
      setSemilleros(seeds);
    } catch {
      setError("No se pudieron cargar las competencias investigativas.");
    } finally {
      setLoading(false);
    }
  }, [filterNivel, filterSemillero, search]);

  useEffect(() => {
    load();
  }, [load]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombre.trim()) errs.nombre = "El nombre es requerido.";
    if (!form.descripcion.trim())
      errs.descripcion = "La descripción es requerida.";
    if (!form.nivel) errs.nivel = "El nivel es requerido.";
    if (!form.indicadores.trim())
      errs.indicadores = "Los indicadores de logro son requeridos.";
    if (!form.semillero) errs.semillero = "El semillero es requerido.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpen = (comp?: CompetenciaInvestigativa) => {
    if (comp) {
      setEditing(comp);
      setForm({
        nombre: comp.nombre,
        descripcion: comp.descripcion,
        nivel: comp.nivel,
        indicadores: comp.indicadores,
        semillero: comp.semillero.id,
        is_active: comp.is_active,
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
        await competenciasService.update(editing.id, form);
      } else {
        await competenciasService.create(form);
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
        setSaveError("Error al guardar la competencia.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await competenciasService.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError("No se pudo eliminar la competencia.");
    } finally {
      setDeleting(false);
    }
  };

  const getNivel = (val: string) =>
    NIVELES.find((n) => n.value === val) ?? { label: val, color: "#999" };

  const filtered = competencias.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.semillero?.nombre ?? "").toLowerCase().includes(search.toLowerCase()),
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
          <PsychologyOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Competencias Investigativas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configuración de competencias, niveles e indicadores
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
              Nueva Competencia
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
          placeholder="Buscar competencia..."
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
          <InputLabel>Nivel</InputLabel>
          <Select
            label="Nivel"
            value={filterNivel}
            onChange={(e) => {
              setFilterNivel(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {NIVELES.map((n) => (
              <MenuItem key={n.value} value={n.value}>
                {n.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {!isDirector && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Semillero</InputLabel>
            <Select
              label="Semillero"
              value={filterSemillero}
              onChange={(e) => {
                setFilterSemillero(e.target.value as number | "");
                setPage(0);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {semilleros.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.nombre}
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
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nivel</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semillero</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Acciones
                </TableCell>
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
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No hay competencias investigativas registradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((comp) => {
                  const nivel = getNivel(comp.nivel);
                  return (
                    <TableRow
                      key={comp.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {comp.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {comp.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={nivel.label}
                          size="small"
                          sx={{
                            bgcolor: nivel.color + "22",
                            color: nivel.color,
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {comp.semillero?.nombre ??
                            `Semillero #${comp.semillero?.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={comp.is_active ? "Activo" : "Inactivo"}
                          size="small"
                          sx={{
                            bgcolor: comp.is_active ? "#4CAF5022" : "#75757522",
                            color: comp.is_active ? "#4CAF50" : "#757575",
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
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
                                onClick={() => handleOpen(comp)}
                                color="primary"
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => setDeleteId(comp.id)}
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
          {editing ? "Editar Competencia" : "Nueva Competencia"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}

            <TextField
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
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

            <TextField
              label="Indicadores de logro *"
              value={form.indicadores}
              onChange={(e) =>
                setForm({ ...form, indicadores: e.target.value })
              }
              error={!!formErrors.indicadores}
              helperText={
                formErrors.indicadores ??
                "Criterios observables que evidencian el dominio de la competencia."
              }
              disabled={saving}
              multiline
              rows={3}
              fullWidth
            />

            <FormControl fullWidth disabled={saving} error={!!formErrors.nivel}>
              <InputLabel>Nivel *</InputLabel>
              <Select
                label="Nivel *"
                value={form.nivel}
                onChange={(e) =>
                  setForm({ ...form, nivel: e.target.value as NivelCompetencia })
                }
              >
                {NIVELES.map((n) => (
                  <MenuItem key={n.value} value={n.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: n.color,
                          flexShrink: 0,
                        }}
                      />
                      {n.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {formErrors.nivel && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {formErrors.nivel}
                </Typography>
              )}
            </FormControl>

            <Autocomplete
              options={semilleros}
              getOptionLabel={(s) => s.nombre}
              value={semilleros.find((s) => s.id === form.semillero) ?? null}
              onChange={(_, v) =>
                setForm({ ...form, semillero: v?.id ?? 0 })
              }
              disabled={saving}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Semillero *"
                  error={!!formErrors.semillero}
                  helperText={formErrors.semillero}
                />
              )}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active ?? true}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  disabled={saving}
                />
              }
              label="Competencia activa"
            />
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
        <DialogTitle>¿Eliminar competencia?</DialogTitle>
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
