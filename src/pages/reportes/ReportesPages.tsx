import { useState, useEffect, useCallback, type DependencyList } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Skeleton,
  LinearProgress,
} from "@mui/material";
import {
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  BarChart as BarChartIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";

import { reportesService } from "@/services/reportes.service";
import type {
  DashboardIndicadores,
  ReporteProyecto,
  ReporteSemillero,
  Informe,
  PaginatedResponse,
} from "@/services/reportes.service";
import { formatApiError } from "@/utils/apiError";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type UserRole =
  | "administrador"
  | "director_grupo"
  | "director_semillero"
  | "lider_estudiantil"
  | "estudiante";

// ─── Constantes & helpers ─────────────────────────────────────────────────────

const SEMESTRES = ["2025-1", "2025-2", "2024-1", "2024-2", "2023-1", "2023-2"];

const ESTADO_PROYECTO_LABEL: Record<string, string> = {
  idea: "Idea",
  propuesta: "Propuesta",
  en_ejecucion: "En ejecución",
  en_resultados: "En resultados",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

const ESTADO_PROYECTO_COLOR: Record<
  string,
  "default" | "warning" | "info" | "success" | "error" | "primary"
> = {
  idea: "default",
  propuesta: "warning",
  en_ejecucion: "info",
  en_resultados: "primary",
  cerrado: "success",
  cancelado: "error",
};

const TIPO_INFORME_LABEL: Record<string, string> = {
  mensual: "Mensual",
  semestral: "Semestral",
  anual: "Anual",
  especial: "Especial",
};

const ESTADO_INFORME_COLOR: Record<
  string,
  "default" | "warning" | "info" | "success"
> = {
  borrador: "default",
  generado: "info",
  revisado: "warning",
  aprobado: "success",
};

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Hook de API ──────────────────────────────────────────────────────────────
// Usa el cliente axios centralizado (services/api.ts): token inyectado y
// refresco automático en 401 vía sus interceptores, en vez de `fetch` crudo.

function useApiCall<T>(
  fetcher: (() => Promise<T>) | null,
  deps: DependencyList,
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!fetcher) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(formatApiError(e, "No se pudo cargar la información."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, refetch };
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/** Tarjeta de indicador del dashboard */
function IndicadorCard({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  loading: boolean;
}) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        p: 2.5,
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        transition: "box-shadow .2s",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#fff",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/** Barra de progreso con etiqueta */
function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        {label && (
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        )}
        <Typography variant="caption" fontWeight={600}>
          {fmtPct(value)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(value, 100)}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: "action.hover",
          "& .MuiLinearProgress-bar": {
            borderRadius: 3,
            bgcolor:
              value >= 75
                ? "success.main"
                : value >= 40
                  ? "warning.main"
                  : "error.main",
          },
        }}
      />
    </Box>
  );
}

/** Sección vacía */
function EmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        color: "text.secondary",
      }}
    >
      <AnalyticsIcon sx={{ fontSize: 48, opacity: 0.3 }} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}

// ─── Vista por rol: ESTUDIANTE ────────────────────────────────────────────────

function VistaEstudiante({ token }: { token: string }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, error, refetch } = useApiCall<
    PaginatedResponse<ReporteProyecto>
  >(
    () =>
      reportesService.getReporteProyectos({
        page: page + 1,
        search: debouncedSearch || undefined,
      }),
    [page, debouncedSearch],
  );

  return (
    <Stack spacing={3}>
      {/* Encabezado */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Mis actividades y proyectos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Consulta el estado de tus proyectos y avances registrados.
        </Typography>
      </Box>

      {/* Filtro */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Buscar proyecto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.disabled" }}
              />
            ),
            endAdornment: search ? (
              <IconButton size="small" onClick={() => setSearch("")}>
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
          }}
          sx={{ minWidth: 280 }}
        />
        <Tooltip title="Recargar">
          <IconButton onClick={refetch}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Tabla */}
      <TableContainer
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "background.surface" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Proyecto
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Estado
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Avance
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Actividades
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                Producciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.results.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {p.titulo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ESTADO_PROYECTO_LABEL[p.estado]}
                        color={ESTADO_PROYECTO_COLOR[p.estado]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <ProgressBar value={p.avance_global} />
                    </TableCell>
                    <TableCell>
                      {p.actividades_completadas}/{p.total_actividades}
                    </TableCell>
                    <TableCell>{p.cantidad_producciones}</TableCell>
                  </TableRow>
                ))}
            {!loading && !data?.results.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState message="No se encontraron proyectos." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && (
          <TablePagination
            component="div"
            count={data.count}
            page={page}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
            onPageChange={(_, p) => setPage(p)}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
          />
        )}
      </TableContainer>
    </Stack>
  );
}

