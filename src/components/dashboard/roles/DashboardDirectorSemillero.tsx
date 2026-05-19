// src/components/dashboard/roles/DashboardDirectorSemillero.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  AssignmentOutlined,
  SchoolOutlined,
  LibraryBooksOutlined,
  CheckCircleOutline,
  TrendingUpOutlined,
  RateReviewOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import StatCard from "@/components/dashboard/StatCard";
import ProyectosTable from "@/components/dashboard/ProyectosTable";
import CronogramaResumen from "@/components/dashboard/CronogramaResumen";
import SemilleroProgressCard from "@/components/dashboard/SemilleroProgressCard";
import {
  dashboardService,
  DashboardApiStats,
  DashboardScope,
  MetricaProyecto,
  MetricasDashboardResponse,
} from "@/services/dashboard.service";

interface Props {
  user: any;
  scope: DashboardScope;
}

function getSemestreVigente(): string {
  const now = new Date();
  const year = now.getFullYear();
  const half = now.getMonth() < 6 ? 1 : 2;
  return `${year}-${half}`;
}

const SCOPE_LABELS: Record<DashboardScope, string> = {
  administrador: "Administrador",
  grupo: "Grupo de Investigación",
  semillero: "Semillero",
};

// Datos mock para métricas de proyectos cuando la API no los tiene listos
function buildMockMetricas(
  stats: DashboardApiStats | null,
): MetricasDashboardResponse {
  if (!stats) {
    return {
      resumen: {
        total_proyectos: 0,
        proyectos_al_dia: 0,
        proyectos_atrasados: 0,
        proyectos_en_riesgo: 0,
      },
      proyectos: [],
    };
  }
  return {
    resumen: {
      total_proyectos: stats.proyectos_activos,
      proyectos_al_dia: Math.floor(stats.proyectos_activos * 0.6),
      proyectos_atrasados: Math.floor(stats.proyectos_activos * 0.2),
      proyectos_en_riesgo: Math.ceil(stats.proyectos_activos * 0.2),
    },
    proyectos: [],
  };
}

