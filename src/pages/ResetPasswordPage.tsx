// src/pages/ResetPasswordPage.tsx
import { useState, FormEvent, useEffect } from "react";
import {
  useSearchParams,
  useNavigate,
  Link as RouterLink,
} from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Lock,
  ScienceOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { PALETTE } from "@/styles/theme";
import api from "@/services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Ajusta este endpoint según tu Swagger
      await api.post("/auth/password-reset/confirm/", {
        token,
        password,
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Error al restablecer la contraseña. El enlace puede haber expirado.",
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
        }}
      >
        <Paper
          sx={{ p: 5, maxWidth: 480, textAlign: "center", borderRadius: 3 }}
        >
          <ScienceOutlined
            sx={{ fontSize: 60, color: "success.main", mb: 2 }}
          />
          <Typography variant="h5" gutterBottom>
            ¡Contraseña restablecida!
          </Typography>
          <Typography sx={{ mb: 3 }}>
            Tu contraseña ha sido actualizada correctamente.
            <br />
            Serás redirigido al inicio de sesión.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Panel izquierdo */}
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
        <Box sx={{ textAlign: "center" }}>
          <ScienceOutlined sx={{ fontSize: 80 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mt: 2 }}>
            SIGESI
          </Typography>
        </Box>
      </Box>

      {/* Panel derecho */}
      <Box
        sx={{
          width: { xs: "100%", lg: "50%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 5,
            maxWidth: 448,
            width: "100%",
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Nueva contraseña
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Ingresa tu nueva contraseña
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nueva contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              label="Confirmar contraseña"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
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
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Restablecer contraseña"
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
