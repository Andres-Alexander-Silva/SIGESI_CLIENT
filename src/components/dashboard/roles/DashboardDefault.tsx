import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  AssignmentOutlined,
  SchoolOutlined,
  LibraryBooksOutlined,
  CheckCircleOutline,
  TrendingUpOutlined,
  RateReviewOutlined,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import StatCard from '@/components/dashboard/StatCard';
import { dashboardService, DashboardApiStats, DashboardScope } from '@/services/dashboard.service';

interface Props {
  user: any;
  scope: DashboardScope;
}

/** Devuelve el semestre vigente: YYYY-1 (ene–jun) o YYYY-2 (jul–dic) */
function getSemestreVigente(): string {
  const now = new Date();
  const year = now.getFullYear();
  const half = now.getMonth() < 6 ? 1 : 2;
  return `${year}-${half}`;
}

const SCOPE_LABELS: Record<DashboardScope, string> = {
  administrador: 'Administrador',
  grupo: 'Grupo de Investigación',
  semillero: 'Semillero',
};

export default function DashboardDefault({ user, scope }: Props) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [stats, setStats]     = useState<DashboardApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const semestre = getSemestreVigente();

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardService
      .getStats(scope, semestre)
      .then(setStats)
      .catch(() => setError('No se pudieron cargar los indicadores. Intenta de nuevo.'))
      .finally(() => setLoading(false));
  }, [scope, semestre]);

  const tooltipStyle = {
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
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

  // Datos para la gráfica de barras (indicadores numéricos)
  const barData = stats
    ? [
        { label: 'Proy. Activos',   value: stats.proyectos_activos },
        { label: 'Estudiantes',     value: stats.estudiantes_activos },
        { label: 'Producción',      value: stats.produccion_academica },
        { label: 'Actividades',     value: stats.actividades_completadas },
        { label: 'Evaluaciones',    value: stats.evaluaciones_registradas },
      ]
    : [];

  // Pie con los mismos indicadores
  const pieData = [
    { name: 'Proyectos Activos',       value: stats?.proyectos_activos ?? 0,        color: theme.palette.primary.main },
    { name: 'Actividades Completadas', value: stats?.actividades_completadas ?? 0,  color: theme.palette.secondary.main },
    { name: 'Producción Académica',    value: stats?.produccion_academica ?? 0,     color: theme.palette.warning.main },
    { name: 'Evaluaciones',            value: stats?.evaluaciones_registradas ?? 0, color: theme.palette.info.main },
  ].filter(d => d.value > 0);

  const statCards = [
    {
      title: 'Proyectos Activos',
      value: stats?.proyectos_activos ?? 0,
      icon: <AssignmentOutlined />,
      color: theme.palette.primary.main,
      bg: `rgba(200,16,46,${isDark ? '0.15' : '0.08'})`,
    },
    {
      title: 'Estudiantes Activos',
      value: stats?.estudiantes_activos ?? 0,
      icon: <SchoolOutlined />,
      color: theme.palette.secondary.main,
      bg: `rgba(45,110,60,${isDark ? '0.15' : '0.08'})`,
    },
    {
      title: 'Producción Académica',
      value: stats?.produccion_academica ?? 0,
      icon: <LibraryBooksOutlined />,
      color: theme.palette.warning.main,
      bg: `rgba(232,119,34,${isDark ? '0.15' : '0.08'})`,
    },
    {
      title: 'Actividades Completadas',
      value: stats?.actividades_completadas ?? 0,
      icon: <CheckCircleOutline />,
      color: theme.palette.info.main,
      bg: `rgba(59,91,219,${isDark ? '0.15' : '0.08'})`,
    },
    {
      title: 'Evaluaciones Registradas',
      value: stats?.evaluaciones_registradas ?? 0,
      icon: <RateReviewOutlined />,
      color: theme.palette.secondary.dark,
      bg: `rgba(30,90,45,${isDark ? '0.15' : '0.08'})`,
    },
    {
      title: 'Cumplimiento Semestral',
      value: `${cumplimiento.toFixed(1)}%`,
      icon: <TrendingUpOutlined />,
      color: cumplimientoColor,
      bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      subtitle: `Semestre ${semestre}`,
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography
            variant="h4"
            sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}
          >
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.disabled }}>
            Bienvenido de nuevo, {user?.first_name || 'Usuario'}. Semestre vigente:{' '}
            <strong style={{ color: theme.palette.text.secondary }}>{semestre}</strong>
          </Typography>
        </Box>
        <Chip
          label={SCOPE_LABELS[scope]}
          size="small"
          sx={{
            mt: 0.5,
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: isDark ? 'rgba(200,16,46,0.15)' : 'rgba(200,16,46,0.08)',
            color: theme.palette.primary.main,
            border: `1px solid ${theme.palette.primary.main}22`,
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stat Cards — 6 tarjetas */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        {statCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 4 }}>
            {loading ? (
              <Card sx={{ borderRadius: 3, height: '100%', minHeight: 110 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <CircularProgress size={24} />
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                bgColor={card.bg}
                subtitle={(card as any).subtitle}
              />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Gráficas */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Barras de indicadores */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpOutlined sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                    Resumen de Indicadores — {semestre}
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
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
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Cantidad" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cumplimiento + Pie */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Grid container spacing={{ xs: 2, sm: 3 }} direction="column" sx={{ height: '100%' }}>
            {/* Cumplimiento semestral */}
            <Grid size={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutline sx={{ color: cumplimientoColor, fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                        Cumplimiento Semestral
                      </Typography>
                    </Box>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
                        <Typography
                          variant="h4"
                          sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: cumplimientoColor }}
                        >
                          {cumplimiento.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                          completado
                        </Typography>
                      </Box>
                      <MuiTooltip title={`${cumplimiento.toFixed(1)}% completado`}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(cumplimiento, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.divider,
                            '& .MuiLinearProgress-bar': { backgroundColor: cumplimientoColor, borderRadius: 4 },
                          }}
                        />
                      </MuiTooltip>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Distribución en Pie */}
            <Grid size={12} sx={{ flex: 1 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutline sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                        Distribución
                      </Typography>
                    </Box>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent sx={{ height: 260 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : pieData.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
                          cy="40%"
                          innerRadius={45}
                          outerRadius={72}
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
                          iconSize={7}
                          formatter={(v: string) => (
                            <span style={{ color: theme.palette.text.secondary, fontSize: '0.72rem' }}>{v}</span>
                          )}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}