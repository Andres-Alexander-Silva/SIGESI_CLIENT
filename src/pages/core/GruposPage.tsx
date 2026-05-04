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
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Autocomplete,
  TablePagination,
  InputAdornment,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  GroupsOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { gruposService } from "@/services/core.service";
import { usersService } from "@/services/config.service";
import { lineasService } from "@/services/core.service";
import { usePermissions } from "@/context/PermissionsContext";
import { formatApiError } from "@/utils/apiError";
import {
  GrupoInvestigacion,
  GrupoInvestigacionCreate,
  LineaInvestigacion,
} from "@/types/core";
import { UserAdmin } from "@/types";

const getToday = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: GrupoInvestigacionCreate = {
  nombre: "",
  codigo: "",
  descripcion: "",
  fecha_creacion: getToday(),
  programa_academico: 1,
  director: null,
  lineas_investigacion: [],
  is_active: true,
};

export default function GruposPage() {
  const theme = useTheme();
  const { can } = usePermissions();

  const canCreate = can("/grupos", "crear");
  const canEdit = can("/grupos", "editar");
  const canDelete = can("/grupos", "eliminar");

  const [grupos, setGrupos] = useState<GrupoInvestigacion[]>([]);
  const [directores, setDirectores] = useState<UserAdmin[]>([]);
  const [lineas, setLineas] = useState<LineaInvestigacion[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GrupoInvestigacion | null>(null);
  const [form, setForm] = useState<GrupoInvestigacionCreate>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [gruposData, directoresData, lineasData] = await Promise.all([
        gruposService.list(),
        usersService.listByRol("director_grupo"),
        lineasService.list(),
      ]);
      setGrupos(gruposData);
      setDirectores(directoresData);
      setLineas(lineasData);
    } catch {
      setError("No se pudieron cargar los grupos de investigación.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filtered = grupos.filter((g) =>
    `${g.nombre} ${g.codigo} ${g.director_nombre || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ====================== CRUD ======================
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (g: GrupoInvestigacion) => {
    setEditing(g);
    setForm({
      nombre: g.nombre,
      codigo: g.codigo,
      descripcion: g.descripcion || "",
      fecha_creacion: g.fecha_creacion,
      programa_academico: g.programa_academico,
      director: g.director ?? null,
      lineas_investigacion: g.lineas_investigacion ?? [],
      is_active: g.is_active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.nombre?.trim() || !form.codigo?.trim()) {
      setFormError("Nombre y código son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await gruposService.update(editing.id, form);
        setSuccessMsg("Grupo actualizado correctamente.");
      } else {
        await gruposService.create(form);
        setSuccessMsg("Grupo creado correctamente.");
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
      await gruposService.remove(deleteId);
      setSuccessMsg("Grupo inactivado correctamente.");
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.response?.data?.detail || "No se pudo inactivar el grupo.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helpers para Autocomplete
  const directorSelected = directores.find((d) => d.id === form.director) ?? null;
  const lineasSelected = lineas.filter((l) =>
    (form.lineas_investigacion ?? []).includes(l.id),
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
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
            <GroupsOutlined
              sx={{ color: theme.palette.primary.main, fontSize: 28 }}
            />
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            fontFamily='"DM Sans", sans-serif'
          >
            Grupos de Investigación
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Recargar">
            <IconButton onClick={load} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={openCreate}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Nuevo Grupo
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
        placeholder="Buscar grupo..."
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
        sx={{ mb: 3, width: { xs: "100%", sm: 350 } }}
      />

      <Paper
        sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell align="center"><strong>Código</strong></TableCell>
                <TableCell><strong>Director</strong></TableCell>
                <TableCell><strong>Líneas</strong></TableCell>
                <TableCell align="center"><strong>Fecha Creación</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                {(canEdit || canDelete) && (
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                )}
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
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 6, color: theme.palette.text.disabled }}
                  >
                    No se encontraron grupos de investigación
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((g) => (
                  <TableRow key={g.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{g.nombre}</Typography>
                      {g.descripcion && (
                        <Typography variant="caption" color="text.secondary">
                          {g.descripcion}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "monospace" }}>
                      {g.codigo}
                    </TableCell>
                    <TableCell>{g.director_nombre || "—"}</TableCell>
                    <TableCell>
                      {g.lineas_investigacion_nombres || "—"}
                    </TableCell>
                    <TableCell align="center">{g.fecha_creacion}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={g.is_active ? "Activo" : "Inactivo"}
                        color={g.is_active ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="center">
                        {canEdit && (
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEdit(g)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Inactivar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteId(g.id)}
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

      {/* Diálogo Crear / Editar */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Editar Grupo" : "Nuevo Grupo de Investigación"}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              pt: 1,
            }}
          >
            <TextField
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              size="small"
              sx={{ gridColumn: "1 / -1" }}
            />
            <TextField
              label="Código *"
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              size="small"
            />
            <TextField
              label="Fecha de Creación *"
              type="date"
              value={form.fecha_creacion}
              onChange={(e) =>
                setForm((f) => ({ ...f, fecha_creacion: e.target.value }))
              }
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              size="small"
              multiline
              rows={3}
              sx={{ gridColumn: "1 / -1" }}
            />

            {/* Director con Autocomplete */}
            <Autocomplete
              options={directores}
              getOptionLabel={(u) =>
                `${u.first_name} ${u.last_name}`.trim() || u.username
              }
              value={directorSelected}
              onChange={(_, val) =>
                setForm((f) => ({ ...f, director: val?.id ?? null }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Director" size="small" />
              )}
              sx={{ gridColumn: "1 / -1" }}
            />

            {/* Líneas con Autocomplete múltiple */}
            <Autocomplete
              multiple
              options={lineas}
              getOptionLabel={(l) => l.nombre}
              value={lineasSelected}
              onChange={(_, val) =>
                setForm((f) => ({
                  ...f,
                  lineas_investigacion: val.map((l) => l.id),
                }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Líneas de Investigación"
                  size="small"
                />
              )}
              sx={{ gridColumn: "1 / -1" }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active ?? true}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  color="success"
                />
              }
              label="Grupo activo"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.nombre || !form.codigo}
          >
            {saving ? <CircularProgress size={18} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Inactivar */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Inactivar grupo?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción cambiará el estado del grupo a inactivo.
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
            {deleteLoading ? <CircularProgress size={18} /> : "Inactivar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
