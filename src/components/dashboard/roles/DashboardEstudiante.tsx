import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  Skeleton,
  Stack,
} from "@mui/material";
import {
  AssignmentOutlined,
  CheckCircleOutline,
  TrendingUpOutlined,
  LibraryBooksOutlined,
  RateReviewOutlined,
} from "@mui/icons-material";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTheme } from "@mui/material/styles";
import StatCard from "@/components/dashboard/StatCard";
import {
  dashboardService,
  DashboardApiStats,
  DashboardScope,
} from "@/services/dashboard.service";

interface Props {
  user: any;
  scope: DashboardScope;
}

function getSemestreVigente(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() < 6 ? 1 : 2}`;
}

export default function DashboardEstudiante({ user, scope }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [stats, setStats] = useState<DashboardApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const semestre = getSemestreVigente();

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardService
      .getStats(scope, semestre)
      .then(setStats)
      .catch(() => setError("No se pudieron cargar los indicadores."))
      .finally(() => setLoading(false));
  }, [scope, semestre]);

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

  const radarData = stats
    ? [
        {
          subject: "Proyectos",
          A: Math.min((stats.proyectos_activos / 5) * 100, 100),
        },
        {
          subject: "Actividades",
          A: Math.min((stats.actividades_completadas / 20) * 100, 100),
        },
        {
          subject: "Producción",
          A: Math.min((stats.produccion_academica / 10) * 100, 100),
        },
        {
          subject: "Evaluaciones",
          A: Math.min((stats.evaluaciones_registradas / 8) * 100, 100),
        },
        { subject: "Cumplimiento", A: Math.min(cumplimiento, 100) },
      ]
    : [];

  const progresoItems = [
    {
      label: "Progreso general semestral",
      value: cumplimiento,
      color: cumplimientoColor,
      description: `${cumplimiento.toFixed(1)}% completado`,
    },
    {
      label: "Actividades vs meta estimada",
      value: stats
        ? Math.min(
            (stats.actividades_completadas /
              Math.max(stats.proyectos_activos * 5, 1)) *
              100,
            100,
          )
        : 0,
      color: theme.palette.info.main,
      description: `${stats?.actividades_completadas ?? 0} actividades registradas`,
    },
    {
      label: "Producción académica",
      value: stats
        ? Math.min(
            (stats.produccion_academica /
              Math.max(stats.proyectos_activos * 2, 1)) *
              100,
            100,
          )
        : 0,
      color: theme.palette.warning.main,
      description: `${stats?.produccion_academica ?? 0} producciones`,
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          Mi Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.disabled }}>
          Hola, {user?.first_name || "Estudiante"}. Tu progreso en el semestre{" "}
          <strong style={{ color: theme.palette.text.secondary }}>
            {semestre}
          </strong>
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stat cards simplificadas */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        {[
          {
            title: "Proyectos Activos",
            value: stats?.proyectos_activos ?? 0,
            icon: <AssignmentOutlined />,
            color: theme.palette.primary.main,
            bg: `rgba(200,16,46,${isDark ? "0.15" : "0.08"})`,
          },
          {
            title: "Actividades Registradas",
            value: stats?.actividades_completadas ?? 0,
            icon: <CheckCircleOutline />,
            color: theme.palette.info.main,
            bg: `rgba(59,91,219,${isDark ? "0.15" : "0.08"})`,
          },
          {
            title: "Producción Académica",
            value: stats?.produccion_academica ?? 0,
            icon: <LibraryBooksOutlined />,
            color: theme.palette.warning.main,
            bg: `rgba(232,119,34,${isDark ? "0.15" : "0.08"})`,
          },
          {
            title: "Evaluaciones",
            value: stats?.evaluaciones_registradas ?? 0,
            icon: <RateReviewOutlined />,
            color: theme.palette.secondary.dark,
            bg: `rgba(30,90,45,${isDark ? "0.15" : "0.08"})`,
          },
        ].map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6 }}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              bgColor={card.bg}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Progreso personal */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUpOutlined
                    sx={{ color: cumplimientoColor, fontSize: 20 }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    Mi Progreso
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              {loading ? (
                <Stack spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" height={50} />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={2.5}>
                  {progresoItems.map((item) => (
                    <Box key={item.label}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          mb: 0.75,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: item.color }}
                        >
                          {Math.round(item.value)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(item.value, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.divider,
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 4,
                            backgroundColor: item.color,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.disabled,
                          mt: 0.5,
                          display: "block",
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Radar de competencias */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleOutline
                    sx={{ color: theme.palette.secondary.main, fontSize: 20 }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    Perfil de Actividad
                  </Typography>
                </Box>
              }
              action={
                <Chip
                  label={semestre}
                  size="small"
                  sx={{ fontSize: "0.7rem" }}
                />
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 280 }}>
              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Skeleton variant="circular" width={200} height={200} />
                </Box>
              ) : radarData.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.disabled }}
                  >
                    Sin datos suficientes para mostrar
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={theme.palette.divider} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fontSize: 12,
                        fill: theme.palette.text.secondary,
                      }}
                    />
                    <Radar
                      name="Tu perfil"
                      dataKey="A"
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.main}
                      fillOpacity={0.25}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [
                        `${Math.round(v)}%`,
                        "Progreso",
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estado académico */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title={
                <Typography
                  variant="subtitle1"
                  sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}
                >
                  Estado Académico Semestral
                </Typography>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              {loading ? (
                <Skeleton variant="rounded" height={80} />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.disabled }}
                    >
                      Semestre vigente
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 700,
                      }}
                    >
                      {semestre}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.disabled }}
                    >
                      Cumplimiento
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 700,
                        color: cumplimientoColor,
                      }}
                    >
                      {cumplimiento.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.disabled }}
                    >
                      Estado general
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={
                          cumplimiento >= 75
                            ? "Excelente"
                            : cumplimiento >= 40
                              ? "En progreso"
                              : "Requiere atención"
                        }
                        color={
                          cumplimiento >= 75
                            ? "success"
                            : cumplimiento >= 40
                              ? "warning"
                              : "error"
                        }
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
