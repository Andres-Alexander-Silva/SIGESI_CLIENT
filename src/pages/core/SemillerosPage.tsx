// src/pages/core/SemillerosPage.tsx
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
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  TablePagination,
  Autocomplete,
  MenuItem,
  Divider,
  Stack,
  Link,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  ScienceOutlined,
  PersonAddOutlined,
  LogoutOutlined,
  VerifiedOutlined,
  OpenInNewOutlined,
  UploadFileOutlined,
  CheckCircleOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import {
  semillerosService,
  inscripcionesService,
  gruposService,
  lineasService,
} from "@/services/core.service";
import { usersService } from "@/services/config.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Semillero,
  SemilleroCreate,
  SemilleroAval,
  EstadoAval,
  GrupoInvestigacion,
  LineaInvestigacion,
} from "@/types/core";
import { UserAdmin } from "@/types";

const CURRENT_SEMESTER = "2026-1";

const EMPTY_FORM: SemilleroCreate = {
  nombre: "",
  codigo: "",
  objetivo: "",
  mision: "",
  vision: "",
  fecha_creacion: new Date().toISOString().split("T")[0],
  grupo_investigacion: 0,
  director: 0,
  lider_estudiantil: null,
  lineas_investigacion: [],
  is_active: true,
};

const EMPTY_AVAL_FORM: SemilleroAval = {
  estado_aval: "sin_aprobar",
  tipo_documento: "acta",
  numero_acta: "",
  observaciones: "",
};

