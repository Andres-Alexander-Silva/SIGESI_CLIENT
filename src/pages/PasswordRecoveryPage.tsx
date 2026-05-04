// src/pages/PasswordRecoveryPage.tsx
import { useState, FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { Email, ScienceOutlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { PALETTE } from "@/styles/theme";
import api from "@/services/api";

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const theme = useTheme();

  const isUFPSEmail = (value: string) =>
    value.trim().toLowerCase().endsWith("@ufps.edu.co");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isUFPSEmail(email)) {
      setError("El correo debe pertenecer al dominio @ufps.edu.co");
      setLoading(false);
      return;
    }

    try {
      // Ajusta el endpoint según tu Swagger
      await api.post("/auth/password-reset/", { email: email.trim() });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "No se pudo enviar el correo de recuperación.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <Paper
          sx={{ p: 5, maxWidth: 500, textAlign: "center", borderRadius: 3 }}
        >
          <ScienceOutlined
            sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
          />
          <Typography variant="h5" gutterBottom>
            ¡Correo enviado!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            Revisa tu bandeja de entrada (y spam) en <strong>{email}</strong>.
            <br />
            Te hemos enviado un enlace para restablecer tu contraseña.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
            sx={{ borderRadius: 2 }}
          >
            Volver al inicio de sesión
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Panel izquierdo - Branding (igual que LoginPage) */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          width: "50%",
          background: `linear-gradient(135deg, ${PALETTE.primary.main} 0%, ${PALETTE.primary.dark} 100%)`,
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <Box sx={{ textAlign: "center", px: 6 }}>
          <ScienceOutlined sx={{ fontSize: 80, mb: 3 }} />
          <Typography variant="h3" fontWeight={700} gutterBottom>
            SIGESI
          </Typography>
          <Typography variant="h6">Sistema de Gestión de Semilleros</Typography>
        </Box>
      </Box>

      {/* Panel derecho - Formulario */}
      <Box
        sx={{
          width: { xs: "100%", lg: "50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          bgcolor: "background.default",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 448,
            p: 5,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Recuperar contraseña
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Ingresa tu correo institucional y te enviaremos un enlace para
            restablecerla.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="usuario@ufps.edu.co"
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: theme.palette.text.disabled }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Enviar enlace de recuperación"
              )}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <RouterLink
              to="/login"
              style={{ color: theme.palette.primary.main }}
            >
              ← Volver al inicio de sesión
            </RouterLink>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