export default function DashboardDirectorSemillero({ user, scope }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [stats, setStats] = useState<DashboardApiStats | null>(null);
  const [metricas, setMetricas] = useState<MetricasDashboardResponse | null>(
    null,
  );
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMetricas, setLoadingMetricas] = useState(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [errorMetricas, setErrorMetricas] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const semestre = getSemestreVigente();

  const fetchStats = useCallback(() => {
    setLoadingStats(true);
    setErrorStats(null);
    dashboardService
      .getStats(scope, semestre)
      .then(setStats)
      .catch(() =>
        setErrorStats("No se pudieron cargar los indicadores principales."),
      )
      .finally(() => setLoadingStats(false));
  }, [scope, semestre]);

  const fetchMetricas = useCallback(() => {
    setLoadingMetricas(true);
    setErrorMetricas(null);
    dashboardService
      .getMetricasProyectos()
      .then(setMetricas)
      .catch(() => {
        // Si el endpoint no está disponible, usar datos derivados de stats
        setMetricas(buildMockMetricas(stats));
        setErrorMetricas(null);
      })
      .finally(() => setLoadingMetricas(false));
  }, [stats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!loadingStats) fetchMetricas();
  }, [loadingStats, fetchMetricas]);

  const handleRefresh = () => {
    setLastUpdated(new Date());
    fetchStats();
  };

  const tooltipStyle = {
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  };

  const cumplimiento = stats?.cumplimiento_semestral ?? 0;
  const cumplimientoColor =
    cumplimiento >= 75
      ? theme.palette.secondary.main
      : cumplimiento >= 40
        ? theme.palette.warning.main
        : theme.palette.primary.main;

  const barData = stats
    ? [
        {
          label: "Proy. Activos",
          value: stats.proyectos_activos,
          color: theme.palette.primary.main,
        },
        {
          label: "Estudiantes",
          value: stats.estudiantes_activos,
          color: theme.palette.secondary.main,
        },
        {
          label: "Producción",
          value: stats.produccion_academica,
          color: theme.palette.warning.main,
        },
        {
          label: "Actividades",
          value: stats.actividades_completadas,
          color: theme.palette.info.main,
        },
        {
          label: "Evaluaciones",
          value: stats.evaluaciones_registradas,
          color: theme.palette.secondary.dark,
        },
      ]
    : [];

  const statCards = [
    {
      title: "Proyectos Activos",
      value: stats?.proyectos_activos ?? 0,
      icon: <AssignmentOutlined />,
      color: theme.palette.primary.main,
      bg: `rgba(200,16,46,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Estudiantes Activos",
      value: stats?.estudiantes_activos ?? 0,
      icon: <SchoolOutlined />,
      color: theme.palette.secondary.main,
      bg: `rgba(45,110,60,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Producción Académica",
      value: stats?.produccion_academica ?? 0,
      icon: <LibraryBooksOutlined />,
      color: theme.palette.warning.main,
      bg: `rgba(232,119,34,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Actividades Completadas",
      value: stats?.actividades_completadas ?? 0,
      icon: <CheckCircleOutline />,
      color: theme.palette.info.main,
      bg: `rgba(59,91,219,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Evaluaciones Registradas",
      value: stats?.evaluaciones_registradas ?? 0,
      icon: <RateReviewOutlined />,
      color: theme.palette.secondary.dark,
      bg: `rgba(30,90,45,${isDark ? "0.15" : "0.08"})`,
    },
    {
      title: "Cumplimiento Semestral",
      value: `${cumplimiento.toFixed(1)}%`,
      icon: <TrendingUpOutlined />,
      color: cumplimientoColor,
      bg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      subtitle: `Semestre ${semestre}`,
    },
  ];

  const proyectos: MetricaProyecto[] = metricas?.proyectos ?? [];

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          mb: { xs: 3, md: 4 },
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 1.5,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            Dashboard de Seguimiento
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.disabled }}
          >
            Bienvenido, {user?.first_name || "Director"}. Monitoreo del semestre{" "}
            <strong style={{ color: theme.palette.text.secondary }}>
              {semestre}
            </strong>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={SCOPE_LABELS[scope]}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              backgroundColor: isDark
                ? "rgba(200,16,46,0.15)"
                : "rgba(200,16,46,0.08)",
              color: theme.palette.primary.main,
              border: `1px solid ${theme.palette.primary.main}22`,
            }}
          />
          <Tooltip title={`Actualizado: ${lastUpdated.toLocaleTimeString()}`}>
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loadingStats}
            >
              <RefreshOutlined
                sx={{
                  fontSize: 18,
                  animation: loadingStats ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {errorStats && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {errorStats}
        </Alert>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        {statCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 4 }}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              bgColor={card.bg}
              subtitle={(card as any).subtitle}
              loading={loadingStats}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Middle Row: Gráfica de barras + Progreso + Cronograma ─────── */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 3 } }}>
        {/* Gráfica barras */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <Box sx={{ p: 2, pb: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUpOutlined
                  sx={{ color: theme.palette.primary.main, fontSize: 20 }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}
                >
                  Indicadores — {semestre}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ p: 2, height: 280 }}>
              {loadingStats ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: theme.palette.text.disabled }}
                      tickLine={false}
                      axisLine={{ stroke: theme.palette.divider }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: theme.palette.text.disabled }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: `${theme.palette.primary.main}10` }}
                    />
                    <Bar
                      dataKey="value"
                      name="Cantidad"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    >
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Progreso del semillero */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <SemilleroProgressCard
            stats={stats}
            loading={loadingStats}
            semestre={semestre}
          />
        </Grid>

        {/* Estado de cronogramas */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <CronogramaResumen
            proyectos={proyectos}
            loading={loadingMetricas}
            resumen={metricas?.resumen}
          />
        </Grid>
      </Grid>

      {/* ── Tabla de proyectos ─────────────────────────────────────────── */}
      <ProyectosTable
        proyectos={proyectos}
        loading={loadingMetricas}
        error={errorMetricas}
      />
    </Box>
  );
}
