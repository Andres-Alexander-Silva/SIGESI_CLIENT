// src/pages/core/CompetenciasDashboardPage.tsx
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  PsychologyOutlined,
  RefreshOutlined,
  AnalyticsOutlined,
  AssignmentOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { competenciasService } from "@/services/competencias.service";
import { evaluacionesService } from "@/services/evaluaciones.service";
import { semillerosService } from "@/services/core.service";
import { useAuth } from "@/context/AuthContext";
import { CompetenciaInvestigativa } from "@/types/competencias";
import { Evaluacion } from "@/types/evaluaciones";
import { Semillero } from "@/types/core";

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
const TIPO_COLORS: Record<string, string> = {
  autoevaluacion:   "#3B5BDB",
  heteroevaluacion: "#E67700",
};
const TIPO_LABELS: Record<string, string> = {
  autoevaluacion:   "Autoevaluación",
  heteroevaluacion: "Heteroevaluación",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon:   React.ReactNode;
  label:  string;
  value:  string | number;
  sub?:   string;
  color?: string;
}

function KpiCard({ icon, label, value, sub, color = "#1A1A2E" }: KpiCardProps) {
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
            <Typography variant="caption" color="text.secondary">
              {sub}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSemestresOptions(): string[] {
  const year = new Date().getFullYear();
  return [
    `${year - 1}-1`, `${year - 1}-2`,
    `${year}-1`,     `${year}-2`,
    `${year + 1}-1`,
  ];
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CompetenciasDashboardPage() {
  const { activeRole } = useAuth();
  const isDirector = activeRole === "director_semillero";

  const [filterSemillero, setFilterSemillero] = useState<number | "">("");
  const [filterSemestre,  setFilterSemestre]  = useState<string>("");

  const [competencias, setCompetencias] = useState<CompetenciaInvestigativa[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [semilleros,   setSemilleros]   = useState<Semillero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const compParams: { semillero?: number; is_active?: boolean } = {
        is_active: true,
      };
      if (filterSemillero) compParams.semillero = filterSemillero;

      const evalParams: { semestre?: string } = {};
      if (filterSemestre) evalParams.semestre = filterSemestre;

      const [comps, evals, seeds] = await Promise.all([
        competenciasService.list(compParams),
        evaluacionesService.list(evalParams),
        semillerosService.list(),
      ]);
      setCompetencias(comps);
      setEvaluaciones(evals);
      setSemilleros(seeds);
    } catch {
      setError("No se pudo cargar la información del dashboard.");
    } finally {
      setLoading(false);
    }
  }, [filterSemillero, filterSemestre]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Estadísticas derivadas ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const calificadas = evaluaciones.filter((e) => e.puntaje !== null);
    const promedio =
      calificadas.length > 0
        ? calificadas.reduce((sum, e) => sum + (e.puntaje ?? 0), 0) / calificadas.length
        : null;

    // Distribución de competencias por nivel
    const nivelCount: Record<string, number> = {};
    competencias.forEach((c) => {
      nivelCount[c.nivel] = (nivelCount[c.nivel] ?? 0) + 1;
    });
    const pieNivel = Object.entries(nivelCount).map(([nivel, count]) => ({
      name:  NIVEL_LABELS[nivel] ?? nivel,
      value: count,
      color: NIVEL_COLORS[nivel] ?? "#999",
    }));

    // Evaluaciones por tipo
    const tipoCount: Record<string, number> = {};
    evaluaciones.forEach((e) => {
      tipoCount[e.tipo] = (tipoCount[e.tipo] ?? 0) + 1;
    });
    const barTipo = Object.entries(tipoCount).map(([tipo, count]) => ({
      name:  TIPO_LABELS[tipo] ?? tipo,
      value: count,
      color: TIPO_COLORS[tipo] ?? "#999",
    }));

    // Evaluaciones por semestre
    const semCount: Record<string, number> = {};
    evaluaciones.forEach((e) => {
      semCount[e.semestre] = (semCount[e.semestre] ?? 0) + 1;
    });
    const barSemestre = Object.entries(semCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semestre, total]) => ({ semestre, total }));

    // Promedio por competencia (top 10, solo calificadas)
    const compMap: Record<number, { nombre: string; total: number; suma: number }> = {};
    calificadas.forEach((e) => {
      if (!compMap[e.competencia]) {
        compMap[e.competencia] = {
          nombre: e.competencia_nombre ?? `Competencia #${e.competencia}`,
          total: 0,
          suma:  0,
        };
      }
      compMap[e.competencia].total += 1;
      compMap[e.competencia].suma  += e.puntaje ?? 0;
    });
    const barCompetencia = Object.values(compMap)
      .map((c) => ({
        nombre:   c.nombre,
        promedio: parseFloat((c.suma / c.total).toFixed(1)),
      }))
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 10);

    // Stats por competencia para la tabla resumen
    const evalPorComp: Record<
      number,
      { total: number; calificadas: number; suma: number }
    > = {};
    evaluaciones.forEach((e) => {
      if (!evalPorComp[e.competencia]) {
        evalPorComp[e.competencia] = { total: 0, calificadas: 0, suma: 0 };
      }
      evalPorComp[e.competencia].total += 1;
      if (e.puntaje !== null) {
        evalPorComp[e.competencia].calificadas += 1;
        evalPorComp[e.competencia].suma += e.puntaje;
      }
    });

    return {
      totalActivas:      competencias.length,
      totalEvaluaciones: evaluaciones.length,
      calificadasCount:  calificadas.length,
      promedio,
      pieNivel,
      barTipo,
      barSemestre,
      barCompetencia,
      evalPorComp,
    };
  }, [competencias, evaluaciones]);

  // ── Render loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} />
          <Typography color="text.secondary">Cargando estadísticas…</Typography>
        </Stack>
      </Box>
    );
  }

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
          <AnalyticsOutlined sx={{ fontSize: 36, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={800} fontFamily='"DM Sans", sans-serif'>
              Dashboard de Competencias
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estadísticas y desempeño investigativo
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Actualizar">
          <IconButton onClick={load} size="small" color="primary">
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
          {!isDirector && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Semillero</InputLabel>
              <Select
                label="Semillero"
                value={filterSemillero}
                onChange={(e) => setFilterSemillero(e.target.value as number | "")}
              >
                <MenuItem value="">Todos</MenuItem>
                {semilleros.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Semestre</InputLabel>
            <Select
              label="Semestre"
              value={filterSemestre}
              onChange={(e) => setFilterSemestre(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {getSemestresOptions().map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<PsychologyOutlined fontSize="small" />}
            label="Competencias activas"
            value={stats.totalActivas}
            sub="registradas en el sistema"
            color="#9C27B0"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<AssignmentOutlined fontSize="small" />}
            label="Total evaluaciones"
            value={stats.totalEvaluaciones}
            sub={`${stats.calificadasCount} calificadas`}
            color="#3B5BDB"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<CheckCircleOutlined fontSize="small" />}
            label="Calificadas"
            value={stats.calificadasCount}
            sub={
              stats.totalEvaluaciones > 0
                ? `${Math.round((stats.calificadasCount / stats.totalEvaluaciones) * 100)}% del total`
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
      </Grid>

      {/* ── Gráficos: Nivel + Tipo ───────────────────────────────────────────── */}
      <Grid container spacing={2.5} mb={2.5}>
        {/* Pie: competencias por nivel */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, height: "100%" }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>
              Competencias por nivel
            </Typography>
            {stats.pieNivel.length === 0 ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Sin competencias registradas.
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.pieNivel}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {stats.pieNivel.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartTooltip
                    formatter={(v: number, name: string) => [`${v} competencia(s)`, name]}
                  />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Bar: evaluaciones por tipo */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, height: "100%" }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2}>
              Evaluaciones por tipo
            </Typography>
            {stats.barTipo.length === 0 ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Sin evaluaciones registradas.
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.barTipo} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <RechartTooltip
                    formatter={(v: number) => [`${v} evaluación(es)`, ""]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats.barTipo.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Evaluaciones por semestre ────────────────────────────────────────── */}
      {stats.barSemestre.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>
            Evaluaciones por semestre
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.barSemestre}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="semestre" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <RechartTooltip
                formatter={(v: number) => [`${v} evaluación(es)`, "Total"]}
              />
              <Bar dataKey="total" fill="#3B5BDB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* ── Promedio por competencia (horizontal) ───────────────────────────── */}
      {stats.barCompetencia.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>
            Promedio de puntaje por competencia (top {stats.barCompetencia.length})
          </Typography>
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, stats.barCompetencia.length * 36)}
          >
            <BarChart
              data={stats.barCompetencia}
              layout="vertical"
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 10 }}
                width={150}
              />
              <RechartTooltip
                formatter={(v: number) => [`${v} pts`, "Promedio"]}
              />
              <Bar dataKey="promedio" fill="#9C27B0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* ── Tabla resumen por competencia ───────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          mb={2}
          display="flex"
          alignItems="center"
          gap={0.8}
        >
          <PsychologyOutlined fontSize="small" color="primary" />
          Resumen por competencia
        </Typography>
        {competencias.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 3, textAlign: "center" }}
          >
            No hay competencias activas con los filtros seleccionados.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {competencias.map((comp) => {
              const ev      = stats.evalPorComp[comp.id];
              const total   = ev?.total ?? 0;
              const cal     = ev?.calificadas ?? 0;
              const avg     = cal > 0 ? (ev.suma / cal).toFixed(1) : null;
              const nColor  = NIVEL_COLORS[comp.nivel] ?? "#999";
              const nLabel  = NIVEL_LABELS[comp.nivel] ?? comp.nivel;
              return (
                <Paper key={comp.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ sm: "center" }}
                    spacing={1}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={700}>
                          {comp.nombre}
                        </Typography>
                        <Chip
                          label={nLabel}
                          size="small"
                          sx={{
                            bgcolor: nColor + "22",
                            color: nColor,
                            fontWeight: 600,
                            borderRadius: 1,
                            height: 20,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {comp.semillero?.nombre ??
                          `Semillero #${comp.semillero?.id}`}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap">
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Evaluaciones
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {total}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Calificadas
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {cal}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Promedio
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={avg ? "#E67700" : "text.disabled"}
                        >
                          {avg ?? "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
