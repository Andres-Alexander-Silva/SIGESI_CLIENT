import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  LinearProgress,
  Tooltip as MuiTooltip,
  Divider,
} from "@mui/material";
import {
  AssignmentOutlined,
  CheckCircleOutline,
  GroupsOutlined,
  LibraryBooksOutlined,
  SchoolOutlined,
  VerifiedOutlined,
  EventOutlined,
  AnnouncementOutlined,
  TaskAltOutlined,
  BarChartOutlined,
  TrendingUpOutlined,
  DonutLargeOutlined,
  FilterListOutlined,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "@/context/AuthContext";
import StatCard from "@/components/dashboard/StatCard";
import { analiticaService, getLastNSemesters } from "@/services/analitica.service";
import { semillerosService, gruposService, lineasService } from "@/services/core.service";
import { DashboardScope } from "@/services/dashboard.service";
import type { IndicadoresActuales, SemestreStats, AnaliticaFilters } from "@/types/analitica";
import type { Semillero, GrupoInvestigacion, LineaInvestigacion } from "@/types/core";

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveScope(role: string | null | undefined): DashboardScope {
  if (role === "administrador") return "administrador";
  if (role === "director_grupo") return "grupo";
  return "semillero";
}

function getSemestreActual(): string {
  const now = new Date();
  const half = now.getMonth() < 6 ? 1 : 2;
  return `${now.getFullYear()}-${half}`;
}

function buildSemestreOptions(n = 6): string[] {
  return getLastNSemesters(n).reverse();
}

function canAccessAllFilters(role: string | null | undefined) {
  return role === "administrador";
}

function canAccessSemilleroFilter(role: string | null | undefined) {
  return (
    role === "administrador" ||
    role === "director_grupo" ||
    role === "director_semillero"
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function AnaliticaPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user, activeRole } = useAuth();
  const role = activeRole ?? user?.roles?.[0];
  const scope = resolveScope(role);

  const semestreOptions = buildSemestreOptions(6);

  // ── Estado de filtros ────────────────────────────────────────────────────
  const [filters, setFilters] = useState<AnaliticaFilters>({
    semestre: getSemestreActual(),
    semilleroId: "",
    grupoId: "",
    lineaId: "",
  });

  // ── Datos de listas para filtros ─────────────────────────────────────────
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [grupos, setGrupos] = useState<GrupoInvestigacion[]>([]);
  const [lineas, setLineas] = useState<LineaInvestigacion[]>([]);

  // ── Datos analytics ──────────────────────────────────────────────────────
  const [indicadores, setIndicadores] = useState<IndicadoresActuales | null>(null);
  const [historial, setHistorial] = useState<SemestreStats[]>([]);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Carga de listas para filtros ─────────────────────────────────────────
  useEffect(() => {
    if (canAccessAllFilters(role)) {
      Promise.allSettled([
        semillerosService.list(),
        gruposService.list(),
        lineasService.list(),
      ]).then(([s, g, l]) => {
        if (s.status === "fulfilled") setSemilleros(s.value);
        if (g.status === "fulfilled") setGrupos(g.value);
        if (l.status === "fulfilled") setLineas(l.value);
      });
    } else if (canAccessSemilleroFilter(role)) {
      semillerosService.list().then(setSemilleros).catch(() => {});
    }
  }, [role]);

  // ── Carga de indicadores KPI ─────────────────────────────────────────────
  const fetchIndicadores = useCallback(() => {
    setLoadingKpi(true);
    setError(null);
    analiticaService
      .getIndicadoresActuales(
        scope,
        filters.semestre,
        filters.semilleroId ? Number(filters.semilleroId) : undefined,
      )
      .then(setIndicadores)
      .catch(() => setError("No se pudieron cargar los indicadores. Intenta de nuevo."))
      .finally(() => setLoadingKpi(false));
  }, [scope, filters.semestre, filters.semilleroId]);

  useEffect(() => {
    fetchIndicadores();
  }, [fetchIndicadores]);

  // ── Carga del historial para gráficas ────────────────────────────────────
  useEffect(() => {
    setLoadingHistorial(true);
    const semestres = getLastNSemesters(5, filters.semestre);
    analiticaService
      .getHistorial(scope, semestres)
      .then(setHistorial)
      .catch(() => {})
      .finally(() => setLoadingHistorial(false));
  }, [scope, filters.semestre]);

  // ── Colores ──────────────────────────────────────────────────────────────
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
    success: theme.palette.secondary.light,
    muted: theme.palette.text.disabled,
  };

  const tooltipStyle = {
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    fontSize: "0.8rem",
  };

  // ── Tarjetas KPI ─────────────────────────────────────────────────────────
  const kpiCards = [
    {
      title: "Proyectos Activos",
      value: indicadores?.proyectos_activos ?? 0,
      icon: <AssignmentOutlined />,
      color: colors.primary,
      bg: `rgba(200,16,46,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Proyectos Finalizados",
      value: indicadores?.proyectos_finalizados ?? 0,
      icon: <CheckCircleOutline />,
      color: colors.secondary,
      bg: `rgba(45,110,60,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Semilleros Activos",
      value: indicadores?.semilleros_activos ?? 0,
      icon: <GroupsOutlined />,
      color: colors.info,
      bg: `rgba(59,91,219,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Producción Académica",
      value: indicadores?.produccion_academica ?? 0,
      icon: <LibraryBooksOutlined />,
      color: colors.warning,
      bg: `rgba(232,119,34,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Participación Estudiantil",
      value: indicadores?.participacion_estudiantil ?? 0,
      icon: <SchoolOutlined />,
      color: colors.success,
      bg: `rgba(61,143,80,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Cumplimiento Documental",
      value: `${(indicadores?.cumplimiento_semestral ?? 0).toFixed(1)}%`,
      icon: <VerifiedOutlined />,
      color:
        (indicadores?.cumplimiento_semestral ?? 0) >= 75
          ? colors.secondary
          : (indicadores?.cumplimiento_semestral ?? 0) >= 40
            ? colors.warning
            : colors.primary,
      bg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    },
    {
      title: "Eventos Científicos",
      value: indicadores?.eventos_cientificos ?? 0,
      icon: <EventOutlined />,
      color: "#7B3FF2",
      bg: `rgba(123,63,242,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Convocatorias Activas",
      value: indicadores?.convocatorias_activas ?? 0,
      icon: <AnnouncementOutlined />,
      color: "#E8471C",
      bg: `rgba(232,71,28,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Actividades Completadas",
      value: indicadores?.actividades_completadas ?? 0,
      icon: <TaskAltOutlined />,
      color: colors.info,
      bg: `rgba(59,91,219,${isDark ? "0.15" : "0.08"})`,
    },
  ];

  // ── Datos para Pie chart ──────────────────────────────────────────────────
  const pieData = [
    { name: "Proyectos Activos", value: indicadores?.proyectos_activos ?? 0, color: colors.primary },
    { name: "Prod. Académica", value: indicadores?.produccion_academica ?? 0, color: colors.warning },
    { name: "Actividades", value: indicadores?.actividades_completadas ?? 0, color: colors.secondary },
    { name: "Evaluaciones", value: indicadores?.evaluaciones_registradas ?? 0, color: colors.info },
  ].filter((d) => d.value > 0);

  // ── Cumplimiento ─────────────────────────────────────────────────────────
  const cumplimiento = indicadores?.cumplimiento_semestral ?? 0;
  const cumplimientoColor =
    cumplimiento >= 75 ? colors.secondary : cumplimiento >= 40 ? colors.warning : colors.primary;

  const isRestrictedRole =
    role === "lider_estudiantil" || role === "estudiante";

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}
          >
            Analítica Institucional
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
            Indicadores consolidados del sistema de investigación ·{" "}
            <strong style={{ color: theme.palette.text.secondary }}>{filters.semestre}</strong>
          </Typography>
        </Box>
        <Chip
          icon={<BarChartOutlined sx={{ fontSize: 16 }} />}
          label={scope === "administrador" ? "Vista institucional" : scope === "grupo" ? "Vista por grupo" : "Vista por semillero"}
          size="small"
          sx={{ bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", fontWeight: 500 }}
        />
      </Box>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <FilterListOutlined sx={{ fontSize: 18, color: theme.palette.text.disabled }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Filtros
            </Typography>
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={2}>
            {/* Semestre */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Semestre</InputLabel>
              <Select
                value={filters.semestre}
                label="Semestre"
                onChange={(e) => setFilters((f) => ({ ...f, semestre: e.target.value }))}
              >
                {semestreOptions.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Semillero (admin, director_grupo, director_semillero) */}
            {canAccessSemilleroFilter(role) && semilleros.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Semillero</InputLabel>
                <Select
                  value={filters.semilleroId}
                  label="Semillero"
                  onChange={(e) => setFilters((f) => ({ ...f, semilleroId: e.target.value as number | '' }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {semilleros.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Grupo (solo admin) */}
            {canAccessAllFilters(role) && grupos.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Grupo de Investigación</InputLabel>
                <Select
                  value={filters.grupoId}
                  label="Grupo de Investigación"
                  onChange={(e) => setFilters((f) => ({ ...f, grupoId: e.target.value as number | '' }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {grupos.map((g) => (
                    <MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Línea de investigación (solo admin) */}
            {canAccessAllFilters(role) && lineas.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Línea de Investigación</InputLabel>
                <Select
                  value={filters.lineaId}
                  label="Línea de Investigación"
                  onChange={(e) => setFilters((f) => ({ ...f, lineaId: e.target.value as number | '' }))}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {lineas.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3 }}>
        {kpiCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              bgColor={card.bg}
              loading={loadingKpi}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Gráficas fila 1: Comparativo + Tendencia ─────────────────── */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 2.5 }}>
        {/* Comparativo Histórico — BarChart */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BarChartOutlined sx={{ color: colors.primary, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                    Comparativo Histórico
                  </Typography>
                </Box>
              }
              subheader={
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                  Últimos 5 semestres
                </Typography>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              {loadingHistorial ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historial} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="semestre"
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span style={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>{v}</span>
                      )}
                    />
                    <Bar dataKey="proyectos_activos" name="Proyectos" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="produccion_academica" name="Prod. Académica" fill={colors.warning} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    {!isRestrictedRole && (
                      <Bar dataKey="estudiantes_activos" name="Estudiantes" fill={colors.secondary} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Tendencia de Crecimiento — LineChart */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUpOutlined sx={{ color: colors.secondary, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                    Tendencia de Crecimiento
                  </Typography>
                </Box>
              }
              subheader={
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                  Evaluaciones y producción
                </Typography>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              {loadingHistorial ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historial} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="semestre"
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span style={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>{v}</span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="produccion_academica"
                      name="Prod. Académica"
                      stroke={colors.warning}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: colors.warning }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="evaluaciones_registradas"
                      name="Evaluaciones"
                      stroke={colors.info}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: colors.info }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actividades_completadas"
                      name="Actividades"
                      stroke={colors.secondary}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: colors.secondary }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Gráficas fila 2: Distribución + Cumplimiento ─────────────── */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        {/* Distribución Actual — PieChart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <DonutLargeOutlined sx={{ color: colors.info, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                    Consolidado Institucional
                  </Typography>
                </Box>
              }
              subheader={
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                  Distribución actual de indicadores
                </Typography>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              {loadingKpi ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <CircularProgress />
                </Box>
              ) : pieData.length === 0 ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                    Sin datos para mostrar
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span style={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>{v}</span>
                      )}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cumplimiento por semestre — AreaChart + barra actual */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <VerifiedOutlined sx={{ color: cumplimientoColor, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                    Indicadores de Crecimiento
                  </Typography>
                </Box>
              }
              subheader={
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                  Cumplimiento y actividades por semestre
                </Typography>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              {/* Cumplimiento actual */}
              {!loadingKpi && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                      Cumplimiento semestral actual
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: cumplimientoColor }}>
                      {cumplimiento.toFixed(1)}%
                    </Typography>
                  </Box>
                  <MuiTooltip title={`${cumplimiento.toFixed(1)}% completado`}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(cumplimiento, 100)}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.palette.divider,
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: cumplimientoColor,
                          borderRadius: 5,
                        },
                      }}
                    />
                  </MuiTooltip>
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              {/* Area chart histórico */}
              <Box sx={{ height: 200 }}>
                {loadingHistorial ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historial} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradCumplimiento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={colors.secondary} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradActividades" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.info} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={colors.info} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis
                        dataKey="semestre"
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => (
                          <span style={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>{v}</span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumplimiento_semestral"
                        name="Cumplimiento %"
                        stroke={colors.secondary}
                        strokeWidth={2}
                        fill="url(#gradCumplimiento)"
                        dot={{ r: 3, fill: colors.secondary }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actividades_completadas"
                        name="Actividades"
                        stroke={colors.info}
                        strokeWidth={2}
                        fill="url(#gradActividades)"
                        dot={{ r: 3, fill: colors.info }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
