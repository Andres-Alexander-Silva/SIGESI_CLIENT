import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  Stack,
  LinearProgress,
} from "@mui/material";
import {
  CalendarTodayOutlined,
  CheckCircleOutline,
  ErrorOutline,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { MetricaProyecto } from "@/services/dashboard.service";

interface CronogramaResumenProps {
  proyectos: MetricaProyecto[];
  loading: boolean;
  resumen?: {
    total_proyectos: number;
    proyectos_al_dia: number;
    proyectos_atrasados: number;
    proyectos_en_riesgo: number;
  };
}

export default function CronogramaResumen({
  proyectos,
  loading,
  resumen,
}: CronogramaResumenProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const atrasados = proyectos.filter((p) => p.estado_cronograma === "atrasado");
  const enRiesgo = proyectos.filter((p) => p.estado_cronograma === "en_riesgo");
  const alDia = proyectos.filter((p) => p.estado_cronograma === "al_dia");

  const groups = [
    {
      label: "Proyectos al día",
      items: alDia,
      color: theme.palette.secondary.main,
      bg: `rgba(45,110,60,${isDark ? "0.15" : "0.08"})`,
      icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
    },
    {
      label: "En riesgo",
      items: enRiesgo,
      color: theme.palette.warning.main,
      bg: `rgba(232,119,34,${isDark ? "0.15" : "0.08"})`,
      icon: <WarningAmberOutlined sx={{ fontSize: 16 }} />,
    },
    {
      label: "Atrasados",
      items: atrasados,
      color: theme.palette.primary.main,
      bg: `rgba(200,16,46,${isDark ? "0.15" : "0.08"})`,
      icon: <ErrorOutline sx={{ fontSize: 16 }} />,
    },
  ];

  return (
    <Card sx={{ borderRadius: 3, height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarTodayOutlined
              sx={{ color: theme.palette.info.main, fontSize: 20 }}
            />
            <Typography
              variant="subtitle1"
              sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}
            >
              Estado de Cronogramas
            </Typography>
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent>
        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={60} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {/* Resumen del backend si viene */}
            {resumen && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  mb: 1,
                  pb: 1.5,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Chip
                  size="small"
                  icon={<CheckCircleOutline sx={{ fontSize: 14 }} />}
                  label={`${resumen.proyectos_al_dia} al día`}
                  sx={{
                    color: theme.palette.secondary.main,
                    borderColor: theme.palette.secondary.main,
                    fontSize: "0.7rem",
                  }}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<WarningAmberOutlined sx={{ fontSize: 14 }} />}
                  label={`${resumen.proyectos_en_riesgo} en riesgo`}
                  sx={{
                    color: theme.palette.warning.main,
                    borderColor: theme.palette.warning.main,
                    fontSize: "0.7rem",
                  }}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<ErrorOutline sx={{ fontSize: 14 }} />}
                  label={`${resumen.proyectos_atrasados} atrasados`}
                  sx={{
                    color: theme.palette.primary.main,
                    borderColor: theme.palette.primary.main,
                    fontSize: "0.7rem",
                  }}
                  variant="outlined"
                />
              </Box>
            )}

            {groups.map((group) => (
              <Box
                key={group.label}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: group.bg,
                  border: `1px solid ${group.color}22`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: group.items.length > 0 ? 1 : 0,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ color: group.color }}>{group.icon}</Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: group.color }}
                    >
                      {group.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: group.color,
                      fontFamily: '"DM Sans", sans-serif',
                    }}
                  >
                    {group.items.length}
                  </Typography>
                </Box>

                {group.items.length > 0 && (
                  <Stack spacing={0.5}>
                    {group.items.slice(0, 3).map((p) => (
                      <Box
                        key={p.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.titulo}
                        </Typography>
                        <Box sx={{ width: 60, flexShrink: 0 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(p.porcentaje_progreso ?? 0, 100)}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: `${group.color}30`,
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: group.color,
                                borderRadius: 2,
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: group.color,
                            minWidth: 30,
                            textAlign: "right",
                          }}
                        >
                          {Math.round(p.porcentaje_progreso ?? 0)}%
                        </Typography>
                      </Box>
                    ))}
                    {group.items.length > 3 && (
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.disabled, pl: 0 }}
                      >
                        +{group.items.length - 3} más
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
