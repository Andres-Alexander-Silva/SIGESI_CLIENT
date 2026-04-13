import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  MenuOutlined,
  MenuOpenOutlined,
  LogoutOutlined,
  PersonOutlined,
  NotificationsOutlined,
  DarkModeOutlined,
  LightModeOutlined,
} from '@mui/icons-material';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ sidebarOpen, onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <IconButton
          onClick={onToggleSidebar}
          edge="start"
          sx={{ mr: 2, color: theme.palette.text.secondary }}
        >
          {sidebarOpen ? <MenuOpenOutlined /> : <MenuOutlined />}
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        {/* Toggle dark / light mode */}
        <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          <IconButton
            onClick={toggleMode}
            sx={{ mr: 1, color: theme.palette.text.disabled }}
          >
            {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
          </IconButton>
        </Tooltip>

        {/* Notificaciones */}
        <IconButton sx={{ mr: 1, color: theme.palette.text.disabled }}>
          <NotificationsOutlined />
        </IconButton>

        {/* Usuario */}
        <Box
          onClick={handleMenuOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            borderRadius: 2,
            px: 1,
            py: 0.5,
            transition: 'background-color 0.15s',
            '&:hover': { backgroundColor: theme.palette.action?.hover },
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              fontSize: '0.8rem',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.2 }}
            >
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.disabled, fontSize: '0.7rem' }}
            >
              {user?.role || 'Usuario'}
            </Typography>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(0,0,0,0.4)'
                  : '0 4px 20px rgba(0,0,0,0.08)',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: theme.palette.text.primary }}
            >
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
              {user?.email}
            </Typography>
            <Chip
              label={user?.role || 'Usuario'}
              size="small"
              sx={{
                display: 'flex',
                mt: 0.5,
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 600,
                backgroundColor: `rgba(200, 16, 46, 0.1)`,
                color: theme.palette.primary.main,
              }}
            />
          </Box>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <PersonOutlined fontSize="small" />
            </ListItemIcon>
            Mi Perfil
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutOutlined fontSize="small" sx={{ color: theme.palette.primary.main }} />
            </ListItemIcon>
            <Typography sx={{ color: theme.palette.primary.main }}>Cerrar Sesión</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
