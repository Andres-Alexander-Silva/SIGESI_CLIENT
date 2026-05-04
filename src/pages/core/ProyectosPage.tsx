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
  Switch,
  FormControlLabel,
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
  SwapHorizOutlined,
  AssignmentOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { proyectosService, semillerosService, lineasService } from "@/services/core.service";
import { usersService } from "@/services/config.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import { Proyecto, ProyectoCreate, EstadoProyecto, Semillero, LineaInvestigacion } from "@/types/core";
import { UserAdmin } from "@/types";

const ESTADOS: { value: EstadoProyecto; label: string; color: string }[] = [
  { value: "idea", label: "Idea", color: "#E87722" },
  { value: "propuesta", label: "Propuesta", color: "#FF9800" },
  { value: "en_ejecucion", label: "En Ejecución", color: "#C8102E" },
  { value: "en_resultados", label: "En Resultados", color: "#9C27B0" },
  { value: "cerrado", label: "Cerrado", color: "#2D6E3C" },
  { value: "cancelado", label: "Cancelado", color: "#757575" },
];

const EMPTY_FORM: ProyectoCreate = {
  titulo: "",
  codigo: "",
  descripcion: "",
  objetivo_general: "",
  objetivos_especificos: "",
  semilleros: [],
  linea_investigacion: null,
  director: null,
  lider: null,
  estudiantes: [],
  estado: "idea",
  fecha_inicio: null,
  fecha_fin_estimada: null,
  fecha_cierre: null,
  is_active: true,
};

