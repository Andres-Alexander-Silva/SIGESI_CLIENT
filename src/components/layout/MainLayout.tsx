import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Topbar from './Topbar';
import Sidebar, { DRAWER_WIDTH_OPEN, DRAWER_WIDTH_CLOSED } from './Sidebar';
import { usePermissions } from '@/context/PermissionsContext';

const TOPBAR_HEIGHT = 64;

export default function MainLayout() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { menus, isLoading } = usePermissions();

  // El sidebar siempre inicia abierto en desktop.
  // En móvil arranca cerrado porque es un Drawer temporal flotante.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Solo mostrar el sidebar si está cargando (muestra skeleton) o hay menús.
  // Si terminó de cargar y no hay menús, ocultarlo para no desperdiciar espacio.
  const showSidebar = isLoading || menus.length > 0;

  // En móvil el sidebar flota (no desplaza el contenido), así que el margen
  // izquierdo del main siempre es 0 en mobile.
  const drawerWidth = !showSidebar || isMobile
    ? 0
    : sidebarOpen
      ? DRAWER_WIDTH_OPEN
      : DRAWER_WIDTH_CLOSED;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* ── Barra superior fija ── */}
      <Topbar sidebarOpen={sidebarOpen && showSidebar} onToggleSidebar={handleToggleSidebar} />

      {/* ── Sidebar — solo se renderiza si hay menús o está cargando ── */}
      {showSidebar && (
        <Sidebar
          open={isMobile ? sidebarOpen : sidebarOpen}
          isMobile={isMobile}
          topOffset={TOPBAR_HEIGHT}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Contenido principal ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${TOPBAR_HEIGHT}px`,
          transition: 'width 0.25s ease-in-out',
          overflow: 'auto',
          height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3, lg: 4 },
            maxWidth: '1440px',
            mx: 'auto',
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
