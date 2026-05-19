// src/components/produccionAcademica/ConfirmarEliminar.tsx

import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { ProduccionAcademica } from '@/types/produccionAcademica';

interface Props {
  item: ProduccionAcademica | null;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export default function ConfirmarEliminar({ item, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!item) return;
    setLoading(true);
    try {
      await onConfirm(item.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!item} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Eliminar producción académica</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que deseas eliminar{' '}
          <strong>"{item?.titulo}"</strong>? Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancelar</Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