// ─── Vista: DIRECTOR DE SEMILLERO / DIRECTOR DE GRUPO ─────────────────────────

function VistaDirector({ token, role }: { token: string; role: UserRole }) {
  const isAdmin = role === "administrador" || role === "director_grupo";

  // Filtros
  const [semestre, setSemestre] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tabActiva, setTabActiva] = useState<
    "proyectos" | "semilleros" | "informes"
  >("proyectos");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Dashboard
  const { data: dashboard, loading: loadingDash } =
    useApiCall<DashboardIndicadores>(
      () => reportesService.getDashboard({ semestre: semestre || undefined }),
      [semestre],
    );

  // Proyectos
  const {
    data: proyectosData,
    loading: loadingProyectos,
    error: errorProyectos,
    refetch: refetchProyectos,
  } = useApiCall<PaginatedResponse<ReporteProyecto>>(
    tabActiva === "proyectos"
      ? () =>
          reportesService.getReporteProyectos({
            page: page + 1,
            search: debouncedSearch || undefined,
          })
      : null,
    [tabActiva, page, debouncedSearch],
  );

  // Semilleros
  const {
    data: semillerosData,
    loading: loadingSemilleros,
    error: errorSemilleros,
    refetch: refetchSemilleros,
  } = useApiCall<PaginatedResponse<ReporteSemillero>>(
    tabActiva === "semilleros"
      ? () => reportesService.getReporteSemilleros({ page: page + 1 })
      : null,
    [tabActiva, page],
  );

  // Informes
  const {
    data: informesData,
    loading: loadingInformes,
    error: errorInformes,
    refetch: refetchInformes,
  } = useApiCall<PaginatedResponse<Informe>>(
    tabActiva === "informes"
      ? () =>
          reportesService.getInformes({
            page: page + 1,
            semestre: semestre || undefined,
            search: debouncedSearch || undefined,
          })
      : null,
    [tabActiva, page, semestre, debouncedSearch],
  );

  const handleTabChange = (t: typeof tabActiva) => {
    setTabActiva(t);
    setPage(0);
    setSearch("");
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportesService.exportarExcel({
        semestre: semestre || undefined,
        search: debouncedSearch || undefined,
      });
    } catch (e) {
      console.error("Error al exportar:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack spacing={3}>
      {/* ─── Encabezado ─────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Reportes e indicadores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin
              ? "Vista institucional · todos los semilleros y proyectos"
              : "Vista de semillero · proyectos y actividades bajo tu dirección"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={
              exporting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <FileDownloadIcon />
              )
            }
            onClick={handleExport}
            disabled={exporting}
            size="small"
          >
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        </Stack>
      </Box>

      {/* ─── Filtros globales ────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 2,
          alignItems: "center",
        }}
      >
        <FilterListIcon fontSize="small" color="action" />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Semestre</InputLabel>
          <Select
            label="Semestre"
            value={semestre}
            onChange={(e) => setSemestre(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {SEMESTRES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <SearchIcon
                fontSize="small"
                sx={{ mr: 1, color: "text.disabled" }}
              />
            ),
            endAdornment: search ? (
              <IconButton size="small" onClick={() => setSearch("")}>
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null,
          }}
          sx={{ minWidth: 240 }}
        />
        {(semestre || search) && (
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setSemestre("");
              setSearch("");
            }}
          >
            Limpiar
          </Button>
        )}
      </Box>

      {/* ─── Dashboard indicadores ───────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 2,
        }}
      >
        <IndicadorCard
          icon={<ScienceIcon fontSize="small" />}
          label="Proyectos activos"
          value={dashboard?.proyectos_activos ?? "—"}
          color="#C8102E"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<GroupsIcon fontSize="small" />}
          label="Estudiantes activos"
          value={dashboard?.estudiantes_activos ?? "—"}
          color="#2D6E3C"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<AssignmentIcon fontSize="small" />}
          label="Producción académica"
          value={dashboard?.produccion_academica ?? "—"}
          color="#3B5BDB"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<CheckCircleIcon fontSize="small" />}
          label="Actividades completadas"
          value={dashboard?.actividades_completadas ?? "—"}
          color="#E87722"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<TrendingUpIcon fontSize="small" />}
          label="Cumplimiento semestral"
          value={
            dashboard?.cumplimiento_semestral !== undefined
              ? fmtPct(dashboard.cumplimiento_semestral)
              : "—"
          }
          color="#0F6E56"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<BarChartIcon fontSize="small" />}
          label="Evaluaciones registradas"
          value={dashboard?.evaluaciones_registradas ?? "—"}
          color="#534AB7"
          loading={loadingDash}
        />
      </Box>

      {/* ─── Tabs ─────────────────────────────────────────────── */}
      <Box>
        <Stack
          direction="row"
          spacing={0}
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          {(
            [
              { key: "proyectos", label: "Proyectos" },
              { key: "semilleros", label: "Semilleros" },
              { key: "informes", label: "Informes" },
            ] as const
          ).map(({ key, label }) => (
            <Button
              key={key}
              variant="text"
              onClick={() => handleTabChange(key)}
              sx={{
                borderRadius: 0,
                px: 3,
                py: 1.5,
                fontWeight: tabActiva === key ? 700 : 400,
                color: tabActiva === key ? "primary.main" : "text.secondary",
                borderBottom:
                  tabActiva === key ? "2px solid" : "2px solid transparent",
                borderColor: tabActiva === key ? "primary.main" : "transparent",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {label}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* ─── Tabla: Proyectos ─────────────────────────────────── */}
      {tabActiva === "proyectos" && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Tooltip title="Recargar">
              <IconButton size="small" onClick={refetchProyectos}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {errorProyectos && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorProyectos}
            </Alert>
          )}
          <TableContainer
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Proyecto
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Estado
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Avance
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Actividades
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Producciones
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Estudiantes
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Director
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Inicio
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingProyectos
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : proyectosData?.results.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ maxWidth: 220 }}
                          >
                            {p.titulo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.codigo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ESTADO_PROYECTO_LABEL[p.estado]}
                            color={ESTADO_PROYECTO_COLOR[p.estado]}
                            size="small"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 130 }}>
                          <ProgressBar value={p.avance_global} />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {p.actividades_completadas}
                            <Typography
                              component="span"
                              color="text.secondary"
                              variant="caption"
                            >
                              /{p.total_actividades}
                            </Typography>
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {p.cantidad_producciones}
                        </TableCell>
                        <TableCell align="center">
                          {p.estudiantes_activos_count}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" noWrap>
                            {p.director?.nombre_completo ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {fmtDate(p.fecha_inicio)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                {!loadingProyectos && !proyectosData?.results.length && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState message="No hay proyectos para los filtros seleccionados." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {proyectosData && (
              <TablePagination
                component="div"
                count={proyectosData.count}
                page={page}
                rowsPerPage={10}
                rowsPerPageOptions={[10]}
                onPageChange={(_, p) => setPage(p)}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count}`
                }
              />
            )}
          </TableContainer>
        </Box>
      )}

      {/* ─── Tabla: Semilleros ────────────────────────────────── */}
      {tabActiva === "semilleros" && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Tooltip title="Recargar">
              <IconButton size="small" onClick={refetchSemilleros}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {errorSemilleros && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorSemilleros}
            </Alert>
          )}
          <TableContainer
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Semillero
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Director
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Proyectos
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Activos
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Matrículas
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Producciones
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Creación
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingSemilleros
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : semillerosData?.results.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {s.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {s.codigo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {s.director?.nombre_completo ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {s.total_proyectos}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={s.proyectos_activos}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {s.total_matriculas}
                        </TableCell>
                        <TableCell align="center">
                          {s.total_producciones}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {fmtDate(s.fecha_creacion)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                {!loadingSemilleros && !semillerosData?.results.length && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState message="No hay semilleros registrados." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {semillerosData && (
              <TablePagination
                component="div"
                count={semillerosData.count}
                page={page}
                rowsPerPage={10}
                rowsPerPageOptions={[10]}
                onPageChange={(_, p) => setPage(p)}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count}`
                }
              />
            )}
          </TableContainer>
        </Box>
      )}

      {/* ─── Tabla: Informes ─────────────────────────────────── */}
      {tabActiva === "informes" && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Tooltip title="Recargar">
              <IconButton size="small" onClick={refetchInformes}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {errorInformes && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorInformes}
            </Alert>
          )}
          <TableContainer
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Table size="small">
              <TableHead sx={{ bgcolor: "background.default" }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Título
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Tipo
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Semestre
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Estado
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Generado
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.73rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Archivo
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingInformes
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : informesData?.results.map((inf) => (
                      <TableRow key={inf.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ maxWidth: 260 }}
                          >
                            {inf.titulo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {TIPO_INFORME_LABEL[inf.tipo]}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={inf.semestre}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={inf.estado}
                            color={
                              ESTADO_INFORME_COLOR[inf.estado] ?? "default"
                            }
                            size="small"
                            sx={{
                              textTransform: "capitalize",
                              fontSize: "0.7rem",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {fmtDate(inf.fecha_generacion)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {inf.archivo ? (
                            <Tooltip title="Descargar archivo">
                              <IconButton
                                size="small"
                                component="a"
                                href={inf.archivo}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                {!loadingInformes && !informesData?.results.length && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState message="No se encontraron informes para los filtros seleccionados." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {informesData && (
              <TablePagination
                component="div"
                count={informesData.count}
                page={page}
                rowsPerPage={10}
                rowsPerPageOptions={[10]}
                onPageChange={(_, p) => setPage(p)}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count}`
                }
              />
            )}
          </TableContainer>
        </Box>
      )}
    </Stack>
  );
}

// ─── Vista: DIRECTOR DE PROGRAMA / ADMINISTRADOR ─────────────────────────────

function VistaAdministrador({ token }: { token: string }) {
  const { data: dashboard, loading: loadingDash } =
    useApiCall<DashboardIndicadores>(
      () => reportesService.getDashboard({ scope: "administrador" }),
      [],
    );

  const { data: semillerosData, loading: loadingSemilleros } = useApiCall<
    PaginatedResponse<ReporteSemillero>
  >(() => reportesService.getReporteSemilleros(), []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Indicadores institucionales
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Métricas globales de todos los semilleros, grupos y proyectos de
          investigación.
        </Typography>
      </Box>

      {/* KPIs */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 2,
        }}
      >
        <IndicadorCard
          icon={<ScienceIcon fontSize="small" />}
          label="Proyectos activos"
          value={dashboard?.proyectos_activos ?? "—"}
          color="#C8102E"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<GroupsIcon fontSize="small" />}
          label="Estudiantes activos"
          value={dashboard?.estudiantes_activos ?? "—"}
          color="#2D6E3C"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<AssignmentIcon fontSize="small" />}
          label="Producción académica"
          value={dashboard?.produccion_academica ?? "—"}
          color="#3B5BDB"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<CheckCircleIcon fontSize="small" />}
          label="Actividades completadas"
          value={dashboard?.actividades_completadas ?? "—"}
          color="#E87722"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<TrendingUpIcon fontSize="small" />}
          label="Cumplimiento"
          value={
            dashboard?.cumplimiento_semestral !== undefined
              ? fmtPct(dashboard.cumplimiento_semestral)
              : "—"
          }
          color="#0F6E56"
          loading={loadingDash}
        />
        <IndicadorCard
          icon={<BarChartIcon fontSize="small" />}
          label="Evaluaciones"
          value={dashboard?.evaluaciones_registradas ?? "—"}
          color="#534AB7"
          loading={loadingDash}
        />
      </Box>

      <Divider />

      {/* Tabla resumen semilleros */}
      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Resumen por semillero
        </Typography>
        <TableContainer
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Semillero</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Director</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Proyectos totales
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Proyectos activos
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Matrículas
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Producciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingSemilleros
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : semillerosData?.results.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {s.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.codigo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {s.director?.nombre_completo ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{s.total_proyectos}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={s.proyectos_activos}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{s.total_matriculas}</TableCell>
                      <TableCell align="center">
                        {s.total_producciones}
                      </TableCell>
                    </TableRow>
                  ))}
              {!loadingSemilleros && !semillerosData?.results.length && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState message="No hay semilleros registrados." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}

// ─── Componente principal exportado ──────────────────────────────────────────

interface ReportesPageProps {
  /** Token JWT del usuario autenticado */
  token: string;
  /** Rol activo del usuario */
  activeRole: UserRole;
}

/**
 * ReportesPage
 *
 * Módulo completo de reportes e indicadores para SIGESI.
 * Renderiza una vista diferente según el rol activo:
 *  - administrador / director_grupo → VistaAdministrador + VistaDirector
 *  - director_semillero / lider_estudiantil → VistaDirector
 *  - estudiante → VistaEstudiante
 *
 * Uso:
 *   <ReportesPage token={accessToken} activeRole={activeRole} />
 */
export default function ReportesPage({ token, activeRole }: ReportesPageProps) {
  if (!token) {
    return (
      <Alert severity="warning">
        Debes iniciar sesión para acceder a los reportes.
      </Alert>
    );
  }

  if (activeRole === "estudiante") {
    return <VistaEstudiante token={token} />;
  }

  if (activeRole === "administrador") {
    return <VistaAdministrador token={token} />;
  }

  // director_grupo, director_semillero, lider_estudiantil
  return <VistaDirector token={token} role={activeRole} />;
}