const ESTADO_AVAL_LABELS: Record<EstadoAval, string> = {
  sin_aprobar: "Sin Aprobar",
  en_proceso: "En Proceso",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

const ESTADO_AVAL_COLORS: Record<
  EstadoAval,
  "default" | "warning" | "success" | "error"
> = {
  sin_aprobar: "default",
  en_proceso: "warning",
  aprobado: "success",
  rechazado: "error",
};

export default function SemillerosPage() {
  const theme = useTheme();
  const { can } = usePermissions();
  const { user } = useAuth();

  const isStudent = user?.roles?.includes("estudiante");
  const isAdmin = user?.roles?.includes("administrador");
  const canCreate = can("/semilleros", "crear");
  const canEdit = can("/semilleros", "editar");
  const canDelete = can("/semilleros", "eliminar");

  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [grupos, setGrupos] = useState<GrupoInvestigacion[]>([]);
  const [directores, setDirectores] = useState<UserAdmin[]>([]);
  const [lideres, setLideres] = useState<UserAdmin[]>([]);
  const [lineas, setLineas] = useState<LineaInvestigacion[]>([]);
  const [inscripciones, setInscripciones] = useState<Record<number, boolean>>(
    {},
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Diálogo Crear / Editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Semillero | null>(null);
  const [form, setForm] = useState<SemilleroCreate>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Diálogo Eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Diálogo Aval
  const [avalDialogOpen, setAvalDialogOpen] = useState(false);
  const [avalSemillero, setAvalSemillero] = useState<Semillero | null>(null);
  const [avalForm, setAvalForm] = useState<SemilleroAval>({
    ...EMPTY_AVAL_FORM,
  });
  const [avalFile, setAvalFile] = useState<File | null>(null);
  const avalFileRef = useRef<HTMLInputElement>(null);
  const [avalSaving, setAvalSaving] = useState(false);
  const [avalError, setAvalError] = useState("");

  const loadSemilleros = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [semData, gruposData, directoresData, lideresData, lineasData] =
        await Promise.all([
          semillerosService.list(),
          gruposService.list(),
          usersService.listByRol("director_semillero"),
          usersService.listByRol("lider_estudiantil"),
          lineasService.list(),
        ]);
      setSemilleros(semData);
      setGrupos(gruposData);
      setDirectores(directoresData);
      setLideres(lideresData);
      setLineas(lineasData);

      if (isStudent) {
        try {
          const inscData = await inscripcionesService.list();
          const inscMap: Record<number, boolean> = {};
          inscData.forEach((insc: any) => {
            if (insc.semillero) inscMap[insc.semillero] = true;
          });
          setInscripciones(inscMap);
        } catch {
          setInscripciones({});
        }
      }
    } catch {
      setError("No se pudieron cargar los semilleros.");
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  useEffect(() => {
    loadSemilleros();
  }, [loadSemilleros]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filtered = semilleros.filter((s) =>
    `${s.nombre} ${s.codigo} ${s.grupo_investigacion_nombre || ""} ${s.director_nombre || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const isInscrito = (semilleroId: number) => !!inscripciones[semilleroId];

  // ====================== INSCRIPCIÓN ======================
  const handleToggleInscripcion = async (semilleroId: number) => {
    const actualmenteInscrito = isInscrito(semilleroId);
    try {
      if (!actualmenteInscrito) {
        await inscripcionesService.create({
          semillero: semilleroId,
          semestre: CURRENT_SEMESTER,
        });
        setSuccessMsg("¡Inscripción realizada correctamente!");
        setInscripciones((prev) => ({ ...prev, [semilleroId]: true }));
      } else {
        await inscripcionesService.remove(semilleroId);
        setSuccessMsg("Has salido del semillero.");
        setInscripciones((prev) => {
          const newMap = { ...prev };
          delete newMap[semilleroId];
          return newMap;
        });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Error al procesar la inscripción.",
      );
    }
  };

  // ====================== CRUD SEMILLERO ======================
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (s: Semillero) => {
    setEditing(s);
    setForm({
      nombre: s.nombre,
      codigo: s.codigo,
      objetivo: s.objetivo,
      mision: s.mision ?? "",
      vision: s.vision ?? "",
      fecha_creacion: s.fecha_creacion,
      grupo_investigacion: s.grupo_investigacion,
      director: s.director ?? 0,
      lider_estudiantil: s.lider_estudiantil ?? null,
      lineas_investigacion: s.lineas_investigacion ?? [],
      is_active: s.is_active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (
      !form.nombre?.trim() ||
      !form.codigo?.trim() ||
      !form.objetivo?.trim()
    ) {
      setFormError("Nombre, código y objetivo son obligatorios.");
      return;
    }
    if (!form.grupo_investigacion || !form.director) {
      setFormError("Grupo de investigación y Director son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await semillerosService.update(editing.id, form);
        setSuccessMsg("Semillero actualizado correctamente.");
      } else {
        await semillerosService.create(form);
        setSuccessMsg("Semillero creado correctamente.");
      }
      setDialogOpen(false);
      loadSemilleros();
    } catch (err: any) {
      setFormError(
        err.response?.data?.detail || "Error al guardar el semillero.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await semillerosService.remove(deleteId);
      setSuccessMsg("Semillero inactivado correctamente.");
      setDeleteId(null);
      loadSemilleros();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "No se pudo inactivar el semillero.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ====================== AVAL ======================
  const openAval = (s: Semillero) => {
    setAvalSemillero(s);
    setAvalForm({
      estado_aval: s.estado_aval ?? "sin_aprobar",
      tipo_documento: s.tipo_documento ?? "acta",
      numero_acta: s.numero_acta ?? "",
      observaciones: s.observaciones ?? "",
    });
    setAvalFile(null);
    setAvalError("");
    setAvalDialogOpen(true);
  };

  const handleSaveAval = async () => {
    if (!avalSemillero) return;
    setAvalError("");

    const payload: SemilleroAval = {
      estado_aval: avalForm.estado_aval,
      tipo_documento: avalForm.tipo_documento ?? "acta",
      numero_acta: avalForm.numero_acta,
      observaciones: avalForm.observaciones,
    };

    setAvalSaving(true);
    try {
      await semillerosService.updateAval(
        avalSemillero.id,
        payload,
        avalFile ?? undefined,
      );
      setSuccessMsg("Aval actualizado correctamente.");
      setAvalDialogOpen(false);
      loadSemilleros();
    } catch (err: any) {
      setAvalError(
        err.response?.data?.detail || "Error al actualizar el aval.",
      );
    } finally {
      setAvalSaving(false);
    }
  };

  // ====================== RENDER ======================
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
            <ScienceOutlined
              sx={{ color: theme.palette.primary.main, fontSize: 28 }}
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              fontFamily='"DM Sans", sans-serif'
            >
              Semilleros
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rol actual: <strong>{user?.roles?.join(", ")}</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadSemilleros} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {!isStudent && (canCreate || isAdmin) && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={openCreate}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Nuevo Semillero
            </Button>
          )}
        </Box>
      </Box>

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

      <TextField
        size="small"
        placeholder="Buscar semillero..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined />
            </InputAdornment>
          ),
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
                <TableCell>
                  <strong>Nombre</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Código</strong>
                </TableCell>
                <TableCell>
                  <strong>Grupo</strong>
                </TableCell>
                <TableCell>
                  <strong>Director</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Fecha Creación</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Aval</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Estado</strong>
                </TableCell>
                {isStudent && (
                  <TableCell align="center">
                    <strong>Inscripción</strong>
                  </TableCell>
                )}
                {!isStudent && (canEdit || canDelete || isAdmin) && (
                  <TableCell align="center">
                    <strong>Acciones</strong>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 6, color: theme.palette.text.disabled }}
                  >
                    No se encontraron semilleros
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{s.nombre}</Typography>
                      {s.lineas_investigacion_nombres && (
                        <Typography variant="caption" color="text.secondary">
                          {s.lineas_investigacion_nombres}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: "monospace" }}>
                      {s.codigo}
                    </TableCell>
                    <TableCell>{s.grupo_investigacion_nombre || "—"}</TableCell>
                    <TableCell>{s.director_nombre || "—"}</TableCell>
                    <TableCell align="center">{s.fecha_creacion}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          ESTADO_AVAL_LABELS[s.estado_aval ?? "sin_aprobar"]
                        }
                        color={
                          ESTADO_AVAL_COLORS[s.estado_aval ?? "sin_aprobar"]
                        }
                        size="small"
                        variant={
                          s.estado_aval === "aprobado" ? "filled" : "outlined"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={s.is_active ? "Activo" : "Inactivo"}
                        color={s.is_active ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>

                    {isStudent && (
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant={isInscrito(s.id) ? "outlined" : "contained"}
                          color={isInscrito(s.id) ? "error" : "primary"}
                          startIcon={
                            isInscrito(s.id) ? (
                              <LogoutOutlined />
                            ) : (
                              <PersonAddOutlined />
                            )
                          }
                          onClick={() => handleToggleInscripcion(s.id)}
                        >
                          {isInscrito(s.id) ? "Salir" : "Inscribirse"}
                        </Button>
                      </TableCell>
                    )}

                    {!isStudent && (canEdit || canDelete || isAdmin) && (
                      <TableCell align="center">
                        {(canEdit || isAdmin) && (
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(s)}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isAdmin && (
                          <Tooltip title="Gestionar Aval">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openAval(s)}
                            >
                              <VerifiedOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(canDelete || isAdmin) && (
                          <Tooltip title="Inactivar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteId(s.id)}
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

      {/* ==================== DIÁLOGO CREAR / EDITAR ==================== */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Editar Semillero" : "Nuevo Semillero"}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              pt: 2,
            }}
          >
            <TextField
              label="Nombre *"
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              size="small"
              sx={{ gridColumn: "1 / -1" }}
            />
            <TextField
              label="Código *"
              value={form.codigo}
              onChange={(e) =>
                setForm((f) => ({ ...f, codigo: e.target.value }))
              }
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
              label="Objetivo *"
              value={form.objetivo}
              onChange={(e) =>
                setForm((f) => ({ ...f, objetivo: e.target.value }))
              }
              size="small"
              multiline
              rows={3}
              sx={{ gridColumn: "1 / -1" }}
            />
            <TextField
              label="Misión"
              value={form.mision}
              onChange={(e) =>
                setForm((f) => ({ ...f, mision: e.target.value }))
              }
              size="small"
              multiline
              rows={2}
            />
            <TextField
              label="Visión"
              value={form.vision}
              onChange={(e) =>
                setForm((f) => ({ ...f, vision: e.target.value }))
              }
              size="small"
              multiline
              rows={2}
            />
            <Autocomplete
              options={grupos}
              getOptionLabel={(g) => `${g.nombre} (${g.codigo})`}
              value={
                grupos.find((g) => g.id === form.grupo_investigacion) ?? null
              }
              onChange={(_, val) =>
                setForm((f) => ({ ...f, grupo_investigacion: val?.id ?? 0 }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Grupo de Investigación *"
                  size="small"
                />
              )}
            />
            <Autocomplete
              options={directores}
              getOptionLabel={(u) =>
                `${u.first_name} ${u.last_name}`.trim() || u.username
              }
              value={directores.find((d) => d.id === form.director) ?? null}
              onChange={(_, val) =>
                setForm((f) => ({ ...f, director: val?.id ?? 0 }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Director *" size="small" />
              )}
            />
            <Autocomplete
              options={lideres}
              getOptionLabel={(u) =>
                `${u.first_name} ${u.last_name}`.trim() || u.username
              }
              value={
                lideres.find((l) => l.id === form.lider_estudiantil) ?? null
              }
              onChange={(_, val) =>
                setForm((f) => ({ ...f, lider_estudiantil: val?.id ?? null }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Líder Estudiantil" size="small" />
              )}
              sx={{ gridColumn: "1 / -1" }}
            />
            <Autocomplete
              multiple
              options={lineas}
              getOptionLabel={(l) => l.nombre}
              value={lineas.filter((l) =>
                (form.lineas_investigacion ?? []).includes(l.id),
              )}
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
              label="Semillero activo"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== DIÁLOGO GESTIÓN AVAL ==================== */}
      <Dialog
        open={avalDialogOpen}
        onClose={() => setAvalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <VerifiedOutlined color="primary" />
          Gestionar Aval Institucional
        </DialogTitle>
        <DialogContent dividers>
          {avalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {avalError}
            </Alert>
          )}

          {avalSemillero && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Semillero:{" "}
              <strong>
                {avalSemillero.nombre} ({avalSemillero.codigo})
              </strong>
            </Typography>
          )}

          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Estado del Aval *"
              value={avalForm.estado_aval ?? "sin_aprobar"}
              onChange={(e) =>
                setAvalForm((f) => ({
                  ...f,
                  estado_aval: e.target.value as EstadoAval,
                }))
              }
              size="small"
              fullWidth
            >
              {(Object.keys(ESTADO_AVAL_LABELS) as EstadoAval[]).map((key) => (
                <MenuItem key={key} value={key}>
                  {ESTADO_AVAL_LABELS[key]}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Número de Acta"
              value={avalForm.numero_acta ?? ""}
              onChange={(e) =>
                setAvalForm((f) => ({ ...f, numero_acta: e.target.value }))
              }
              size="small"
              fullWidth
              placeholder="Ej: ACTA-2026-001"
            />

            {/* Subir archivo del aval */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                Archivo del aval (PDF, imagen)
              </Typography>
              <input
                ref={avalFileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                style={{ display: "none" }}
                onChange={(e) => setAvalFile(e.target.files?.[0] ?? null)}
              />
              <Box
                onClick={() => avalFileRef.current?.click()}
                sx={{
                  border: `2px dashed`,
                  borderColor: avalFile ? "success.main" : "divider",
                  borderRadius: 2,
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                {avalFile ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <CheckCircleOutlined color="success" fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>
                      {avalFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({(avalFile.size / 1024).toFixed(1)} KB)
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <UploadFileOutlined fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Haz clic para subir el documento
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <TextField
              label="Observaciones"
              value={avalForm.observaciones ?? ""}
              onChange={(e) =>
                setAvalForm((f) => ({ ...f, observaciones: e.target.value }))
              }
              size="small"
              fullWidth
              multiline
              rows={3}
              placeholder="Notas o comentarios sobre el aval..."
            />

            {/* Info readOnly: quién aprobó, fecha y enlace al archivo */}
            {(avalSemillero?.usuario_aprobacion_nombre ||
              avalSemillero?.archivo_aval) && <Divider />}

            {avalSemillero?.usuario_aprobacion_nombre && (
              <Alert severity="info" icon={<VerifiedOutlined />}>
                Aprobado por{" "}
                <strong>{avalSemillero.usuario_aprobacion_nombre}</strong>
                {avalSemillero.fecha_aprobacion && (
                  <> el {avalSemillero.fecha_aprobacion}</>
                )}
              </Alert>
            )}

            {avalSemillero?.archivo_aval && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Archivo del aval:
                </Typography>
                <br />
                <Link
                  href={avalSemillero.archivo_aval}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  Ver documento <OpenInNewOutlined fontSize="inherit" />
                </Link>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAvalDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveAval}
            disabled={avalSaving}
            startIcon={
              avalSaving ? <CircularProgress size={16} /> : <VerifiedOutlined />
            }
          >
            {avalSaving ? "Guardando..." : "Actualizar Aval"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================== DIÁLOGO ELIMINAR ==================== */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Inactivar semillero?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción cambiará el estado a inactivo.
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
