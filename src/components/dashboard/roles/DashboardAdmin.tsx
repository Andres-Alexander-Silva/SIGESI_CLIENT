import {
  Box,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  GroupsOutlined,
  AssignmentOutlined,
  SchoolOutlined,
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

// ── Datos de ejemplo (reemplazar cuando se implementen los endpoints) ─────────
const mockStats = {
  total_semilleros: 0,
  proyectos_activos: 0,
  total_estudiantes: 0,
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

export default function DashboardAdmin({ user }: { user: any }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

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

      {/* Stat Cards - Solo 3 para Administrador */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard 
            title="Semilleros" 
            value={mockStats.total_semilleros} 
            icon={<GroupsOutlined />} 
            color={theme.palette.primary.main} 
            bgColor={`rgba(200,16,46,${isDark?'0.15':'0.08'})`} 
            trend={0} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard 
            title="Proyectos Activos" 
            value={mockStats.proyectos_activos} 
            icon={<AssignmentOutlined />} 
            color={theme.palette.warning.main} 
            bgColor={`rgba(232,119,34,${isDark?'0.15':'0.08'})`} 
            trend={0} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard 
            title="Estudiantes" 
            value={mockStats.total_estudiantes} 
            icon={<SchoolOutlined />} 
            color={theme.palette.secondary.main} 
            bgColor={`rgba(45,110,60,${isDark?'0.15':'0.08'})`} 
            trend={0} 
          />
        </Grid>
      </Grid>

      {/* Gráficas */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
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
    </Box>
  );
}
