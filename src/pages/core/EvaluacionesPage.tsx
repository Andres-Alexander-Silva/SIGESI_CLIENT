// src/pages/core/EvaluacionesPage.tsx
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
  Divider,
} from "@mui/material";
import {
  AddOutlined,
  DeleteOutlined,
  SearchOutlined,
  RefreshOutlined,
  GradingOutlined,
  StarOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { evaluacionesService } from "@/services/evaluaciones.service";
import { competenciasService } from "@/services/competencias.service";
import { usersService } from "@/services/config.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Evaluacion,
  EvaluacionCreate,
  EvaluacionCalificar,
  TipoEvaluacion,
  NivelAlcanzado,
} from "@/types/evaluaciones";
import { CompetenciaInvestigativa } from "@/types/competencias";
import { UserAdmin } from "@/types";

// ─── Constantes visuales ─────────────────────────────────────────────────────

const TIPOS: { value: TipoEvaluacion; label: string; color: string }[] = [
  { value: "autoevaluacion", label: "Autoevaluación", color: "#2196F3" },
  { value: "heteroevaluacion", label: "Heteroevaluación", color: "#FF9800" },
];

const NIVELES: { value: NivelAlcanzado; label: string; color: string }[] = [
  { value: "basico", label: "Básico", color: "#4CAF50" },
  { value: "intermedio", label: "Intermedio", color: "#2196F3" },
  { value: "avanzado", label: "Avanzado", color: "#9C27B0" },
];

function getSemestresOptions(): string[] {
  const year = new Date().getFullYear();
  return [
    `${year - 1}-1`,
    `${year - 1}-2`,
    `${year}-1`,
    `${year}-2`,
    `${year + 1}-1`,
  ];
}

const EMPTY_FORM: EvaluacionCreate = {
  estudiante: 0,
  competencia: 0,
  tipo: "autoevaluacion",
  evaluador: null,
  semestre: `${new Date().getFullYear()}-1`,
};

const EMPTY_CALIFICAR: EvaluacionCalificar = {
  puntaje: 0,
  nivel_alcanzado: "basico",
  observaciones: "",
};

// ─── Componente ──────────────────────────────────────────────────────────────

