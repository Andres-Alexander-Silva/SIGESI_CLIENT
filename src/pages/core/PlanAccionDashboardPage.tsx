// src/pages/core/PlanAccionDashboardPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Paper, Grid, Chip,
  CircularProgress, Alert, Button, Divider,
  LinearProgress, Tooltip, Card, CardContent,
  IconButton,
} from '@mui/material';
import ArrowBackIcon        from '@mui/icons-material/ArrowBack';
import AssignmentIcon       from '@mui/icons-material/Assignment';
import CheckCircleIcon      from '@mui/icons-material/CheckCircle';
import WarningAmberIcon     from '@mui/icons-material/WarningAmber';
import AccessTimeIcon       from '@mui/icons-material/AccessTime';
import CategoryIcon         from '@mui/icons-material/Category';
import GroupIcon            from '@mui/icons-material/Group';
import RefreshIcon          from '@mui/icons-material/Refresh';
import TrendingUpIcon       from '@mui/icons-material/TrendingUp';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartTooltip, Legend,
         BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import { planAccionService }   from '@/services/planAccion.service';
import {
  DashboardPlanAccion, DashboardObjetivosCategoria,
  CATEGORIA_LABELS, ESTADO_PLAN_LABELS, ESTADO_PLAN_COLOR,
  EstadoPlanAccion,
} from '@/types/planAccion';

// ─── Paleta coherente con el proyecto ─────────────────────────────────────────
const CATEGORIA_COLORS: Record<string, string> = {
  academicos:      '#3B5BDB',
  investigativos:  '#2D6E3C',
  administrativos: '#C8102E',
  institucionales: '#E67700',
};

const DEFAULT_COLOR = '#868E96';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon:    React.ReactNode;
  label:   string;
  value:   string | number;
  sub?:    string;
  color?:  string;
  bgcolor?: string;
}

function KpiCard({ icon, label, value, sub, color = '#1A1A2E', bgcolor = '#F8F9FA' }: KpiCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5, bgcolor, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: '14px !important' }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          bgcolor: `${color}18`, color, flexShrink: 0,
        }}>
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
            <Typography variant="caption" color="text.secondary">{sub}</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Progress bar con label ───────────────────────────────────────────────────
function LabeledProgress({ value, label, color = 'primary' }: { value: number; label?: string; color?: string }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={0.5}>
        {label && <Typography variant="caption" color="text.secondary">{label}</Typography>}
        <Typography variant="caption" fontWeight={700}>{value.toFixed(1)}%</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(value, 100)}
        sx={{
          height: 10, borderRadius: 5,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 },
        }}
      />
    </Box>
  );
}

