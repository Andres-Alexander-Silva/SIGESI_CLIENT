// src/components/auth/ChangePasswordModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material";
import { usersService } from "@/services/config.service";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  open,
  onClose,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setError("Las nuevas contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await usersService.changePassword({
        password_actual: oldPassword,
        password_nuevo: newPassword,
        password_confirmacion: confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Limpiar campos
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cambiar Contraseña</DialogTitle>
      <DialogContent>
        {success && (
          <Alert severity="success">¡Contraseña cambiada exitosamente!</Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Contraseña actual"
          type={showOld ? "text" : "password"}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          margin="normal"
          slotProps={{
            input: {
              startAdornment: <Lock sx={{ mr: 1, color: "text.disabled" }} />,
              endAdornment: (
                <IconButton onClick={() => setShowOld(!showOld)}>
                  {showOld ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            },
          }}
        />

        <TextField
          fullWidth
          label="Nueva contraseña"
          type={showNew ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          margin="normal"
          slotProps={{
            input: {
              startAdornment: <Lock sx={{ mr: 1, color: "text.disabled" }} />,
              endAdornment: (
                <IconButton onClick={() => setShowNew(!showNew)}>
                  {showNew ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            },
          }}
        />

        <TextField
          fullWidth
          label="Confirmar nueva contraseña"
          type={showConfirm ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          slotProps={{
            input: {
              startAdornment: <Lock sx={{ mr: 1, color: "text.disabled" }} />,
              endAdornment: (
                <IconButton onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !oldPassword || !newPassword || !confirmPassword}
        >
          {loading ? <CircularProgress size={24} /> : "Cambiar Contraseña"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
