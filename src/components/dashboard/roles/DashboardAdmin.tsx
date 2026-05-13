import { useState, useEffect } from "react";
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
  Tooltip as MuiTooltip,
} from "@mui/material";
import {
  AssignmentOutlined,
  SchoolOutlined,
  LibraryBooksOutlined,
  CheckCircleOutline,
  TrendingUpOutlined,
  RateReviewOutlined,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
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

/** Devuelve el semestre vigente: YYYY-1 (ene–jun) o YYYY-2 (jul–dic) */
function getSemestreVigente(): string {
  const now = new Date();
  const year = now.getFullYear();
  const half = now.getMonth() < 6 ? 1 : 2;
  return `${year}-${half}`;
}

export default function DashboardAdmin({ user, scope }: Props) {
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
      .catch(() =>
        setError("No se pudieron cargar los indicadores. Intenta de nuevo."),
      )
      .finally(() => setLoading(false));
  }, [scope, semestre]);

  const tooltipStyle = {
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: isDark
      ? "0 4px 12px rgba(0,0,0,0.4)"
      : "0 4px 12px rgba(0,0,0,0.08)",
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

  const estadoPie = [
    {
      name: "Proyectos Activos",
      value: stats?.proyectos_activos ?? 0,
      color: theme.palette.primary.main,
    },
    {
      name: "Actividades Completadas",
      value: stats?.actividades_completadas ?? 0,
      color: theme.palette.secondary.main,
    },
    {
      name: "Producción Académica",
      value: stats?.produccion_academica ?? 0,
      color: theme.palette.warning.main,
    },
    {
      name: "Evaluaciones",
      value: stats?.evaluaciones_registradas ?? 0,
      color: theme.palette.info.main,
    },
  ].filter((d) => d.value > 0);

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
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.disabled }}>
          Bienvenido de nuevo, {user?.first_name || "Usuario"}. Semestre
          vigente:{" "}
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

      {/* Stat Cards */}
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
        ].map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 4 }}>
            {loading ? (
              <Card sx={{ borderRadius: 3, height: "100%", minHeight: 110 }}>
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
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
        {/* Cumplimiento Semestral — barra de progreso visual */}
        <Grid size={{ xs: 12, lg: 4 }}>
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
                    Cumplimiento Semestral
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mb: 2 }}
                  >
                    <ResponsiveContainer width="100%" height={200}>
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        startAngle={90}
                        endAngle={-270}
                        data={[
                          {
                            name: "Cumplimiento",
                            value: cumplimiento,
                            fill: cumplimientoColor,
                          },
                        ]}
                      >
                        <RadialBar
                          dataKey="value"
                          cornerRadius={8}
                          background={{ fill: theme.palette.divider }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ textAlign: "center", mt: -6 }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 700,
                        color: cumplimientoColor,
                      }}
                    >
                      {cumplimiento.toFixed(1)}%
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.disabled, mt: 0.5 }}
                    >
                      Semestre {semestre}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3, px: 1 }}>
                    <MuiTooltip
                      title={`${cumplimiento.toFixed(1)}% completado`}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(cumplimiento, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.divider,
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: cumplimientoColor,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </MuiTooltip>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución general — Pie */}
        <Grid size={{ xs: 12, lg: 8 }}>
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
                    Distribución de Indicadores
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              {loading ? (
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
              ) : estadoPie.length === 0 ? (
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
                    Sin datos para mostrar
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={estadoPie}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {estadoPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(v: string) => (
                        <span
                          style={{
                            color: theme.palette.text.secondary,
                            fontSize: "0.8rem",
                          }}
                        >
                          {v}
                        </span>
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
    </Box>
  );
}
