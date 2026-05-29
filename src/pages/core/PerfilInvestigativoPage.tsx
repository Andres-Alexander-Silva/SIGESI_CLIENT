// src/pages/core/PerfilInvestigativoPage.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  Autocomplete,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import {
  PersonOutlined,
  RefreshOutlined,
  EditOutlined,
  AddOutlined,
  AssignmentOutlined,
  StarOutlined,
  CheckCircleOutlined,
  PsychologyOutlined,
  TrendingUpOutlined,
  AccountCircleOutlined,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "@mui/material/styles";

import { perfilInvestigativoService } from "@/services/perfilInvestigativo.service";
import { evaluacionesService } from "@/services/evaluaciones.service";
import { usersService } from "@/services/config.service";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { PerfilInvestigativo, PerfilInvestigativoCreate } from "@/types/perfilInvestigativo";
import { Evaluacion } from "@/types/evaluaciones";
import { UserAdmin } from "@/types";

// ─── Paleta ───────────────────────────────────────────────────────────────────
const NIVEL_COLORS: Record<string, string> = {
  basico:     "#4CAF50",
  intermedio: "#2196F3",
  avanzado:   "#9C27B0",
};
const NIVEL_LABELS: Record<string, string> = {
  basico:     "Básico",
  intermedio: "Intermedio",
  avanzado:   "Avanzado",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon, label, value, sub, color = "#1A1A2E",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5, height: "100%" }}>
      <CardContent
        sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: "14px !important" }}
      >
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 2,
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: `${color}18`, color, flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
            {label.toUpperCase()}
          </Typography>
          <Typography variant="h5" fontWeight={800} color={color} lineHeight={1.1}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary">{sub}</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PerfilInvestigativoPage() {
  const { user, activeRole } = useAuth();
  const { can } = usePermissions();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isStudent  = activeRole === "estudiante";
  const canEdit    = can("/perfil_investigativo", "editar");
  const canCreate  = can("/perfil_investigativo", "crear");

  // ── Lista de estudiantes (para roles no-estudiante) ────────────────────────
  const [estudiantes,   setEstudiantes]   = useState<UserAdmin[]>([]);
  const [selectedUser,  setSelectedUser]  = useState<UserAdmin | null>(null);

  // ── Datos cargados ─────────────────────────────────────────────────────────
  const [perfil,      setPerfil]      = useState<PerfilInvestigativo | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [hasData,     setHasData]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── Paginación tabla ───────────────────────────────────────────────────────
  const [page,         setPage]         = useState(0);
  const [rowsPerPage,  setRowsPerPage]  = useState(10);

  // ── Dialog perfil ──────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form,       setForm]       = useState({ resumen: "", fortalezas: "", areas_mejora: "" });
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  // ── ID del estudiante activo ───────────────────────────────────────────────
  const activeStudentId: number | undefined = isStudent ? user?.id : (selectedUser?.id ?? undefined);
  const activeStudentName = isStudent
    ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
    : selectedUser
      ? `${selectedUser.first_name} ${selectedUser.last_name}`
      : "";

  // Cargar lista de estudiantes al montar (para directores/admins)
  useEffect(() => {
    if (!isStudent) {
      usersService.listByRol("estudiante").then(setEstudiantes).catch(() => {});
    }
  }, [isStudent]);

  const loadData = useCallback(async (estudianteId: number) => {
    setLoading(true);
    setError(null);
    try {
      const [perfiles, evals] = await Promise.all([
        perfilInvestigativoService.list({ estudiante: estudianteId }),
        evaluacionesService.list({ estudiante: estudianteId }),
      ]);
      setPerfil(perfiles[0] ?? null);
      setEvaluaciones(evals);
      setHasData(true);
      setPage(0);
    } catch {
      setError("No se pudo cargar el perfil investigativo.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-carga para el rol estudiante
  useEffect(() => {
    if (isStudent && user?.id) {
      loadData(user.id);
    }
  }, [isStudent, user?.id, loadData]);

  // Carga cuando el director selecciona un estudiante
  useEffect(() => {
    if (!isStudent && selectedUser) {
      setHasData(false);
      setPerfil(null);
      setEvaluaciones([]);
      loadData(selectedUser.id);
    }
  }, [selectedUser, isStudent, loadData]);

  const handleRefresh = () => {
    if (activeStudentId) loadData(activeStudentId);
  };

  // ── Dialog ─────────────────────────────────────────────────────────────────
  const handleOpenDialog = () => {
    setForm({
      resumen:      perfil?.resumen      ?? "",
      fortalezas:   perfil?.fortalezas   ?? "",
      areas_mejora: perfil?.areas_mejora ?? "",
    });
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!activeStudentId) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (perfil) {
        const updated = await perfilInvestigativoService.update(perfil.id, form);
        setPerfil(updated);
      } else {
        const created = await perfilInvestigativoService.create({
          estudiante: activeStudentId,
          ...form,
        });
        setPerfil(created);
      }
      setDialogOpen(false);
    } catch {
      setSaveError("Error al guardar el perfil. Verifica los datos.");
    } finally {
      setSaving(false);
    }
  };

  // ── Estadísticas derivadas ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const calificadas = evaluaciones.filter((e) => e.puntaje !== null);
    const promedio =
      calificadas.length > 0
        ? calificadas.reduce((s, e) => s + (e.puntaje ?? 0), 0) / calificadas.length
        : null;

    // Promedio por semestre (evolución)
    const semMap: Record<string, { suma: number; count: number }> = {};
    calificadas.forEach((e) => {
      if (!semMap[e.semestre]) semMap[e.semestre] = { suma: 0, count: 0 };
      semMap[e.semestre].suma  += e.puntaje ?? 0;
      semMap[e.semestre].count += 1;
    });
    const promPorSemestre = Object.entries(semMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semestre, { suma, count }]) => ({
        semestre,
        promedio: parseFloat((suma / count).toFixed(1)),
      }));

    // Distribución de niveles alcanzados
    const nivelCount: Record<string, number> = {};
    evaluaciones
      .filter((e) => e.nivel_alcanzado)
      .forEach((e) => {
        const n = e.nivel_alcanzado!;
        nivelCount[n] = (nivelCount[n] ?? 0) + 1;
      });
    const pieNivel = Object.entries(nivelCount).map(([nivel, count]) => ({
      name:  NIVEL_LABELS[nivel] ?? nivel,
      value: count,
      color: NIVEL_COLORS[nivel] ?? "#999",
    }));

    // Mejor nivel global
    const mejorNivel = nivelCount.avanzado
      ? "avanzado"
      : nivelCount.intermedio
        ? "intermedio"
        : nivelCount.basico
          ? "basico"
          : null;

    return { total: evaluaciones.length, calificadas: calificadas.length, promedio, mejorNivel, promPorSemestre, pieNivel };
  }, [evaluaciones]);

  // ── Evaluaciones paginadas (más recientes primero) ─────────────────────────
  const sortedEvals = useMemo(
    () => [...evaluaciones].sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion)),
    [evaluaciones],
  );
  const paginatedEvals = sortedEvals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const showContent = !loading && hasData && activeStudentId;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        mb={3}
        spacing={1.5}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AccountCircleOutlined sx={{ fontSize: 36, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={800} fontFamily='"DM Sans", sans-serif'>
              Perfil Investigativo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Seguimiento académico e indicadores de desempeño investigativo
            </Typography>
          </Box>
        </Stack>
        {showContent && (
          <Tooltip title="Actualizar datos">
            <IconButton onClick={handleRefresh} size="small" color="primary">
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* ── Selector de estudiante (para directores y admins) ───────────────── */}
      {!isStudent && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Autocomplete
            options={estudiantes}
            getOptionLabel={(u) =>
              `${u.first_name} ${u.last_name}${u.cedula ? ` — ${u.cedula}` : ""}`
            }
            value={selectedUser}
            onChange={(_, v) => {
              setSelectedUser(v);
              if (!v) { setHasData(false); setPerfil(null); setEvaluaciones([]); }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar estudiante"
                size="small"
                placeholder="Buscar por nombre o cédula…"
              />
            )}
            sx={{ maxWidth: 480 }}
          />
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Loading ──────────────────────────────────────────────────────────── */}
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Cargando perfil…</Typography>
          </Stack>
        </Box>
      )}

      {/* ── Estado inicial (sin estudiante seleccionado) ──────────────────────── */}
      {!loading && !isStudent && !selectedUser && (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <PersonOutlined sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Selecciona un estudiante para ver su perfil investigativo
          </Typography>
        </Box>
      )}

      {/* ── Contenido principal ───────────────────────────────────────────────── */}
      {showContent && (
        <>
          {/* ── Tarjeta de perfil ─────────────────────────────────────────────── */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mb: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems="flex-start">
              {/* Avatar */}
              <Avatar
                sx={{
                  width: 72, height: 72, bgcolor: "primary.main",
                  fontSize: 26, fontWeight: 700, flexShrink: 0,
                }}
              >
                {activeStudentName ? buildInitials(activeStudentName) : <PersonOutlined />}
              </Avatar>

              {/* Info */}
              <Box flex={1} minWidth={0}>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" mb={0.5}>
                  <Typography variant="h6" fontWeight={700}>
                    {activeStudentName || "Estudiante"}
                  </Typography>
                  <Chip
                    label={perfil ? "Perfil registrado" : "Sin perfil"}
                    size="small"
                    color={perfil ? "success" : "default"}
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                </Stack>

                {/* Datos del estudiante (solo para directores) */}
                {!isStudent && selectedUser && (
                  <Stack direction="row" spacing={2.5} flexWrap="wrap" mb={1.5}>
                    {selectedUser.cedula && (
                      <Typography variant="caption" color="text.secondary">
                        Cédula: <strong>{selectedUser.cedula}</strong>
                      </Typography>
                    )}
                    {selectedUser.email && (
                      <Typography variant="caption" color="text.secondary">
                        Email: <strong>{selectedUser.email}</strong>
                      </Typography>
                    )}
                    {selectedUser.codigo_estudiantil && (
                      <Typography variant="caption" color="text.secondary">
                        Código: <strong>{selectedUser.codigo_estudiantil}</strong>
                      </Typography>
                    )}
                  </Stack>
                )}

                {/* Contenido del perfil */}
                {perfil ? (
                  <Grid container spacing={2} mt={0}>
                    {perfil.resumen && (
                      <Grid item xs={12} md={4}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="text.secondary"
                          display="block"
                          mb={0.5}
                        >
                          RESUMEN
                        </Typography>
                        <Typography variant="body2">{perfil.resumen}</Typography>
                      </Grid>
                    )}
                    {perfil.fortalezas && (
                      <Grid item xs={12} md={4}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="#2D6E3C"
                          display="block"
                          mb={0.5}
                        >
                          FORTALEZAS
                        </Typography>
                        <Typography variant="body2">{perfil.fortalezas}</Typography>
                      </Grid>
                    )}
                    {perfil.areas_mejora && (
                      <Grid item xs={12} md={4}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="#E67700"
                          display="block"
                          mb={0.5}
                        >
                          ÁREAS DE MEJORA
                        </Typography>
                        <Typography variant="body2">{perfil.areas_mejora}</Typography>
                      </Grid>
                    )}
                    {!perfil.resumen && !perfil.fortalezas && !perfil.areas_mejora && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Perfil sin contenido. Haz clic en "Editar" para completarlo.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    No hay perfil investigativo registrado para este estudiante.
                  </Typography>
                )}
              </Box>

              {/* Botón editar / crear */}
              {(canEdit || canCreate) && (
                <Button
                  variant={perfil ? "outlined" : "contained"}
                  size="small"
                  startIcon={perfil ? <EditOutlined /> : <AddOutlined />}
                  onClick={handleOpenDialog}
                  sx={{ flexShrink: 0 }}
                >
                  {perfil ? "Editar perfil" : "Crear perfil"}
                </Button>
              )}
            </Stack>
          </Paper>

          {/* ── KPIs ──────────────────────────────────────────────────────────── */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<AssignmentOutlined fontSize="small" />}
                label="Total evaluaciones"
                value={stats.total}
                sub={`${stats.calificadas} calificadas`}
                color="#3B5BDB"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<CheckCircleOutlined fontSize="small" />}
                label="Calificadas"
                value={stats.calificadas}
                sub={
                  stats.total > 0
                    ? `${Math.round((stats.calificadas / stats.total) * 100)}% del total`
                    : "sin evaluaciones"
                }
                color="#2D6E3C"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<StarOutlined fontSize="small" />}
                label="Promedio general"
                value={stats.promedio !== null ? stats.promedio.toFixed(1) : "—"}
                sub="sobre 100 puntos"
                color="#E67700"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard
                icon={<PsychologyOutlined fontSize="small" />}
                label="Mejor nivel"
                value={stats.mejorNivel ? NIVEL_LABELS[stats.mejorNivel] : "—"}
                sub="nivel alcanzado"
                color={stats.mejorNivel ? NIVEL_COLORS[stats.mejorNivel] : "#999"}
              />
            </Grid>
          </Grid>

          {/* ── Gráficos (solo si hay datos) ───────────────────────────────────── */}
          {(stats.promPorSemestre.length > 0 || stats.pieNivel.length > 0) && (
            <Grid container spacing={2.5} mb={3}>
              {/* Bar: evolución del promedio por semestre */}
              {stats.promPorSemestre.length > 0 && (
                <Grid item xs={12} md={stats.pieNivel.length > 0 ? 7 : 12}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, height: "100%" }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      mb={2}
                      display="flex"
                      alignItems="center"
                      gap={0.8}
                    >
                      <TrendingUpOutlined fontSize="small" color="primary" />
                      Evolución del promedio por semestre
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.promPorSemestre}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis dataKey="semestre" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <RechartTooltip
                          formatter={(v: number) => [`${v} pts`, "Promedio"]}
                        />
                        <Bar dataKey="promedio" fill="#3B5BDB" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}

              {/* Pie: distribución de niveles alcanzados */}
              {stats.pieNivel.length > 0 && (
                <Grid item xs={12} md={stats.promPorSemestre.length > 0 ? 5 : 12}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, height: "100%" }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      mb={2}
                      display="flex"
                      alignItems="center"
                      gap={0.8}
                    >
                      <PsychologyOutlined fontSize="small" color="primary" />
                      Distribución de niveles alcanzados
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.pieNivel}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={72}
                          innerRadius={36}
                          paddingAngle={3}
                        >
                          {stats.pieNivel.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartTooltip
                          formatter={(v: number, name: string) => [`${v} evaluación(es)`, name]}
                        />
                        <Legend iconType="circle" iconSize={10} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {/* ── Historial de evaluaciones ──────────────────────────────────────── */}
          <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
            <Box sx={{ p: 2.5, pb: 1.5 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                display="flex"
                alignItems="center"
                gap={0.8}
              >
                <AssignmentOutlined fontSize="small" color="primary" />
                Historial de evaluaciones
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: isDark ? "grey.800" : "grey.100" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Competencia</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Semestre</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Puntaje</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nivel</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEvals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Sin evaluaciones registradas.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEvals.map((ev) => {
                      const nColor = ev.nivel_alcanzado
                        ? (NIVEL_COLORS[ev.nivel_alcanzado] ?? "#999")
                        : null;
                      const nLabel = ev.nivel_alcanzado
                        ? (NIVEL_LABELS[ev.nivel_alcanzado] ?? ev.nivel_alcanzado)
                        : null;
                      const fechaDisplay = ev.fecha_calificacion
                        ? new Date(ev.fecha_calificacion).toLocaleDateString("es-CO")
                        : new Date(ev.fecha_creacion).toLocaleDateString("es-CO");
                      return (
                        <TableRow key={ev.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {ev.competencia_nombre ?? `Comp. #${ev.competencia}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                ev.tipo === "autoevaluacion"
                                  ? "Autoevaluación"
                                  : "Heteroevaluación"
                              }
                              size="small"
                              sx={{
                                bgcolor:
                                  ev.tipo === "autoevaluacion" ? "#3B5BDB22" : "#E6770022",
                                color:
                                  ev.tipo === "autoevaluacion" ? "#3B5BDB" : "#E67700",
                                fontWeight: 600,
                                borderRadius: 1,
                                fontSize: "0.7rem",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{ev.semestre}</Typography>
                          </TableCell>
                          <TableCell>
                            {ev.puntaje !== null ? (
                              <Typography variant="body2" fontWeight={700}>
                                {ev.puntaje}
                              </Typography>
                            ) : (
                              <Chip
                                label="Pendiente"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.65rem", height: 18 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {nColor && nLabel ? (
                              <Chip
                                label={nLabel}
                                size="small"
                                sx={{
                                  bgcolor: nColor + "22",
                                  color: nColor,
                                  fontWeight: 600,
                                  borderRadius: 1,
                                  fontSize: "0.7rem",
                                }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {fechaDisplay}
                            </Typography>
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
              count={evaluaciones.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Filas:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </Paper>
        </>
      )}

      {/* ── Dialog crear / editar perfil ──────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          {perfil ? "Editar Perfil Investigativo" : "Crear Perfil Investigativo"}
          {activeStudentName && (
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {activeStudentName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} pt={1}>
            {saveError && <Alert severity="error">{saveError}</Alert>}
            <TextField
              label="Resumen investigativo"
              value={form.resumen}
              onChange={(e) => setForm({ ...form, resumen: e.target.value })}
              multiline
              rows={3}
              disabled={saving}
              fullWidth
              placeholder="Descripción de la trayectoria y perfil investigativo del estudiante…"
            />
            <TextField
              label="Fortalezas"
              value={form.fortalezas}
              onChange={(e) => setForm({ ...form, fortalezas: e.target.value })}
              multiline
              rows={3}
              disabled={saving}
              fullWidth
              placeholder="Habilidades destacadas, competencias sobresalientes…"
            />
            <TextField
              label="Áreas de mejora"
              value={form.areas_mejora}
              onChange={(e) => setForm({ ...form, areas_mejora: e.target.value })}
              multiline
              rows={3}
              disabled={saving}
              fullWidth
              placeholder="Aspectos a fortalecer, oportunidades de desarrollo…"
            />
          </Stack>
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
            {saving ? "Guardando…" : perfil ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
