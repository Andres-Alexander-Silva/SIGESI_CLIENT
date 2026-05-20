import { useState, useEffect, useCallback, useRef } from "react";
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
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  TablePagination,
  Autocomplete,
  Avatar,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  GroupOutlined,
  UploadFileOutlined,
  PersonOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  WarningAmberOutlined,
  DownloadOutlined,
  CloseOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import {
  inscripcionesService,
  semillerosService,
} from "@/services/core.service";
import { usersService } from "@/services/config.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import { Semillero } from "@/types/core";
import { UserAdmin } from "@/types";
import api from "@/services/api";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────────────────────────────────────

interface Miembro {
  id: number; // ID de la inscripción
  estudiante: number;
  estudiante_nombre: string;
  estudiante_codigo?: string;
  semillero: number;
  semillero_nombre?: string;
  semestre: string;
  estado: "activa" | "inactiva" | "retirado";
  fecha_inscripcion?: string;
  email?: string;
  programa?: string;
}

interface BulkResult {
  creados: number;
  errores: number;
  advertencias: number;
  detalle: { fila: number; mensaje: string; tipo: "ok" | "error" | "warn" }[];
}

const CURRENT_SEMESTER = "2026-1";

// ─────────────────────────────────────────────────────────────────────────────
// Descarga la plantilla real desde el endpoint del swagger
// GET /config/users/bulk-upload/formato/
// ─────────────────────────────────────────────────────────────────────────────
async function downloadTemplate() {
  try {
    await usersService.downloadFormato();
  } catch {
    // Fallback: si el endpoint falla, generar CSV local
    const headers = [
      "Username",
      "Cédula",
      "Nombres",
      "Apellidos",
      "Email Institucional",
      "Correo Personal",
      "Teléfono",
      "Roles",
      "Código",
      "Programa Académico",
    ];
    const example = [
      "jperez",
      "1234567890",
      "Juan",
      "Pérez",
      "jperez@ufps.edu.co",
      "jperez@gmail.com",
      "3001234567",
      "estudiante",
      "123456",
      "1",
    ];
    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_carga_masiva.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function MiembrosPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();

  // ✅ FIX #1: Usar activeRole para determinar el rol actual correctamente
  const { user, activeRole } = useAuth();
  const currentRole = activeRole ?? user?.roles?.[0] ?? "";

  const isStudent = currentRole === "estudiante";
  const isDirector = currentRole === "director_semillero";
  const isAdmin =
    currentRole === "administrador" || currentRole === "director_grupo";

  const canEdit = can("/gestionar_miembros", "editar") || isDirector || isAdmin;
  const canDelete =
    can("/gestionar_miembros", "eliminar") || isDirector || isAdmin;
  const canCreate =
    can("/gestionar_miembros", "crear") || isDirector || isAdmin;

  // ── Estado principal ─────────────────────────────────────────────────────
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [selectedSemillero, setSelectedSemillero] = useState<number | "">("");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [estudiantes, setEstudiantes] = useState<UserAdmin[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSemilleros, setLoadingSemilleros] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Diálogo agregar/editar miembro ───────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMiembro, setEditingMiembro] = useState<Miembro | null>(null);
  const [formEstudiante, setFormEstudiante] = useState<UserAdmin | null>(null);
  const [formSemestre, setFormSemestre] = useState(CURRENT_SEMESTER);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Diálogo eliminar ─────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Diálogo carga masiva ─────────────────────────────────────────────────
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Carga inicial: semilleros y estudiantes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoadingSemilleros(true);
      try {
        const [semData, estudData] = await Promise.all([
          semillerosService.list(),
          usersService.listByRol("estudiante"),
        ]);
        const activeSem = semData.filter((s: Semillero) => s.is_active);
        setSemilleros(activeSem);
        setEstudiantes(estudData);

        // ✅ FIX #2: Si es director, preseleccionar SU semillero (donde él es director)
        if (isDirector && activeSem.length > 0) {
          const miSemillero = activeSem.find(
            (s: Semillero) => s.director === user?.id,
          );
          if (miSemillero) {
            setSelectedSemillero(miSemillero.id);
          } else {
            // fallback: primer semillero activo si no se encuentra coincidencia por id
            setSelectedSemillero(activeSem[0].id);
          }
        }
      } catch {
        setError("Error al cargar semilleros.");
      } finally {
        setLoadingSemilleros(false);
      }
    };
    init();
  }, [isDirector, user?.id]);

  // ─────────────────────────────────────────────────────────────────────────
  // Cargar miembros del semillero seleccionado
  // ─────────────────────────────────────────────────────────────────────────
  const loadMiembros = useCallback(async () => {
    if (!selectedSemillero) {
      setMiembros([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await inscripcionesService.list({
        semillero_id: selectedSemillero as number,
      });
      const list: Miembro[] = Array.isArray(data)
        ? data
        : ((data as any).results ?? []);
      setMiembros(list.filter((m) => m.estado !== "retirado"));
    } catch {
      setError("No se pudieron cargar los miembros del semillero.");
    } finally {
      setLoading(false);
    }
  }, [selectedSemillero]);

  useEffect(() => {
    loadMiembros();
  }, [loadMiembros]);

  useEffect(() => {
    setPage(0);
  }, [search, selectedSemillero]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtrado y paginación
  // ─────────────────────────────────────────────────────────────────────────
  const filtered = miembros.filter((m) =>
    `${m.estudiante_nombre} ${m.estudiante_codigo ?? ""} ${m.semestre}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers UI
  // ─────────────────────────────────────────────────────────────────────────
  const getInitials = (nombre: string) => {
    const parts = nombre.trim().split(" ");
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  };

  const getAvatarColor = (nombre: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.info.main,
      theme.palette.warning.main,
    ];
    let hash = 0;
    for (const c of nombre) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getMiembroEstudiante = (m: Miembro): UserAdmin | undefined =>
    estudiantes.find((e) => e.id === m.estudiante);

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD: Agregar / Editar miembro
  // ─────────────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingMiembro(null);
    setFormEstudiante(null);
    setFormSemestre(CURRENT_SEMESTER);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (m: Miembro) => {
    setEditingMiembro(m);
    const est = estudiantes.find((e) => e.id === m.estudiante) ?? null;
    setFormEstudiante(est);
    setFormSemestre(m.semestre);
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedSemillero) {
      setFormError("Selecciona un semillero.");
      return;
    }
    if (!editingMiembro && !formEstudiante) {
      setFormError("Selecciona un estudiante.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingMiembro) {
        await api.patch(`/core/inscripciones/${editingMiembro.id}/`, {
          semestre: formSemestre,
        });
        setSuccessMsg("Miembro actualizado correctamente.");
      } else {
        await inscripcionesService.create({
          semillero: selectedSemillero as number,
          semestre: formSemestre,
          estudiante: formEstudiante!.id,
        });
        setSuccessMsg("Miembro agregado correctamente.");
      }
      setDialogOpen(false);
      await loadMiembros();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        Object.values(err?.response?.data ?? {})[0] ||
        "Error al guardar. Verifica los datos.";
      setFormError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD: Eliminar (retiro lógico)
  // ─────────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await inscripcionesService.remove(deleteId);
      setSuccessMsg("Miembro retirado del semillero.");
      setDeleteId(null);
      await loadMiembros();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Error al retirar el miembro.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Carga masiva
  // ─────────────────────────────────────────────────────────────────────────
  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const raw = await usersService.bulkUpload(bulkFile);
      const result: BulkResult = {
        creados: raw.creados ?? raw.created ?? 0,
        errores: raw.errores ?? raw.errors ?? 0,
        advertencias: raw.advertencias ?? raw.warnings ?? 0,
        detalle: [],
      };
      if (raw.detalle) result.detalle = raw.detalle;
      else if (raw.errores_detalle) {
        result.detalle = raw.errores_detalle.map((e: any, i: number) => ({
          fila: e.fila ?? i + 2,
          mensaje: e.mensaje ?? e.error ?? String(e),
          tipo: "error" as const,
        }));
      }
      setBulkResult(result);
      if (result.creados > 0) {
        setSuccessMsg(`Se crearon ${result.creados} usuarios correctamente.`);
        await loadMiembros();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Error al procesar el archivo.";
      setBulkResult({
        creados: 0,
        errores: 1,
        advertencias: 0,
        detalle: [{ fila: 0, mensaje: String(msg), tipo: "error" }],
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const closeBulk = () => {
    setBulkOpen(false);
    setBulkFile(null);
    setBulkResult(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const selectedSemilleroData = semilleros.find(
    (s) => s.id === selectedSemillero,
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.secondary.main,
              width: 44,
              height: 44,
            }}
          >
            <GroupOutlined />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              fontFamily='"DM Sans", sans-serif'
            >
              Gestión de Miembros
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rol actual: <strong>{currentRole}</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadMiembros} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {canCreate && (
            <>
              <Button
                variant="outlined"
                startIcon={<UploadFileOutlined />}
                onClick={() => setBulkOpen(true)}
                sx={{ borderRadius: 2, textTransform: "none" }}
                disabled={!selectedSemillero}
              >
                Carga masiva
              </Button>
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={openAdd}
                sx={{ borderRadius: 2, textTransform: "none" }}
                disabled={!selectedSemillero}
              >
                Agregar miembro
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* ── Alertas ───────────────────────────────────────────────────────── */}
      {successMsg && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMsg("")}
        >
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── Selector de semillero ─────────────────────────────────────────── */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1.5 }}
          color="text.secondary"
        >
          Seleccionar Semillero
        </Typography>
        {loadingSemilleros ? (
          <LinearProgress sx={{ borderRadius: 1 }} />
        ) : (
          <Autocomplete
            options={semilleros}
            getOptionLabel={(s) => `${s.nombre} — ${s.codigo}`}
            value={semilleros.find((s) => s.id === selectedSemillero) ?? null}
            onChange={(_, val) => setSelectedSemillero(val?.id ?? "")}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Buscar y seleccionar semillero..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <SchoolOutlined fontSize="small" color="action" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ maxWidth: 500 }}
          />
        )}

        {selectedSemilleroData && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: "flex",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Director
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {selectedSemilleroData.director_nombre || "—"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Grupo de Investigación
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {selectedSemilleroData.grupo_investigacion_nombre || "—"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total miembros
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {miembros.length}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* ── Tabla de miembros ─────────────────────────────────────────────── */}
      {!selectedSemillero ? (
        <Paper
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            py: 8,
            textAlign: "center",
          }}
        >
          <GroupOutlined sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Selecciona un semillero
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Elige un semillero del selector para ver y gestionar sus miembros.
          </Typography>
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <TextField
              size="small"
              placeholder="Buscar miembro por nombre, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", sm: 340 } }}
            />
            <Typography variant="body2" color="text.secondary">
              {filtered.length} miembro{filtered.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          <Paper
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.02)",
                    }}
                  >
                    <TableCell>
                      <strong>Miembro</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Correo</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Código</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Semestre</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Inscripción</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Estado</strong>
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell align="center">
                        <strong>Acciones</strong>
                      </TableCell>
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
                        {search
                          ? "No se encontraron miembros con ese criterio"
                          : "Este semillero aún no tiene miembros registrados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((m) => {
                      const est = getMiembroEstudiante(m);
                      const nombre =
                        m.estudiante_nombre || est
                          ? `${est?.first_name ?? ""} ${est?.last_name ?? ""}`.trim()
                          : m.estudiante_nombre;
                      const displayName =
                        m.estudiante_nombre ||
                        nombre ||
                        `Estudiante #${m.estudiante}`;
                      const email = est?.email || est?.correo_personal || "—";
                      const codigo =
                        m.estudiante_codigo || est?.codigo_estudiantil || "—";

                      return (
                        <TableRow key={m.id} hover>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 34,
                                  height: 34,
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  bgcolor: getAvatarColor(displayName),
                                }}
                              >
                                {getInitials(displayName)}
                              </Avatar>
                              <Typography
                                fontWeight={600}
                                variant="body2"
                                noWrap
                              >
                                {displayName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {email}
                            </Typography>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                          >
                            {codigo}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={m.semestre} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {m.fecha_inscripcion
                                ? new Date(
                                    m.fecha_inscripcion,
                                  ).toLocaleDateString("es-CO")
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                m.estado === "activa"
                                  ? "Activo"
                                  : m.estado === "inactiva"
                                    ? "Inactivo"
                                    : "Retirado"
                              }
                              color={
                                m.estado === "activa"
                                  ? "success"
                                  : m.estado === "inactiva"
                                    ? "default"
                                    : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                          {(canEdit || canDelete) && (
                            <TableCell align="center">
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  justifyContent: "center",
                                }}
                              >
                                {canEdit && (
                                  <Tooltip title="Editar">
                                    <IconButton
                                      size="small"
                                      onClick={() => openEdit(m)}
                                    >
                                      <EditOutlined fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {canDelete && (
                                  <Tooltip title="Retirar del semillero">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setDeleteId(m.id)}
                                    >
                                      <DeleteOutlined fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          )}
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
                setRowsPerPage(+e.target.value);
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DIÁLOGO: Agregar / Editar miembro
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingMiembro ? "Editar Miembro" : "Agregar Miembro"}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            {/* Estudiante (solo al crear) */}
            {!editingMiembro && (
              <Autocomplete
                options={estudiantes}
                getOptionLabel={(e) =>
                  `${e.first_name} ${e.last_name}`.trim() ||
                  e.username ||
                  e.email
                }
                value={formEstudiante}
                onChange={(_, val) => setFormEstudiante(val)}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="body2" fontWeight={600}>
                        {`${option.first_name} ${option.last_name}`.trim() ||
                          option.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email} ·{" "}
                        {option.codigo_estudiantil ?? "Sin código"}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Estudiante *"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonOutlined fontSize="small" color="action" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}

            {/* Si está editando, mostrar nombre del estudiante (solo lectura) */}
            {editingMiembro && (
              <TextField
                label="Estudiante"
                value={editingMiembro.estudiante_nombre}
                size="small"
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {/* Semestre */}
            <TextField
              label="Semestre *"
              value={formSemestre}
              onChange={(e) => setFormSemestre(e.target.value)}
              size="small"
              placeholder="ej: 2026-1"
              helperText="Formato: YYYY-N (ej: 2026-1)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          DIÁLOGO: Confirmar eliminación
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>¿Retirar miembro?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción retirará al miembro del semillero. El registro quedará
            en estado <strong>"retirado"</strong> y podrá ser reactivado si es
            necesario.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading}
            startIcon={
              deleteLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteOutlined />
              )
            }
          >
            {deleteLoading ? "Procesando..." : "Retirar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          DIÁLOGO: Carga masiva
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={bulkOpen} onClose={closeBulk} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <UploadFileOutlined />
            Carga masiva de miembros
          </Box>
          <IconButton size="small" onClick={closeBulk}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Info */}
          <Alert severity="info" sx={{ mb: 2.5 }}>
            Sube un archivo <strong>.xlsx</strong> con los datos de los
            estudiantes. El sistema los registrará como usuarios con rol{" "}
            <strong>estudiante</strong> y los inscribirá al semillero
            seleccionado.
          </Alert>

          {/* Plantilla */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Plantilla Excel
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Descarga la plantilla con los campos requeridos
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlined />}
              onClick={downloadTemplate}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Descargar
            </Button>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Campos requeridos */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Columnas requeridas en el archivo:
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              mb: 2.5,
            }}
          >
            {[
              "Username",
              "Cédula",
              "Nombres",
              "Apellidos",
              "Email Institucional",
              "Correo Personal",
              "Teléfono",
              "Roles",
              "Código",
              "Programa Académico",
            ].map((col) => (
              <Chip key={col} label={col} size="small" variant="outlined" />
            ))}
          </Box>

          {/* Zona de carga */}
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: `2px dashed ${
                bulkFile ? theme.palette.success.main : theme.palette.divider
              }`,
              borderRadius: 3,
              p: 3,
              textAlign: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
              "&:hover": {
                borderColor: theme.palette.primary.main,
                bgcolor: isDark
                  ? "rgba(200,16,46,0.04)"
                  : "rgba(200,16,46,0.02)",
              },
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
            />
            {bulkFile ? (
              <>
                <CheckCircleOutlined
                  sx={{ fontSize: 40, color: "success.main", mb: 1 }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {bulkFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(bulkFile.size / 1024).toFixed(1)} KB — Haz clic para cambiar
                </Typography>
              </>
            ) : (
              <>
                <UploadFileOutlined
                  sx={{ fontSize: 40, color: "text.disabled", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Haz clic para seleccionar el archivo <strong>.xlsx</strong>
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  O arrastra el archivo aquí
                </Typography>
              </>
            )}
          </Box>

          {/* Resultado de la carga */}
          {bulkResult && (
            <Box sx={{ mt: 2.5 }}>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip
                  icon={<CheckCircleOutlined />}
                  label={`${bulkResult.creados} creados`}
                  color="success"
                  variant="outlined"
                />
                {bulkResult.errores > 0 && (
                  <Chip
                    icon={<ErrorOutlined />}
                    label={`${bulkResult.errores} errores`}
                    color="error"
                    variant="outlined"
                  />
                )}
                {bulkResult.advertencias > 0 && (
                  <Chip
                    icon={<WarningAmberOutlined />}
                    label={`${bulkResult.advertencias} advertencias`}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Stack>

              {bulkResult.detalle.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    maxHeight: 200,
                    overflow: "auto",
                    borderRadius: 2,
                  }}
                >
                  <List dense>
                    {bulkResult.detalle.map((d, i) => (
                      <ListItem key={i} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {d.tipo === "ok" ? (
                            <CheckCircleOutlined
                              fontSize="small"
                              color="success"
                            />
                          ) : d.tipo === "error" ? (
                            <ErrorOutlined fontSize="small" color="error" />
                          ) : (
                            <WarningAmberOutlined
                              fontSize="small"
                              color="warning"
                            />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="caption">
                              {d.fila > 0 ? `Fila ${d.fila}: ` : ""}
                              {d.mensaje}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}

          {bulkLoading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Procesando archivo...
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeBulk}>Cerrar</Button>
          <Button
            variant="contained"
            onClick={handleBulkUpload}
            disabled={!bulkFile || bulkLoading}
            startIcon={
              bulkLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <UploadFileOutlined />
              )
            }
          >
            {bulkLoading ? "Cargando..." : "Cargar archivo"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
