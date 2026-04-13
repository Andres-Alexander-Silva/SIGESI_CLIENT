import {
  Box,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  GroupsOutlined,
  AssignmentOutlined,
  SchoolOutlined,
  ArticleOutlined,
  TrendingUpOutlined,
  CheckCircleOutline,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import StatCard from '@/components/dashboard/StatCard';
import { useAuth } from '@/context/AuthContext';

// ── Datos de ejemplo (reemplazar cuando se implementen los endpoints) ─────────
const mockStats = {
  total_semilleros:    24,
  proyectos_activos:   38,
  total_estudiantes:  312,
  total_producciones:  45,
};

const proyectosPorFacultad = [
  { facultad: 'Ingeniería',        cantidad: 18 },
  { facultad: 'Cs. Empresariales', cantidad: 12 },
  { facultad: 'Educación',         cantidad: 10 },
  { facultad: 'Cs. Básicas',       cantidad:  9 },
  { facultad: 'Cs. Agrarias',      cantidad:  8 },
  { facultad: 'Cs. Salud',         cantidad: 10 },
];

const estadoProyectos = [
  { name: 'En formulación', value: 15, color: '#E87722' },
  { name: 'En ejecución',   value: 23, color: '#C8102E' },
  { name: 'Finalizados',    value: 29, color: '#2D6E3C' },
];

const actividadReciente = [
  { id: 1, accion: 'Nuevo proyecto registrado',    detalle: 'Inteligencia Artificial aplicada a la agricultura', semillero: 'SIAB',  fecha: '2026-04-10', estado: 'Nuevo'      },
  { id: 2, accion: 'Producción académica aprobada', detalle: 'Artículo publicado en revista indexada',           semillero: 'GRIIS', fecha: '2026-04-09', estado: 'Aprobado'   },
  { id: 3, accion: 'Avance de fase',               detalle: 'Proyecto de robótica pasó a fase de ejecución',    semillero: 'SIRED', fecha: '2026-04-08', estado: 'En progreso' },
  { id: 4, accion: 'Estudiante vinculado',          detalle: 'Carlos Mendoza se unió al semillero',             semillero: 'SIGESI',fecha: '2026-04-07', estado: 'Nuevo'      },
  { id: 5, accion: 'Convocatoria abierta',          detalle: 'Convocatoria interna 2026-I',                     semillero: 'Todos', fecha: '2026-04-06', estado: 'Activa'     },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Nuevo':       return { bg: isDark ? 'rgba(59,91,219,0.15)'  : '#EDF2FF', color: isDark ? '#748FFC' : '#3B5BDB' };
      case 'Aprobado':    return { bg: isDark ? 'rgba(45,110,60,0.15)'  : '#EBFBEE', color: theme.palette.secondary.main };
      case 'En progreso': return { bg: isDark ? 'rgba(232,119,34,0.15)' : '#FFF4E6', color: theme.palette.warning.main };
      case 'Activa':      return { bg: isDark ? 'rgba(200,16,46,0.15)'  : '#FFF0F0', color: theme.palette.primary.main };
      default:            return { bg: theme.palette.action?.hover ?? (isDark ? 'rgba(255,255,255,0.05)' : '#F1F3F5'), color: theme.palette.text.secondary };
    }
  };

  const chartTickColor = theme.palette.text.disabled;
  const chartGridColor = theme.palette.divider;
  const tooltipStyle   = {
    borderRadius: 8,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography
          variant="h4"
          sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.disabled }}>
          Bienvenido de nuevo, {user?.first_name || 'Usuario'}. Aquí tienes un resumen de la actividad.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Semilleros"       value={mockStats.total_semilleros}   icon={<GroupsOutlined />}     color={theme.palette.primary.main}   bgColor={`rgba(200,16,46,${isDark?'0.15':'0.08'})`}  trend={8}  />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Proyectos Activos" value={mockStats.proyectos_activos}  icon={<AssignmentOutlined />} color={theme.palette.warning.main}   bgColor={`rgba(232,119,34,${isDark?'0.15':'0.08'})`} trend={12} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Estudiantes"       value={mockStats.total_estudiantes}  icon={<SchoolOutlined />}     color={theme.palette.secondary.main} bgColor={`rgba(45,110,60,${isDark?'0.15':'0.08'})`}  trend={5}  />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Producciones"      value={mockStats.total_producciones} icon={<ArticleOutlined />}    color={theme.palette.info.main}      bgColor={`rgba(59,91,219,${isDark?'0.15':'0.08'})`}  trend={-3} />
        </Grid>
      </Grid>

      {/* Gráficas */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpOutlined sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                    Proyectos por Facultad
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proyectosPorFacultad} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis dataKey="facultad" tick={{ fontSize: 11, fill: chartTickColor }} tickLine={false} axisLine={{ stroke: chartGridColor }} />
                  <YAxis tick={{ fontSize: 11, fill: chartTickColor }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="cantidad" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleOutline sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                    Estado de Proyectos
                  </Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estadoProyectos} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {estadoProyectos.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>{v}</span>} />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Semilleros destacados + Actividad reciente */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title={<Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>Semilleros Destacados</Typography>}
              sx={{ pb: 1 }}
            />
            <CardContent>
              {[
                { name: 'GRIIS - Ingeniería de Software', progress: 85, color: theme.palette.primary.main },
                { name: 'SIAB - Agroindustria',           progress: 72, color: theme.palette.warning.main },
                { name: 'SIRED - Redes y Datos',          progress: 68, color: theme.palette.secondary.main },
                { name: 'GIFEAH - Educación',             progress: 55, color: theme.palette.info.main },
              ].map((item) => (
                <Box key={item.name} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>{item.name}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: item.color }}>{item.progress}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.progress}
                    sx={{
                      height: 6, borderRadius: 3,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.palette.grey[100],
                      '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: item.color },
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title={<Typography variant="subtitle1" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>Actividad Reciente</Typography>}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ px: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Acción', 'Semillero', 'Estado', 'Fecha'].map((h) => (
                        <TableCell key={h} sx={{ color: theme.palette.text.disabled, fontWeight: 600, fontSize: '0.75rem' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actividadReciente.map((item) => {
                      const s = getEstadoColor(item.estado);
                      return (
                        <TableRow key={item.id} hover sx={{ '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>{item.accion}</Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>{item.detalle}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.semillero} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.palette.grey[100], color: theme.palette.text.secondary }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={item.estado} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>{item.fecha}</Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
