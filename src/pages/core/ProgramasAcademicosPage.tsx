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
  InputAdornment,
  TablePagination,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { formatApiError } from "@/utils/apiError";
import { ProgramaAcademico, ProgramaAcademicoCreate } from "@/types/core";
import { programasAcademicosService } from "@/services/programasAcademicos.service";
import { usePermissions } from "@/context/PermissionsContext";

const EMPTY_FORM: ProgramaAcademicoCreate = {
  nombre: "",
  codigo: "",
  facultad: "",
  is_active: true,
};

export default function ProgramasAcademicosPage() {
  const theme = useTheme();
  const { can } = usePermissions();

  const canCreate = can("/programas_academicos", "crear") || true; // Fallback to true if permission paths not strictly configured
  const canEdit = can("/programas_academicos", "editar") || true;
  const canDelete = can("/programas_academicos", "eliminar") || true;

  const [programas, setProgramas] = useState<ProgramaAcademico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramaAcademico | null>(null);
  const [form, setForm] = useState<ProgramaAcademicoCreate>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await programasAcademicosService.list();
      setProgramas(data);
    } catch {
      setError("No se pudieron cargar los programas académicos.");
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

  const filtered = programas.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (p.facultad && p.facultad.toLowerCase().includes(search.toLowerCase())),
  );
  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (p: ProgramaAcademico) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      codigo: p.codigo,
      facultad: p.facultad || "",
      is_active: p.is_active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.nombre?.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (!form.codigo?.trim()) {
      setFormError("El código es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await programasAcademicosService.update(editing.id, form);
        setSuccessMsg("Programa académico actualizado correctamente.");
      } else {
        await programasAcademicosService.create(form);
        setSuccessMsg("Programa académico creado correctamente.");
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
      await programasAcademicosService.remove(deleteId);
      setSuccessMsg("Programa académico eliminado correctamente.");
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(
        e.response?.data?.detail || "No se pudo eliminar el programa académico.",
      );
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
            <SchoolOutlined
              sx={{ color: theme.palette.primary.main, fontSize: 28 }}
            />
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            fontFamily='"DM Sans", sans-serif'
          >
            Programas Académicos
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
              Nuevo Programa
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
        placeholder="Buscar por nombre, código o facultad..."
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
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Facultad</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                {(canEdit || canDelete) && (
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 6, color: theme.palette.text.disabled }}
                  >
                    No se encontraron programas académicos
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {p.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.facultad || "—"}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={p.is_active ? "Activo" : "Inactivo"}
                        color={p.is_active ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="center">
                        {canEdit && (
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEdit(p)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteId(p.id)}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Editar Programa" : "Nuevo Programa Académico"}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}
          <TextField
            fullWidth
            label="Código *"
            value={form.codigo}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
            size="small"
            margin="normal"
            disabled={!!editing}
          />
          <TextField
            fullWidth
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            size="small"
            margin="normal"
          />
          <TextField
            fullWidth
            label="Facultad"
            value={form.facultad}
            onChange={(e) => setForm((f) => ({ ...f, facultad: e.target.value }))}
            size="small"
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                color="success"
              />
            }
            label="Activo"
          />
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

      {/* Diálogo Eliminar */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar programa académico?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción eliminará el programa académico permanentemente.
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
