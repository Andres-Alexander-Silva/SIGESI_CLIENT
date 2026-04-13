import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Tooltip,
  Divider,
  Collapse,
  Skeleton,
} from '@mui/material';
import {
  ScienceOutlined,
  ExpandLessOutlined,
  ExpandMoreOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { usePermissions } from '@/context/PermissionsContext';
import { getMenuIcon, getUrlIcon } from '@/utils/iconMap';
import { Menu } from '@/types';

const DRAWER_WIDTH_OPEN   = 260;
const DRAWER_WIDTH_CLOSED = 72;

interface SidebarProps {
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
  topOffset?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ítem de menú (reutilizable para raíz e hijos)
// ─────────────────────────────────────────────────────────────────────────────
interface MenuItemProps {
  menu: Menu;
  sidebarOpen: boolean;
  depth?: number;
  onNavigate: (path: string) => void;
}

function SidebarMenuItem({ menu, sidebarOpen, depth = 0, onNavigate }: MenuItemProps) {
  const theme    = useTheme();
  const location = useLocation();
  const isDark   = theme.palette.mode === 'dark';

  const hasChildren = (menu.children?.length ?? 0) > 0;

  // Normalizar URLs para comparación
  const norm = (u?: string) => '/' + (u ?? '').replace(/^\/|\/$/g, '').toLowerCase();
  const currentPath = norm(location.pathname);
  const menuUrl     = norm(menu.url);

  // Hoja activa
  const isActive = !hasChildren && menuUrl !== '/' && (
    currentPath === menuUrl || currentPath.startsWith(menuUrl + '/')
  );

  // Padre activo (algún hijo está activo)
  const isParentActive = hasChildren && menu.children!.some((c) => {
    const cu = norm(c.url);
    return cu !== '/' && (currentPath === cu || currentPath.startsWith(cu + '/'));
  });

  const highlighted = isActive || isParentActive;

  // Auto-expandir si estamos en esta sección
  const [expanded, setExpanded] = useState(() =>
    hasChildren && menu.children!.some((c) => {
      const cu = norm(c.url);
      return cu !== '/' && currentPath.startsWith(cu);
    }),
  );

  const handleClick = () => {
    if (hasChildren) {
      setExpanded((p) => !p);
    } else if (menu.url) {
      onNavigate(menu.url);
    }
  };

  const activeBg     = `rgba(200, 16, 46, ${isDark ? '0.15' : '0.08'})`;
  const activeHover  = `rgba(200, 16, 46, ${isDark ? '0.2'  : '0.12'})`;
  const defaultHover = theme.palette.action?.hover;
  const pl           = sidebarOpen ? 2 + depth * 1.5 : 1.5;

  return (
    <>
      <ListItem disablePadding sx={{ px: 1, mb: 0.5 }}>
        <Tooltip title={!sidebarOpen ? menu.nombre : ''} placement="right" arrow>
          <ListItemButton
            onClick={handleClick}
            sx={{
              borderRadius: 2,
              minHeight: 44,
              justifyContent: sidebarOpen ? 'initial' : 'center',
              pl,
              pr: 1.5,
              backgroundColor: highlighted ? activeBg : 'transparent',
              color: highlighted ? theme.palette.primary.main : theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: highlighted ? activeHover : defaultHover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: sidebarOpen ? 2 : 0,
                justifyContent: 'center',
                color: highlighted ? theme.palette.primary.main : theme.palette.text.disabled,
                fontSize: depth > 0 ? '1.1rem' : '1.25rem',
              }}
            >
              {depth > 0 ? getUrlIcon(menu.url) : getMenuIcon(menu.icono)}
            </ListItemIcon>

            {sidebarOpen && (
              <>
                <ListItemText
                  primary={menu.nombre}
                  slotProps={{
                    primary: {
                      style: {
                        fontSize: depth > 0 ? '0.82rem' : '0.875rem',
                        fontWeight: highlighted ? 600 : 400,
                      },
                    },
                  }}
                />
                {hasChildren && (
                  expanded
                    ? <ExpandLessOutlined sx={{ fontSize: 18, color: theme.palette.text.disabled }} />
                    : <ExpandMoreOutlined sx={{ fontSize: 18, color: theme.palette.text.disabled }} />
                )}
              </>
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>

      {hasChildren && sidebarOpen && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {menu.children!.map((child) => (
              <SidebarMenuItem
                key={child.id}
                menu={child}
                sidebarOpen={sidebarOpen}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton mientras carga
// ─────────────────────────────────────────────────────────────────────────────
function MenuSkeleton({ open }: { open: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <ListItem key={i} disablePadding sx={{ px: 1, mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 0.5, width: '100%' }}>
            <Skeleton variant="circular" width={24} height={24} />
            {open && <Skeleton variant="text" width="60%" height={20} />}
          </Box>
        </ListItem>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar principal
// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar({ open, isMobile, onClose, topOffset = 64 }: SidebarProps) {
  const theme    = useTheme();
  const navigate = useNavigate();
  const { menus, isLoading } = usePermissions();

  const drawerWidth = open ? DRAWER_WIDTH_OPEN : DRAWER_WIDTH_CLOSED;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      {/* ── Logo ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 2, minHeight: 64 }}>
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            width: 38,
            height: 38,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          }}
        >
          <ScienceOutlined sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        {open && (
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: theme.palette.primary.main, lineHeight: 1.2 }}
            >
              SIGESI
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: '0.7rem' }}>
              Semilleros UFPS
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* ── Menú principal ── */}
      <List sx={{ flex: 1, py: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
        {isLoading ? (
          <MenuSkeleton open={open} />
        ) : menus.length > 0 ? (
          menus.map((menu) => (
            <SidebarMenuItem
              key={menu.id}
              menu={menu}
              sidebarOpen={open}
              onNavigate={handleNavigate}
            />
          ))
        ) : (
          open && (
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                Sin módulos disponibles
              </Typography>
            </Box>
          )
        )}
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH_OPEN,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            top: `${topOffset}px`,
            height: `calc(100% - ${topOffset}px)`,
          },
          '& .MuiBackdrop-root': {
            top: `${topOffset}px`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: `${topOffset}px`,
          height: `calc(100% - ${topOffset}px)`,
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: 'width 0.25s ease-in-out',
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH_OPEN, DRAWER_WIDTH_CLOSED };
