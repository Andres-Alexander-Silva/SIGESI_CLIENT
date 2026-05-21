import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  CircularProgress,
  Container,
  Alert,
  Chip,
} from "@mui/material";
import {
  ScienceOutlined,
  AdminPanelSettingsOutlined,
  GroupsOutlined,
  SchoolOutlined,
  PersonOutlined,
  SupervisedUserCircleOutlined,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

/** Mapa de rol → etiqueta visible y color de chip */
const ROL_META: Record<
  UserRole,
  { label: string; icon: React.ReactElement; color: string }
> = {
  administrador: {
    label: "Administrador",
    icon: <AdminPanelSettingsOutlined fontSize="large" />,
    color: "#1976d2",
  },
  director_grupo: {
    label: "Director de Grupo",
    icon: <GroupsOutlined fontSize="large" />,
    color: "#388e3c",
  },
  director_semillero: {
    label: "Director de Semillero",
    icon: <SupervisedUserCircleOutlined fontSize="large" />,
    color: "#7b1fa2",
  },
  lider_estudiantil: {
    label: "Líder Estudiantil",
    icon: <SchoolOutlined fontSize="large" />,
    color: "#f57c00",
  },
  estudiante: {
    label: "Estudiante",
    icon: <PersonOutlined fontSize="large" />,
    color: "#0288d1",
  },
};

export default function SelectRolePage() {
  const { user, selectRole, activeRole } = useAuth();
  const navigate = useNavigate();
  const isChangingRole = Boolean(activeRole);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [roleError, setRoleError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const handleSelectRole = async (rol: UserRole) => {
    setRoleError("");
    setLoadingRole(rol);
    try {
      await selectRole(rol);
    } catch {
      setRoleError("No se pudo seleccionar el rol. Intenta de nuevo.");
      setLoadingRole(null);
    }
  };

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Usar available_roles del user (devueltos por el backend) para mostrar
  // nombre legible; si no existen, construir desde roles[]
  const availableRoles: UserRole[] =
    user.available_roles?.length
      ? user.available_roles.map((r) => r.code)
      : (user.roles ?? []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        {/* Encabezado */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <ScienceOutlined
            sx={{ fontSize: 64, color: "primary.main", mb: 2 }}
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {isChangingRole ? "Cambiar rol" : "¿Con qué rol deseas ingresar?"}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isChangingRole ? (
              <>
                Rol actual: <strong>{activeRole}</strong>. Selecciona el nuevo
                rol con el que quieres continuar.
              </>
            ) : (
              <>
                Iniciaste sesión como{" "}
                <strong>
                  {user.first_name} {user.last_name}
                </strong>
                . Selecciona el rol con el que quieres trabajar en esta sesión.
              </>
            )}
          </Typography>
        </Box>

        {roleError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {roleError}
          </Alert>
        )}

        {/* Lista de roles */}
        {availableRoles.length === 0 ? (
          <Alert severity="warning">
            No se encontraron roles asociados a tu cuenta.
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {availableRoles.map((rol) => {
              const meta = ROL_META[rol] ?? {
                label: rol,
                icon: <PersonOutlined fontSize="large" />,
                color: "#555",
              };
              const isLoading = loadingRole === rol;
              const isDisabled = loadingRole !== null;

              return (
                <Card
                  key={rol}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    opacity: isDisabled && !isLoading ? 0.5 : 1,
                    transition: "box-shadow 0.2s, border-color 0.2s, opacity 0.2s",
                    "&:hover": !isDisabled
                      ? {
                          borderColor: meta.color,
                          boxShadow: `0 0 0 2px ${meta.color}33`,
                        }
                      : {},
                  }}
                >
                  <CardActionArea
                    onClick={() => !isDisabled && handleSelectRole(rol)}
                    disabled={isDisabled}
                    sx={{
                      p: 2.5,
                      display: "flex",
                      gap: 2.5,
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ color: meta.color, display: "flex" }}>
                      {isLoading ? (
                        <CircularProgress size={28} sx={{ color: meta.color }} />
                      ) : (
                        meta.icon
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1, textAlign: "left" }}>
                      <Typography variant="h6" fontWeight={600}>
                        {meta.label}
                      </Typography>
                      <Chip
                        label={rol}
                        size="small"
                        sx={{
                          mt: 0.5,
                          bgcolor: `${meta.color}18`,
                          color: meta.color,
                          fontWeight: 500,
                          fontSize: "0.72rem",
                        }}
                      />
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}

        {isChangingRole && (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: "primary.main",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => navigate(-1)}
            >
              Cancelar y volver
            </Typography>
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            mt: 4,
            color: "text.disabled",
          }}
        >
          {isChangingRole
            ? "El cambio de rol se aplica de inmediato."
            : "Podrás cambiar de rol en cualquier momento desde el menú de usuario."}
        </Typography>
      </Container>
    </Box>
  );
}