export default function ProyectosPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { user } = useAuth();

  const isStudent = user?.roles?.includes("estudiante");
  const canCreate = can("/proyectos", "crear");
  const canEdit = can("/proyectos", "editar");
  const canDelete = can("/proyectos", "eliminar");
  const canChangeState = can("/proyectos", "aprobar") || !isStudent;

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [semillerosCat, setSemillerosCat] = useState<Semillero[]>([]);
  const [directores, setDirectores] = useState<UserAdmin[]>([]);
  const [lideres, setLideres] = useState<UserAdmin[]>([]);
  const [lineas, setLineas] = useState<LineaInvestigacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<EstadoProyecto | "">("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog Crear/Editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [form, setForm] = useState<ProyectoCreate>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Dialog Cambio de Estado
  const [stateDialog, setStateDialog] = useState(false);
  const [stateTarget, setStateTarget] = useState<Proyecto | null>(null);
  const [newEstado, setNewEstado] = useState<EstadoProyecto>("idea");
  const [stateLoading, setStateLoading] = useState(false);

  // Dialog Eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProyectos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [proyData, semData, directoresData, lideresData, lineasData] =
        await Promise.all([
          proyectosService.list(),
          semillerosService.list(),
          usersService.listByRol("director_semillero"),
          usersService.listByRol("lider_estudiantil"),
          lineasService.list(),
        ]);
      setProyectos(proyData);
      setSemillerosCat(semData);
      setDirectores(directoresData);
      setLideres(lideresData);
      setLineas(lineasData);
    } catch (err: any) {
      setError("No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProyectos();
  }, [loadProyectos]);

  useEffect(() => {
    setPage(0);
  }, [search, filterEstado]);

  const filtered = proyectos.filter((p) => {
    const matchSearch = `${p.titulo} ${p.codigo} ${p.descripcion}`.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filterEstado || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (p: Proyecto) => {
    setEditing(p);
    setForm({
      titulo: p.titulo,
      codigo: p.codigo,
      descripcion: p.descripcion,
      objetivo_general: p.objetivo_general,
      objetivos_especificos: p.objetivos_especificos || "",
      semilleros: p.semilleros,
      linea_investigacion: p.linea_investigacion,
      director: p.director,
      lider: p.lider,
      estudiantes: p.estudiantes || [],
      estado: p.estado,
      fecha_inicio: p.fecha_inicio,
      fecha_fin_estimada: p.fecha_fin_estimada,
      fecha_cierre: p.fecha_cierre,
      is_active: p.is_active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const openChangeState = (p: Proyecto) => {
    setStateTarget(p);
    setNewEstado(p.estado);
    setStateDialog(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.titulo || !form.codigo || !form.descripcion || !form.objetivo_general || form.semilleros.length === 0) {
      setFormError("Título, código, descripción, objetivo general y al menos un semillero son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await proyectosService.update(editing.id, form);
        setSuccessMsg("Proyecto actualizado correctamente.");
      } else {
        await proyectosService.create(form);
        setSuccessMsg("Proyecto creado correctamente.");
      }
      setDialogOpen(false);
      loadProyectos();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Error al guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeState = async () => {
    if (!stateTarget) return;
    setStateLoading(true);
    try {
      await proyectosService.changeState(stateTarget.id, { estado: newEstado });
      setSuccessMsg("Estado del proyecto actualizado.");
      setStateDialog(false);
      loadProyectos();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al cambiar estado.");
    } finally {
      setStateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await proyectosService.remove(deleteId);
      setSuccessMsg("Proyecto inactivado correctamente.");
      setDeleteId(null);
      loadProyectos();
    } catch (err: any) {
      setError(err.response?.data?.detail || "No se pudo inactivar el proyecto.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const estadoChip = (estado: EstadoProyecto) => {
    const est = ESTADOS.find((e) => e.value === estado);
    return (
      <Chip
        label={est?.label || estado}
        size="small"
        sx={{
          bgcolor: `${est?.color}22`,
          color: est?.color,
          fontWeight: 600,
          fontSize: "0.75rem",
        }}
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${theme.palette.primary.main}15` }}>
            <AssignmentOutlined sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} fontFamily='"DM Sans", sans-serif'>
              Proyectos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rol actual: <strong>{user?.roles?.join(", ")}</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadProyectos} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {!isStudent && canCreate && (
            <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate} sx={{ borderRadius: 2, textTransform: "none" }}>
              Nuevo Proyecto
            </Button>
          )}
        </Box>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg("")}>{successMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Buscar proyecto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={filterEstado} label="Estado" onChange={(e) => setFilterEstado(e.target.value as EstadoProyecto | "")}>
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS.map((e) => (
              <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Título</strong></TableCell>
                <TableCell align="center"><strong>Código</strong></TableCell>
                <TableCell><strong>Semillero(s)</strong></TableCell>
                <TableCell><strong>Director</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Fecha Inicio</strong></TableCell>
                {(!isStudent && (canEdit || canDelete || canChangeState)) && (
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={isStudent ? 6 : 7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={isStudent ? 6 : 7} align="center" sx={{ py: 6 }}>No se encontraron proyectos</TableCell></TableRow>
              ) : (
                paginated.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{p.titulo}</Typography>
                      {p.descripcion && <Typography variant="caption" color="text.secondary">{p.descripcion}</Typography>}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "monospace" }}>{p.codigo}</TableCell>
                    <TableCell>{p.semilleros_nombres || "—"}</TableCell>
                    <TableCell>{p.director_nombre || "—"}</TableCell>
                    <TableCell align="center">{estadoChip(p.estado)}</TableCell>
                    <TableCell align="center">{p.fecha_inicio || "—"}</TableCell>

                    {!isStudent && (canEdit || canDelete || canChangeState) && (
                      <TableCell align="center">
                        {canChangeState && (
                          <Tooltip title="Cambiar estado">
                            <IconButton size="small" onClick={() => openChangeState(p)} color="info">
                              <SwapHorizOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canEdit && (
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEdit(p)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Inactivar">
                            <IconButton size="small" color="error" onClick={() => setDeleteId(p.id)}>
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
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Diálogo Crear / Editar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 1 }}>
            <TextField label="Título *" value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} size="small" sx={{ gridColumn: "1 / -1" }} />
            <TextField label="Código *" value={form.codigo} onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))} size="small" />
            <FormControl size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={form.estado} onChange={(e) => setForm(f => ({ ...f, estado: e.target.value as EstadoProyecto }))}>
                {ESTADOS.map(e => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Descripción *" value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} size="small" multiline rows={2} sx={{ gridColumn: "1 / -1" }} />
            <TextField label="Objetivo General *" value={form.objetivo_general} onChange={(e) => setForm(f => ({ ...f, objetivo_general: e.target.value }))} size="small" multiline rows={2} sx={{ gridColumn: "1 / -1" }} />
            <TextField label="Objetivos Específicos" value={form.objetivos_especificos} onChange={(e) => setForm(f => ({ ...f, objetivos_especificos: e.target.value }))} size="small" multiline rows={2} sx={{ gridColumn: "1 / -1" }} />

            <Autocomplete
              multiple
              options={semillerosCat}
              getOptionLabel={(s) => `${s.nombre} (${s.codigo})`}
              value={semillerosCat.filter((s) => form.semilleros.includes(s.id))}
              onChange={(_, val) =>
                setForm((f) => ({ ...f, semilleros: val.map((s) => s.id) }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Semilleros *" size="small" />
              )}
              sx={{ gridColumn: "1 / -1" }}
            />
            <Autocomplete
              options={lineas}
              getOptionLabel={(l) => l.nombre}
              value={lineas.find((l) => l.id === form.linea_investigacion) ?? null}
              onChange={(_, val) =>
                setForm((f) => ({ ...f, linea_investigacion: val?.id ?? null }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Línea de Investigación" size="small" />
              )}
              sx={{ gridColumn: "1 / -1" }}
            />
            <Autocomplete
              options={directores}
              getOptionLabel={(u) =>
                `${u.first_name} ${u.last_name}`.trim() || u.username
              }
              value={directores.find((d) => d.id === form.director) ?? null}
              onChange={(_, val) =>
                setForm((f) => ({ ...f, director: val?.id ?? null }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Director" size="small" />
              )}
            />
            <Autocomplete
              options={lideres}
              getOptionLabel={(u) =>
                `${u.first_name} ${u.last_name}`.trim() || u.username
              }
              value={lideres.find((l) => l.id === form.lider) ?? null}
              onChange={(_, val) =>
                setForm((f) => ({ ...f, lider: val?.id ?? null }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Líder Estudiantil" size="small" />
              )}
            />

            <TextField label="Fecha Inicio" type="date" value={form.fecha_inicio || ""} onChange={(e) => setForm(f => ({ ...f, fecha_inicio: e.target.value || null }))} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Fecha Fin Estimada" type="date" value={form.fecha_fin_estimada || ""} onChange={(e) => setForm(f => ({ ...f, fecha_fin_estimada: e.target.value || null }))} size="small" InputLabelProps={{ shrink: true }} />

            <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} color="success" />} label="Proyecto activo" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Cambio de Estado */}
      <Dialog open={stateDialog} onClose={() => setStateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar Estado del Proyecto</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Proyecto: <strong>{stateTarget?.titulo}</strong></Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Nuevo Estado</InputLabel>
            <Select value={newEstado} onChange={(e) => setNewEstado(e.target.value as EstadoProyecto)}>
              {ESTADOS.map(e => (
                <MenuItem key={e.value} value={e.value}>
                  {e.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStateDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleChangeState} disabled={stateLoading}>
            {stateLoading ? <CircularProgress size={18} /> : "Cambiar Estado"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Eliminar */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Inactivar proyecto?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">El proyecto pasará a estado inactivo.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleteLoading}>
            Inactivar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}