export default function EvaluacionesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { user, activeRole } = useAuth();

  const isStudent = activeRole === "estudiante";
  const isDirector = activeRole === "director_semillero";

  const canCreate = can("/evaluaciones_investigativas", "crear");
  const canCalificar = can("/evaluaciones_investigativas", "actualizar");
  const canDelete = can("/evaluaciones_investigativas", "eliminar");

  // ── Datos principales ──────────────────────────────────────────────────────
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [competencias, setCompetencias] = useState<CompetenciaInvestigativa[]>(
    [],
  );
  const [estudiantes, setEstudiantes] = useState<UserAdmin[]>([]);
  const [evaluadores, setEvaluadores] = useState<UserAdmin[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterSemestre, setFilterSemestre] = useState("");
  const [filterCompetencia, setFilterCompetencia] = useState<number | "">("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Dialog crear ───────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EvaluacionCreate>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Dialog calificar ───────────────────────────────────────────────────────
  const [calificarTarget, setCalificarTarget] = useState<Evaluacion | null>(
    null,
  );
  const [calForm, setCalForm] = useState<EvaluacionCalificar>(EMPTY_CALIFICAR);
  const [calErrors, setCalErrors] = useState<Record<string, string>>({});
  const [calSaving, setCalSaving] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);

  // ── Dialog eliminar ────────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      if (filterTipo) params.tipo = filterTipo;
      if (filterSemestre) params.semestre = filterSemestre;
      if (filterCompetencia) params.competencia = filterCompetencia;
      if (search) params.search = search;
      if (isStudent && user?.id) params.estudiante = user.id;

      const [evals, comps] = await Promise.all([
        evaluacionesService.list(params),
        competenciasService.list(),
      ]);
      setEvaluaciones(evals);
      setCompetencias(comps);
    } catch {
      setError("No se pudieron cargar las evaluaciones.");
    } finally {
      setLoading(false);
    }
  }, [filterTipo, filterSemestre, filterCompetencia, search, isStudent, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Cargar usuarios cuando abre el dialog de crear (solo para director)
  useEffect(() => {
    if (dialogOpen && isDirector) {
      Promise.all([
        usersService.listByRol("estudiante"),
        usersService.list(),
      ])
        .then(([ests, todos]) => {
          setEstudiantes(ests);
          setEvaluadores(
            todos.filter(
              (u) =>
                u.rol === "director_semillero" ||
                u.rol === "director_grupo" ||
                u.rol === "administrador",
            ),
          );
        })
        .catch(() => {});
    }
  }, [dialogOpen, isDirector]);

  // ── Handlers crear ─────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    const defaultForm: EvaluacionCreate = {
      ...EMPTY_FORM,
      tipo: isStudent ? "autoevaluacion" : "autoevaluacion",
      estudiante: isStudent && user?.id ? user.id : 0,
    };
    setForm(defaultForm);
    setFormErrors({});
    setSaveError(null);
    setDialogOpen(true);
  };

  const validateCreate = () => {
    const errs: Record<string, string> = {};
    if (!form.estudiante) errs.estudiante = "El estudiante es requerido.";
    if (!form.competencia) errs.competencia = "La competencia es requerida.";
    if (!form.semestre.trim()) errs.semestre = "El semestre es requerido.";
    if (form.tipo === "heteroevaluacion" && !form.evaluador)
      errs.evaluador = "El evaluador es requerido para heteroevaluación.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateCreate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await evaluacionesService.create(form);
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
        setSaveError("Error al crear la evaluación.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Handlers calificar ─────────────────────────────────────────────────────
  const handleOpenCalificar = (ev: Evaluacion) => {
    setCalificarTarget(ev);
    setCalForm({
      puntaje: ev.puntaje ?? 0,
      nivel_alcanzado: ev.nivel_alcanzado ?? "basico",
      observaciones: ev.observaciones ?? "",
    });
    setCalErrors({});
    setCalError(null);
  };

  const validateCalificar = () => {
    const errs: Record<string, string> = {};
    if (calForm.puntaje < 0 || calForm.puntaje > 100)
      errs.puntaje = "El puntaje debe estar entre 0 y 100.";
    if (!calForm.nivel_alcanzado)
      errs.nivel_alcanzado = "El nivel es requerido.";
    setCalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCalificar = async () => {
    if (!calificarTarget || !validateCalificar()) return;
    setCalSaving(true);
    setCalError(null);
    try {
      await evaluacionesService.calificar(calificarTarget.id, calForm);
      setCalificarTarget(null);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, string[]> } };
      if (err?.response?.data) {
        const data = err.response.data;
        const fieldErrs: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setCalErrors(fieldErrs);
        setCalError("Revisa los campos marcados.");
      } else {
        setCalError("Error al calificar la evaluación.");
      }
    } finally {
      setCalSaving(false);
    }
  };

  // ── Handler eliminar ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await evaluacionesService.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError("No se pudo eliminar la evaluación.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getTipo = (val: string) =>
    TIPOS.find((t) => t.value === val) ?? { label: val, color: "#999" };

  const getNivel = (val: string | null) => {
    if (!val) return null;
    return NIVELES.find((n) => n.value === val) ?? { label: val, color: "#999" };
  };

  const canCalificarEval = (ev: Evaluacion) =>
    canCalificar && (isDirector || ev.evaluador === user?.id);

  const filtered = evaluaciones.filter(
    (e) =>
      (e.estudiante_nombre ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (e.competencia_nombre ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (e.evaluador_nombre ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ── Render ─────────────────────────────────────────────────────────────────
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
          <GradingOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Evaluaciones Investigativas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Autoevaluación, heteroevaluación y calificación por competencias
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
              onClick={handleOpenCreate}
            >
              Nueva Evaluación
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
          placeholder="Buscar evaluación..."
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
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            label="Tipo"
            value={filterTipo}
            onChange={(e) => {
              setFilterTipo(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {TIPOS.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Semestre</InputLabel>
          <Select
            label="Semestre"
            value={filterSemestre}
            onChange={(e) => {
              setFilterSemestre(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {getSemestresOptions().map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {!isStudent && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Competencia</InputLabel>
            <Select
              label="Competencia"
              value={filterCompetencia}
              onChange={(e) => {
                setFilterCompetencia(e.target.value as number | "");
                setPage(0);
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {competencias.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
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
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Competencia</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Evaluador</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semestre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Puntaje</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nivel</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Acciones
                </TableCell>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No hay evaluaciones registradas.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((ev) => {
                  const tipo = getTipo(ev.tipo);
                  const nivel = getNivel(ev.nivel_alcanzado);
                  return (
                    <TableRow
                      key={ev.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>
                        <Chip
                          label={tipo.label}
                          size="small"
                          sx={{
                            bgcolor: tipo.color + "22",
                            color: tipo.color,
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {ev.estudiante_nombre ?? `#${ev.estudiante}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {ev.competencia_nombre ?? `#${ev.competencia}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {ev.evaluador_nombre ?? `#${ev.evaluador}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ev.semestre}</Typography>
                      </TableCell>
                      <TableCell>
                        {ev.puntaje !== null ? (
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                          >
                            <StarOutlined
                              sx={{ fontSize: 14, color: "#FF9800" }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {ev.puntaje}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip
                            label="Pendiente"
                            size="small"
                            sx={{
                              bgcolor: "#FF980022",
                              color: "#FF9800",
                              fontWeight: 600,
                              borderRadius: 1,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {nivel ? (
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
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 0.5,
                          }}
                        >
                          {canCalificarEval(ev) && (
                            <Tooltip
                              title={
                                ev.puntaje !== null
                                  ? "Actualizar calificación"
                                  : "Calificar"
                              }
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleOpenCalificar(ev)}
                                color="success"
                              >
                                <GradingOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => setDeleteId(ev.id)}
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

      {/* ── Dialog: Crear evaluación ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Nueva Evaluación
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}

            {/* Tipo: oculto para estudiantes (forzado autoevaluacion) */}
            {!isStudent && (
              <FormControl fullWidth disabled={saving} error={!!formErrors.tipo}>
                <InputLabel>Tipo de evaluación *</InputLabel>
                <Select
                  label="Tipo de evaluación *"
                  value={form.tipo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipo: e.target.value as TipoEvaluacion,
                      evaluador: null,
                    })
                  }
                >
                  {TIPOS.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: t.color,
                            flexShrink: 0,
                          }}
                        />
                        {t.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Estudiante: oculto si el usuario ES el estudiante */}
            {!isStudent && (
              <Autocomplete
                options={estudiantes}
                getOptionLabel={(u) =>
                  `${u.first_name} ${u.last_name}`.trim() || u.username
                }
                value={
                  estudiantes.find((u) => u.id === form.estudiante) ?? null
                }
                onChange={(_, v) =>
                  setForm({ ...form, estudiante: v?.id ?? 0 })
                }
                disabled={saving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Estudiante *"
                    error={!!formErrors.estudiante}
                    helperText={formErrors.estudiante}
                  />
                )}
              />
            )}

            {/* Competencia */}
            <Autocomplete
              options={competencias}
              getOptionLabel={(c) => c.nombre}
              value={
                competencias.find((c) => c.id === form.competencia) ?? null
              }
              onChange={(_, v) =>
                setForm({ ...form, competencia: v?.id ?? 0 })
              }
              disabled={saving}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Competencia *"
                  error={!!formErrors.competencia}
                  helperText={formErrors.competencia}
                />
              )}
            />

            {/* Evaluador: solo para heteroevaluacion */}
            {form.tipo === "heteroevaluacion" && !isStudent && (
              <Autocomplete
                options={evaluadores}
                getOptionLabel={(u) =>
                  `${u.first_name} ${u.last_name}`.trim() || u.username
                }
                value={
                  evaluadores.find((u) => u.id === form.evaluador) ?? null
                }
                onChange={(_, v) =>
                  setForm({ ...form, evaluador: v?.id ?? null })
                }
                disabled={saving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Evaluador *"
                    error={!!formErrors.evaluador}
                    helperText={formErrors.evaluador}
                  />
                )}
              />
            )}

            {/* Semestre */}
            <FormControl fullWidth disabled={saving} error={!!formErrors.semestre}>
              <InputLabel>Semestre *</InputLabel>
              <Select
                label="Semestre *"
                value={form.semestre}
                onChange={(e) => setForm({ ...form, semestre: e.target.value })}
              >
                {getSemestresOptions().map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.semestre && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.75 }}
                >
                  {formErrors.semestre}
                </Typography>
              )}
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
            {saving ? "Creando…" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Calificar ── */}
      <Dialog
        open={!!calificarTarget}
        onClose={() => !calSaving && setCalificarTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {calificarTarget?.puntaje !== null
            ? "Actualizar calificación"
            : "Calificar evaluación"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {calError && <Alert severity="error">{calError}</Alert>}

            {/* Contexto informativo */}
            {calificarTarget && (
              <Paper
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}
              >
                <Typography variant="caption" color="text.secondary">
                  Estudiante
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {calificarTarget.estudiante_nombre ??
                    `#${calificarTarget.estudiante}`}
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Competencia
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {calificarTarget.competencia_nombre ??
                    `#${calificarTarget.competencia}`}
                </Typography>
              </Paper>
            )}

            {/* Puntaje */}
            <TextField
              label="Puntaje * (0 – 100)"
              type="number"
              value={calForm.puntaje}
              onChange={(e) =>
                setCalForm({
                  ...calForm,
                  puntaje: Math.min(100, Math.max(0, Number(e.target.value))),
                })
              }
              inputProps={{ min: 0, max: 100, step: 1 }}
              error={!!calErrors.puntaje}
              helperText={calErrors.puntaje}
              disabled={calSaving}
              fullWidth
            />

            {/* Nivel alcanzado */}
            <FormControl
              fullWidth
              disabled={calSaving}
              error={!!calErrors.nivel_alcanzado}
            >
              <InputLabel>Nivel alcanzado *</InputLabel>
              <Select
                label="Nivel alcanzado *"
                value={calForm.nivel_alcanzado}
                onChange={(e) =>
                  setCalForm({
                    ...calForm,
                    nivel_alcanzado: e.target.value as NivelAlcanzado,
                  })
                }
              >
                {NIVELES.map((n) => (
                  <MenuItem key={n.value} value={n.value}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
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
              {calErrors.nivel_alcanzado && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.75 }}
                >
                  {calErrors.nivel_alcanzado}
                </Typography>
              )}
            </FormControl>

            {/* Observaciones */}
            <TextField
              label="Observaciones"
              value={calForm.observaciones}
              onChange={(e) =>
                setCalForm({ ...calForm, observaciones: e.target.value })
              }
              disabled={calSaving}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCalificarTarget(null)}
            disabled={calSaving}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCalificar}
            disabled={calSaving}
            startIcon={calSaving ? <CircularProgress size={16} /> : null}
          >
            {calSaving ? "Guardando…" : "Guardar calificación"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Confirmar eliminación ── */}
      <Dialog
        open={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar evaluación?</DialogTitle>
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
