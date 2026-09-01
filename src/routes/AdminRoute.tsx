import { Outlet } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";

/**
 * Gatea rutas administrativas (config. de usuarios/roles/permisos, auditoría)
 * por rol activo. El backend ya rechaza estas operaciones para roles no
 * administradores (AdminOrReadOnlyPermission / AuditoriaPermission); este
 * guard evita además que la UI se renderice para quien no tiene el rol.
 */
export default function AdminRoute() {
  const { activeRole } = useAuth();

  if (activeRole !== "administrador") {
    return (
      <Box sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Acceso restringido
        </Typography>
        <Typography color="text.secondary">
          Esta sección está reservada al rol de administrador.
        </Typography>
      </Box>
    );
  }

  return <Outlet />;
}
