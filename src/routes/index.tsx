import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Typography, Box } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage    from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import UsersPage    from '@/pages/config/UsersPage';
import MenusPage    from '@/pages/config/MenusPage';
import OpcionesPage from '@/pages/config/OpcionesPage';
import PermisosPage from '@/pages/config/PermisosPage';

const router = createBrowserRouter([
  // ── Ruta pública ──────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
  },

  // ── Rutas protegidas ──────────────────────────────────────────────────────
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true,            element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard',      element: <DashboardPage /> },

          // Módulos principales (placeholder hasta implementar)
          { path: 'semilleros',    element: <PlaceholderPage title="Semilleros" /> },
          { path: 'grupos',        element: <PlaceholderPage title="Grupos de Investigación" /> },
          { path: 'proyectos',     element: <PlaceholderPage title="Proyectos" /> },
          { path: 'produccion',    element: <PlaceholderPage title="Producción Académica" /> },
          { path: 'convocatorias', element: <PlaceholderPage title="Convocatorias" /> },
          { path: 'reportes',      element: <PlaceholderPage title="Reportes" /> },

          // Configuración
          { path: 'configuracion/usuarios',    element: <UsersPage /> },
          { path: 'configuracion/menus',       element: <MenusPage /> },
          { path: 'configuracion/opciones',    element: <OpcionesPage /> },
          { path: 'configuracion/permisos',    element: <PermisosPage /> },

          // Cualquier ruta desconocida dentro de la app → dashboard
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },

  // ── Fallback para rutas fuera del layout (ej: /login mal escrito) ─────────
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

function PlaceholderPage({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
      <Typography variant="h4" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: theme.palette.text.disabled }}>
        Este módulo estará disponible próximamente.
      </Typography>
    </Box>
  );
}

export default router;
