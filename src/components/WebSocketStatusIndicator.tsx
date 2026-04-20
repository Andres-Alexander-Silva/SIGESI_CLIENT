import { useAuth } from '@/context/AuthContext';
import { usePermissionsWebSocket } from '@/hooks/usePermissionsWebSocket';
import { Box, Tooltip, CircularProgress } from '@mui/material';
import { CloudDone, WifiOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';

/**
 * Indicador visual del estado de conexión WebSocket
 * Aparece en la Topbar o donde sea necesario
 */
export function WebSocketStatusIndicator() {
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const [connectionTimeout, setConnectionTimeout] = useState(false);

  const { isConnected } = usePermissionsWebSocket({
    userId: user?.id?.toString() ?? null,
    enabled: isAuthenticated,
    onError: () => {
      setConnectionTimeout(true);
    },
  });

  // Resetear timeout después de 10 segundos sin conexión
  useEffect(() => {
    if (!isConnected && isAuthenticated && !connectionTimeout) {
      const timer = setTimeout(() => {
        setConnectionTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isAuthenticated, connectionTimeout]);

  if (!isAuthenticated) {
    return null;
  }

  const isDark = theme.palette.mode === 'dark';

  // Conexión establecida
  if (isConnected) {
    return (
      <Tooltip title="WebSocket: Conectado en tiempo real">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            backgroundColor: `rgba(76, 175, 80, ${isDark ? '0.15' : '0.08'})`,
            color: theme.palette.success.main,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <CloudDone sx={{ fontSize: 16 }} />
          <span>En línea</span>
        </Box>
      </Tooltip>
    );
  }

  // Timeout o error
  if (connectionTimeout) {
    return (
      <Tooltip title="WebSocket: Sin conexión (usando polling)">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            backgroundColor: `rgba(244, 67, 54, ${isDark ? '0.15' : '0.08'})`,
            color: theme.palette.error.main,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <WifiOff sx={{ fontSize: 16 }} />
          <span>Offline</span>
        </Box>
      </Tooltip>
    );
  }

  // Conectando
  return (
    <Tooltip title="WebSocket: Conectando...">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          backgroundColor: `rgba(255, 152, 0, ${isDark ? '0.15' : '0.08'})`,
          color: theme.palette.warning.main,
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <CircularProgress size={16} sx={{ color: 'inherit' }} />
        <span>Conectando</span>
      </Box>
    </Tooltip>
  );
}