// ─── Chip de estado (reutiliza colores del proyecto) ──────────────────────────
function EstadoChip({ estado }: { estado: EstadoPlanAccion }) {
  return (
    <Chip
      label={ESTADO_PLAN_LABELS[estado] ?? estado}
      color={ESTADO_PLAN_COLOR[estado] ?? 'default'}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
    />
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PlanAccionDashboardPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const planId     = Number(id);

  const [data,    setData]    = useState<DashboardPlanAccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await planAccionService.dashboard(planId);
      setData(result);
    } catch (e: any) {
      const msg = e?.response?.data?.detail
        ?? e?.response?.data?.message
        ?? 'Error al cargar el dashboard del plan de acción.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Render: cargando ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} />
          <Typography color="text.secondary">Cargando métricas del plan…</Typography>
        </Stack>
      </Box>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Volver
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!data) return null;

  // ── Datos para gráficos ────────────────────────────────────────────────────
  const pieData = data.objetivos_por_categoria
    .filter(o => o.count > 0)
    .map((o: DashboardObjetivosCategoria) => ({
      name:  CATEGORIA_LABELS[o.categoria] ?? o.categoria,
      value: o.count,
      color: CATEGORIA_COLORS[o.categoria] ?? DEFAULT_COLOR,
    }));

  const barData = data.por_responsable.map(r => ({
    name:       r.responsable_nombre.split(' ')[0], // primer nombre
    fullName:   r.responsable_nombre,
    asignadas:  r.asignadas,
    completadas: r.completadas,
  }));

  const cumplimientoColor =
    data.porcentaje_cronograma >= 80 ? '#2D6E3C'
    : data.porcentaje_cronograma >= 50 ? '#E67700'
    : '#C8102E';

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
             alignItems={{ sm: 'center' }} mb={3} spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <AssignmentIcon color="primary" />
              <Typography variant="h5" fontWeight={800} fontFamily='"DM Sans", sans-serif'>
                Dashboard — {data.titulo}
              </Typography>
              <EstadoChip estado={data.estado} />
            </Stack>
            <Typography variant="body2" color="text.secondary" mt={0.3}>
              {data.semillero} · Semestre {data.semestre}
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Actualizar métricas">
          <IconButton onClick={fetchData} size="small" color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── KPIs principales ───────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<TrendingUpIcon fontSize="small" />}
            label="Cumplimiento cronograma"
            value={`${data.porcentaje_cronograma.toFixed(1)}%`}
            sub={`${data.actividades_completadas} de ${data.total_actividades_cronograma} actividades`}
            color={cumplimientoColor}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<CheckCircleIcon fontSize="small" />}
            label="Actividades completadas"
            value={data.actividades_completadas}
            sub={`de ${data.total_actividades_cronograma} totales`}
            color="#2D6E3C"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<AccessTimeIcon fontSize="small" />}
            label="A tiempo"
            value={data.actividades_a_tiempo}
            sub="actividades dentro del plazo"
            color="#3B5BDB"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<WarningAmberIcon fontSize="small" />}
            label="Atrasadas"
            value={data.actividades_atrasadas}
            sub="fuera del plazo estimado"
            color={data.actividades_atrasadas > 0 ? '#C8102E' : '#868E96'}
          />
        </Grid>
      </Grid>

      {/* ── Progreso de cumplimiento ────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={1.5} display="flex" alignItems="center" gap={0.8}>
          <TrendingUpIcon fontSize="small" color="primary" />
          Progreso general del cronograma
        </Typography>
        <LabeledProgress value={data.porcentaje_cronograma} color={cumplimientoColor} />
        <Stack direction="row" spacing={3} mt={1.5} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary">
            ✅ Completadas: <strong>{data.actividades_completadas}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ⏳ Pendientes: <strong>{data.total_actividades_cronograma - data.actividades_completadas}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            🟢 A tiempo: <strong>{data.actividades_a_tiempo}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            🔴 Atrasadas: <strong>{data.actividades_atrasadas}</strong>
          </Typography>
        </Stack>
      </Paper>

      {/* ── Gráficos ───────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} mb={3}>

        {/* Pie: objetivos por categoría */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.8}>
              <CategoryIcon fontSize="small" color="primary" />
              Objetivos por categoría
            </Typography>
            {pieData.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Sin objetivos registrados.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartTooltip formatter={(v: number, name: string) => [`${v} objetivo(s)`, name]} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Bar: actividades por responsable */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.8}>
              <GroupIcon fontSize="small" color="primary" />
              Actividades por responsable
            </Typography>
            {barData.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Sin responsables asignados.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <RechartTooltip
                    formatter={(value: number, name: string) => [value, name === 'asignadas' ? 'Asignadas' : 'Completadas']}
                    labelFormatter={(label: string, payload: any[]) => {
                      const entry = payload?.[0]?.payload;
                      return entry?.fullName ?? label;
                    }}
                  />
                  <Legend formatter={(v: string) => v === 'asignadas' ? 'Asignadas' : 'Completadas'} />
                  <Bar dataKey="asignadas"   fill="#3B5BDB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completadas" fill="#2D6E3C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Tabla de responsables detallada ────────────────────────────────── */}
      {data.por_responsable.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.8}>
            <GroupIcon fontSize="small" color="primary" />
            Detalle por responsable
          </Typography>
          <Stack spacing={1.5}>
            {data.por_responsable.map((r, i) => {
              const pct = r.asignadas > 0 ? (r.completadas / r.asignadas) * 100 : 0;
              const color = pct >= 80 ? '#2D6E3C' : pct >= 50 ? '#E67700' : '#C8102E';
              return (
                <Box key={i}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontWeight={600}>{r.responsable_nombre}</Typography>
                    <Stack direction="row" spacing={1.5}>
                      <Typography variant="caption" color="text.secondary">
                        {r.completadas}/{r.asignadas} completadas
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color={color}>
                        {pct.toFixed(0)}%
                      </Typography>
                    </Stack>
                  </Stack>
                  <LabeledProgress value={pct} color={color} />
                  {i < data.por_responsable.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* ── Distribución de objetivos (tabla) ──────────────────────────────── */}
      {data.objetivos_por_categoria.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2} display="flex" alignItems="center" gap={0.8}>
            <CategoryIcon fontSize="small" color="primary" />
            Distribución de objetivos
          </Typography>
          <Grid container spacing={1.5}>
            {data.objetivos_por_categoria.map(o => (
              <Grid item xs={6} md={3} key={o.categoria}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5, borderRadius: 2, textAlign: 'center',
                    borderColor: CATEGORIA_COLORS[o.categoria] ?? DEFAULT_COLOR,
                    borderWidth: 2,
                  }}
                >
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    color={CATEGORIA_COLORS[o.categoria] ?? DEFAULT_COLOR}
                  >
                    {o.count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {CATEGORIA_LABELS[o.categoria] ?? o.categoria}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
