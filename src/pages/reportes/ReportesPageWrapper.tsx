// src/pages/reportes/ReportesPageWrapper.tsx
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import ReportesPage from "./ReportesPages";

export default function ReportesPageWrapper() {
  const { isLoading, isAuthenticated, tokens, activeRole } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!isAuthenticated || !tokens?.access) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography color="text.secondary">
          Debes iniciar sesión para acceder a los reportes.
        </Typography>
      </Box>
    );
  }

  if (!activeRole) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography color="text.secondary">
          Selecciona un rol para continuar.
        </Typography>
      </Box>
    );
  }

  return <ReportesPage token={tokens.access} activeRole={activeRole} />;
}
