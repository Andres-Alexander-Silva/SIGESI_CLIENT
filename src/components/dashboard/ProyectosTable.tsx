import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Skeleton,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Search,
  AssignmentOutlined,
  WarningAmberOutlined,
  CheckCircleOutline,
  ErrorOutline,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { MetricaProyecto } from "@/services/dashboard.service";

interface ProyectosTableProps {
  proyectos: MetricaProyecto[];
  loading: boolean;
  error: string | null;
}

const ESTADO_LABELS: Record<string, string> = {
  idea: "Idea",
  propuesta: "Propuesta",
  en_ejecucion: "En Ejecución",
  en_resultados: "En Resultados",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

const CRONOGRAMA_CONFIG = {
  al_dia: {
    label: "Al día",
    color: "success" as const,
    icon: <CheckCircleOutline sx={{ fontSize: 14 }} />,
  },
  atrasado: {
    label: "Atrasado",
    color: "error" as const,
    icon: <ErrorOutline sx={{ fontSize: 14 }} />,
  },
  en_riesgo: {
    label: "En riesgo",
    color: "warning" as const,
    icon: <WarningAmberOutlined sx={{ fontSize: 14 }} />,
  },
};

const ESTADO_COLORS: Record<
  string,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  idea: "default",
  propuesta: "info",
  en_ejecucion: "primary",
  en_resultados: "secondary",
  cerrado: "success",
  cancelado: "error",
};

export default function ProyectosTable({
  proyectos,
  loading,
  error,
}: ProyectosTableProps) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCronograma, setFiltroCronograma] = useState("todos");

  const filtered = proyectos.filter((p) => {
    const matchSearch =
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
    const matchCronograma =
      filtroCronograma === "todos" || p.estado_cronograma === filtroCronograma;
    return matchSearch && matchEstado && matchCronograma;
  });

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentOutlined
              sx={{ color: theme.palette.primary.main, fontSize: 20 }}
            />
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
              }}
            >
              Seguimiento de Proyectos
            </Typography>
          </Box>
        }
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Buscar proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 180 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                displayEmpty
              >
                <MenuItem value="todos">Todos los estados</MenuItem>
                <MenuItem value="idea">Idea</MenuItem>
                <MenuItem value="propuesta">Propuesta</MenuItem>
                <MenuItem value="en_ejecucion">En Ejecución</MenuItem>
                <MenuItem value="en_resultados">En Resultados</MenuItem>
                <MenuItem value="cerrado">Cerrado</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={filtroCronograma}
                onChange={(e) => setFiltroCronograma(e.target.value)}
                displayEmpty
              >
                <MenuItem value="todos">Todos los cronogramas</MenuItem>
                <MenuItem value="al_dia">Al día</MenuItem>
                <MenuItem value="en_riesgo">En riesgo</MenuItem>
                <MenuItem value="atrasado">Atrasados</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
        sx={{ pb: 0, flexWrap: "wrap", gap: 1 }}
      />

      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: theme.palette.text.disabled,
                  }}
                >
                  PROYECTO
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: theme.palette.text.disabled,
                  }}
                >
                  ESTADO
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: theme.palette.text.disabled,
                    minWidth: 160,
                  }}
                >
                  PROGRESO
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: theme.palette.text.disabled,
                  }}
                >
                  CRONOGRAMA
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: theme.palette.text.disabled,
                  }}
                >
                  RESPONSABLE
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: theme.palette.text.disabled,
                  }}
                >
                  ALERTAS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" width="80%" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.disabled }}
                    >
                      No se encontraron proyectos con los filtros aplicados.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((proyecto) => {
                  const cronConfig =
                    CRONOGRAMA_CONFIG[proyecto.estado_cronograma];
                  const progreso =
                    proyecto.total_actividades > 0
                      ? Math.round(
                          (proyecto.actividades_completadas /
                            proyecto.total_actividades) *
                            100,
                        )
                      : (proyecto.porcentaje_progreso ?? 0);

                  return (
                    <TableRow
                      key={proyecto.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, lineHeight: 1.3 }}
                          >
                            {proyecto.titulo}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.disabled }}
                          >
                            {proyecto.codigo}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            ESTADO_LABELS[proyecto.estado] ?? proyecto.estado
                          }
                          color={ESTADO_COLORS[proyecto.estado] ?? "default"}
                          size="small"
                          sx={{ fontSize: "0.7rem", height: 22 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box sx={{ minWidth: 120 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              {proyecto.actividades_completadas}/
                              {proyecto.total_actividades} actividades
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              {progreso}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(progreso, 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: theme.palette.divider,
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                backgroundColor:
                                  progreso >= 75
                                    ? theme.palette.secondary.main
                                    : progreso >= 40
                                      ? theme.palette.warning.main
                                      : theme.palette.primary.main,
                              },
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={cronConfig.icon}
                          label={cronConfig.label}
                          color={cronConfig.color}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 22 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box>
                          {proyecto.director_nombre && (
                            <Typography
                              variant="caption"
                              sx={{ display: "block", lineHeight: 1.4 }}
                            >
                              Dir: {proyecto.director_nombre}
                            </Typography>
                          )}
                          {proyecto.lider_nombre && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                lineHeight: 1.4,
                                color: theme.palette.text.disabled,
                              }}
                            >
                              Líder: {proyecto.lider_nombre}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        {proyecto.alertas && proyecto.alertas.length > 0 ? (
                          <Tooltip
                            title={
                              <Box>
                                {proyecto.alertas.map((a, i) => (
                                  <Typography
                                    key={i}
                                    variant="caption"
                                    sx={{ display: "block" }}
                                  >
                                    • {a}
                                  </Typography>
                                ))}
                              </Box>
                            }
                          >
                            <Chip
                              icon={
                                <WarningAmberOutlined sx={{ fontSize: 14 }} />
                              }
                              label={`${proyecto.alertas.length} alerta${proyecto.alertas.length > 1 ? "s" : ""}`}
                              color="warning"
                              size="small"
                              sx={{
                                fontSize: "0.7rem",
                                height: 22,
                                cursor: "help",
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.disabled }}
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
