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
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PersonOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { usersService } from "@/services/config.service";
import { UserAdmin, UserRole } from "@/types";
import { FaUser, FaUserGraduate } from "react-icons/fa";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "director_grupo", label: "Director de Grupo" },
  { value: "director_semillero", label: "Director de Semillero" },
  { value: "lider_estudiantil", label: "Líder Estudiantil" },
  { value: "estudiante", label: "Estudiante" },
];

const EMPTY_FORM = {
  username: "",
  email: "",
  correo_personal: "",
  password: "",
  first_name: "",
  last_name: "",
  cedula: "",
  codigo_estudiantil: "",
  telefono: "",
  rol: "estudiante" as UserRole,
  is_active: true,
  is_graduated: false,
};

export default function UsersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserAdmin | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await usersService.list());
    } catch {
      setError("No se pudieron cargar los usuarios.");
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

  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.username} ${u.email} ${u.cedula} ${u.rol}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };
  const openEdit = (u: UserAdmin) => {
    setEditing(u);
    setForm({
      username: u.username,
      email: u.email,
      correo_personal: u.correo_personal ?? "",
      password: "",
      first_name: u.first_name,
      last_name: u.last_name,
      cedula: u.cedula,
      codigo_estudiantil: u.codigo_estudiantil ?? "",
      telefono: u.telefono ?? "",
      rol: u.rol,
      is_active: u.is_active,
      is_graduated: u.is_graduated,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const payload: Partial<UserAdmin> = { ...form };
        await usersService.update(editing.id, payload);
      } else {
        await usersService.create({ ...form, password: form.password });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      let msg = "Error al guardar.";
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        // Si es un objeto tipo { campo: ["mensaje"] }
        msg = Object.entries(data)
          .map(([field, errors]) =>
            Array.isArray(errors) ? errors.join(" ") : String(errors),
          )
          .join(" ");
      } else if (typeof data === "string") {
        msg = data;
      }
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try {
      await usersService.remove(deleteId);
      setDeleteId(null);
      load();
    } catch {
      setError("No se pudo eliminar el usuario.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const rolColor = (rol: UserRole) => {
    const map: Record<UserRole, string> = {
      administrador: theme.palette.primary.main,
      director_grupo: theme.palette.secondary.main,
      director_semillero: theme.palette.secondary.light,
      lider_estudiantil: theme.palette.warning.main,
      estudiante: theme.palette.info.main,
    };
    return map[rol] ?? theme.palette.text.secondary;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PersonOutlined
            sx={{ color: theme.palette.primary.main, fontSize: 28 }}
          />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              Usuarios
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.disabled }}
            >
              Gestión de usuarios del sistema
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Recargar">
            <IconButton onClick={load} size="small">
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={openCreate}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Nuevo usuario
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <TextField
        size="small"
        placeholder="Buscar por nombre, email o cédula…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2, width: { xs: "100%", sm: 340 } }}
      />

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.03)",
                }}
              >
                {[
                  "Nombre",
                  "Correos",
                  "Codigo Estudiante",
                  "Cedula",
                  "Rol",
                  "Estado",
                  "Graduado",
                  "Acciones",
                ].map((h) => (
                  <TableCell
                    key={h}
                    align="center"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      color: theme.palette.text.disabled,
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 4, color: theme.palette.text.disabled }}
                  >
                    Sin resultados
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {u.first_name} {u.last_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        @{u.username}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem" }} align="center">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <FaUserGraduate fontSize={11} /> {u.email}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        <FaUser fontSize={11} /> {u.correo_personal}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem" }} align="center">
                      {u.codigo_estudiantil}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.82rem" }} align="center">
                      {u.cedula}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          ROLES.find((r) => r.value === u.rol)?.label ?? u.rol
                        }
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: rolColor(u.rol),
                          bgcolor: `${rolColor(u.rol)}22`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={u.is_active ? "Activo" : "Inactivo"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: u.is_active
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                          bgcolor: u.is_active
                            ? `${theme.palette.success.main}22`
                            : `${theme.palette.error.main}22`,
                          border: `1px solid ${
                            u.is_active
                              ? theme.palette.success.main
                              : theme.palette.error.main
                          }`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={u.is_graduated ? "Sí" : "No"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: u.is_graduated
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                          bgcolor: u.is_graduated
                            ? `${theme.palette.success.main}22` // verde suave
                            : `${theme.palette.error.main}22`, // rojo suave
                          border: `1px solid ${
                            u.is_graduated
                              ? theme.palette.success.main
                              : theme.palette.error.main
                          }`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(u)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(u.id)}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
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
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700 }}
        >
          {editing ? "Editar usuario" : "Nuevo usuario"}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Nombre"
              value={form.first_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_name: e.target.value }))
              }
              size="small"
            />
            <TextField
              label="Apellidos"
              value={form.last_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, last_name: e.target.value }))
              }
              size="small"
            />
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              size="small"
            />
            <TextField
              label="Cédula"
              value={form.cedula}
              onChange={(e) =>
                setForm((f) => ({ ...f, cedula: e.target.value }))
              }
              size="small"
            />
            <TextField
              label="Correo Personal"
              value={form.correo_personal}
              onChange={(e) =>
                setForm((f) => ({ ...f, correo_personal: e.target.value }))
              }
              size="small"
            />
            <TextField
              label="Codigo Estudiantil"
              value={form.codigo_estudiantil}
              onChange={(e) =>
                setForm((f) => ({ ...f, codigo_estudiantil: e.target.value }))
              }
              size="small"
            />
            <TextField
              label="Correo Institucional (@ufps.edu.co)"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              size="small"
              sx={{ gridColumn: "1 / -1" }}
            />
            {!editing && (
              <TextField
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                size="small"
                sx={{ gridColumn: "1 / -1" }}
              />
            )}
            <TextField
              label="Teléfono"
              value={form.telefono}
              onChange={(e) =>
                setForm((f) => ({ ...f, telefono: e.target.value }))
              }
              size="small"
            />
            <FormControl size="small">
              <InputLabel>Rol</InputLabel>
              <Select
                label="Rol"
                value={form.rol}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rol: e.target.value as UserRole }))
                }
              >
                {ROLES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  color="success"
                />
              }
              label="Usuario activo"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_graduated}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_graduated: e.target.checked }))
                  }
                  color="success"
                />
              }
              label="Usuario Graduado"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {saving ? <CircularProgress size={18} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>¿Eliminar usuario?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDeleteId(null)}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {deleteLoading ? <CircularProgress size={18} /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
