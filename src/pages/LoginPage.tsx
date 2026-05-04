import { useState, FormEvent } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  ScienceOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "@/context/AuthContext";
import { PALETTE } from "@/styles/theme";

const DOMAIN_ERROR = "El correo debe pertenecer al dominio @ufps.edu.co";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const isUFPSEmail = (value: string) =>
    value.trim().toLowerCase().endsWith("@ufps.edu.co");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isUFPSEmail(email)) {
      setError(DOMAIN_ERROR);
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Credenciales inválidas. Verifica tu correo y contraseña.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Panel izquierdo - Branding */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          width: "50%",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${PALETTE.primary.main} 0%, ${PALETTE.primary.dark} 50%, ${PALETTE.primary.darker} 100%)`,
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            px: 6,
            color: "#fff",
          }}
        >
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 4,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(4px)",
            }}
          >
            <ScienceOutlined sx={{ fontSize: 64, color: "#fff" }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 700,
              textAlign: "center",
              mb: 2,
            }}
          >
            SIGESI
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
              textAlign: "center",
              opacity: 0.9,
            }}
          >
            Sistema de Gestión de Semilleros
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
              textAlign: "center",
              opacity: 0.9,
            }}
          >
            de Investigación
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 6, textAlign: "center", opacity: 0.6, maxWidth: 320 }}
          >
            Universidad Francisco de Paula Santander ©{" "}
            {new Date().getFullYear()}
          </Typography>
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
            p: { xs: 4, lg: 5 },
            bgcolor: "background.paper",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          {/* Logo móvil */}
          <Box
            sx={{
              display: { xs: "flex", lg: "none" },
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                mb: 1.5,
                background: `linear-gradient(135deg, ${PALETTE.primary.main}, ${PALETTE.primary.dark})`,
              }}
            >
              <ScienceOutlined sx={{ fontSize: 36, color: "#fff" }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 700,
                color: theme.palette.primary.main,
              }}
            >
              SIGESI
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            Bienvenido
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.disabled, mb: 4 }}
          >
            Inicia sesión para acceder a la plataforma
          </Typography>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
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
              helperText="Usa tu correo institucional @ufps.edu.co"
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email
                        sx={{
                          color: theme.palette.text.disabled,
                          fontSize: 20,
                        }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock
                        sx={{
                          color: theme.palette.text.disabled,
                          fontSize: 20,
                        }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 20 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
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
              sx={{
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                background: `linear-gradient(135deg, ${PALETTE.primary.main} 0%, ${PALETTE.primary.dark} 100%)`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${PALETTE.primary.dark} 0%, ${PALETTE.primary.darker} 100%)`,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Link
              component={RouterLink}
              to="/recuperacion"
              underline="hover"
              sx={{ color: theme.palette.primary.main, fontSize: "0.9rem" }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              mt: 5,
              color: theme.palette.text.disabled,
              fontSize: "0.8rem",
            }}
          >
            Universidad Francisco de Paula Santander ©{" "}
            {new Date().getFullYear()}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
