// src/components/layout/Topbar.tsx
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
} from "@mui/material";
import {
  MenuOutlined,
  MenuOpenOutlined,
  LogoutOutlined,
  PersonOutlined,
  NotificationsOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  LockOutlined,
} from "@mui/icons-material";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "@/context/AuthContext";
import { useThemeMode } from "@/context/ThemeContext";
import { useNavigate } from "react-router-dom";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";

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
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "U";

  const ROLE_LABELS: Record<string, string> = {
    administrador: "Administrador",
    director_grupo: "Director de Grupo",
    director_semillero: "Director de Semillero",
    lider_estudiantil: "Líder Estudiantil",
    estudiante: "Estudiante",
  };

  console.log(user?.roles);

  const roleDisplay =
    user?.roles && user.roles.length > 0
      ? user.roles
          .filter((r) => typeof r === "string")
          .map(
            (r) =>
              ROLE_LABELS[r] ||
              r.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          )
          .join(", ") || "Usuario"
      : "Usuario";

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

        <Tooltip title={mode === "dark" ? "Modo claro" : "Modo oscuro"}>
          <IconButton
            onClick={toggleMode}
            sx={{ mr: 1, color: theme.palette.text.disabled }}
          >
            {mode === "dark" ? <LightModeOutlined /> : <DarkModeOutlined />}
          </IconButton>
        </Tooltip>

        <IconButton sx={{ mr: 2, color: theme.palette.text.disabled }}>
          <NotificationsOutlined />
        </IconButton>

        {/* Perfil */}
        <Box
          onClick={handleMenuOpen}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            borderRadius: 2,
            px: 1.5,
            py: 0.75,
            "&:hover": { backgroundColor: theme.palette.action.hover },
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: "0.95rem",
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, lineHeight: 1.2, color: theme.palette.text.primary }}
            >
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, opacity: 0.8 }}
            >
              {roleDisplay}
            </Typography>
          </Box>
        </Box>

        {/* Menú */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 240,
                borderRadius: 2,
                boxShadow: theme.shadows[10],
                border: `1px solid ${theme.palette.divider}`,
                zIndex: 9999,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Chip
              label={roleDisplay}
              size="small"
              color="primary"
              sx={{ mt: 1, fontSize: "0.72rem" }}
            />
          </Box>

          <Divider />

          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <PersonOutlined fontSize="small" />
            </ListItemIcon>
            Mi Perfil
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleMenuClose();
              setChangePasswordOpen(true);
            }}
          >
            <ListItemIcon>
              <LockOutlined fontSize="small" />
            </ListItemIcon>
            Cambiar Contraseña
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutOutlined fontSize="small" color="error" />
            </ListItemIcon>
            <Typography color="error">Cerrar Sesión</Typography>
          </MenuItem>
        </Menu>

        <ChangePasswordModal
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
        />
      </Toolbar>
    </AppBar>
  );
}
