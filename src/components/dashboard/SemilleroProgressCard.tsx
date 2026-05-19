import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Skeleton,
  Divider,
} from "@mui/material";
import {
  TrendingUpOutlined,
  AssignmentOutlined,
  SchoolOutlined,
  LibraryBooksOutlined,
  CheckCircleOutline,
  RateReviewOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { DashboardApiStats } from "@/services/dashboard.service";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

interface SemilleroProgressCardProps {
  stats: DashboardApiStats | null;
  loading: boolean;
  semestre: string;
}

export default function SemilleroProgressCard({
  stats,
  loading,
  semestre,
}: SemilleroProgressCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const cumplimiento = stats?.cumplimiento_semestral ?? 0;
  const cumplimientoColor =
    cumplimiento >= 75
      ? theme.palette.secondary.main
      : cumplimiento >= 40
        ? theme.palette.warning.main
        : theme.palette.primary.main;

  const indicadores = [
    {
      label: "Proyectos activos",
      value: stats?.proyectos_activos ?? 0,
      icon: <AssignmentOutlined sx={{ fontSize: 16 }} />,
      color: theme.palette.primary.main,
    },
    {
      label: "Estudiantes activos",
      value: stats?.estudiantes_activos ?? 0,
      icon: <SchoolOutlined sx={{ fontSize: 16 }} />,
      color: theme.palette.secondary.main,
    },
    {
      label: "Producción académica",
      value: stats?.produccion_academica ?? 0,
      icon: <LibraryBooksOutlined sx={{ fontSize: 16 }} />,
      color: theme.palette.warning.main,
    },
    {
      label: "Actividades completadas",
      value: stats?.actividades_completadas ?? 0,
      icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
      color: theme.palette.info.main,
    },
    {
      label: "Evaluaciones registradas",
      value: stats?.evaluaciones_registradas ?? 0,
      icon: <RateReviewOutlined sx={{ fontSize: 16 }} />,
      color: theme.palette.secondary.dark,
    },
  ];

  return (
    <Card sx={{ borderRadius: 3, height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUpOutlined
              sx={{ color: cumplimientoColor, fontSize: 20 }}
            />
            <Typography
              variant="subtitle1"
              sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}
            >
              Progreso del Semillero
            </Typography>
          </Box>
        }
        subheader={
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.disabled }}
          >
            Semestre {semestre}
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent>
        {loading ? (
          <>
            <Skeleton
              variant="circular"
              width={160}
              height={160}
              sx={{ mx: "auto", mb: 2 }}
            />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="text" height={28} sx={{ mb: 0.5 }} />
            ))}
          </>
        ) : (
          <>
            {/* Donut de cumplimiento */}
            <Box sx={{ position: "relative", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
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
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 700,
                    color: cumplimientoColor,
                    lineHeight: 1,
                  }}
                >
                  {cumplimiento.toFixed(1)}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.disabled }}
                >
                  cumplimiento
                </Typography>
              </Box>
            </Box>

            {/* Barra de cumplimiento */}
            <Box sx={{ mb: 2, px: 1 }}>
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
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Lista de indicadores */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {indicadores.map((ind) => (
                <Box
                  key={ind.label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        color: ind.color,
                        display: "flex",
                        alignItems: "center",
                        p: 0.5,
                        borderRadius: 1,
                        backgroundColor: `${ind.color}${isDark ? "26" : "14"}`,
                      }}
                    >
                      {ind.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {ind.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: ind.color }}
                  >
                    {ind.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
