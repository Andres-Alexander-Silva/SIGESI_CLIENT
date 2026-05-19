// src/components/produccionAcademica/EstadoChip.tsx

import { Chip } from '@mui/material';
import { EstadoProduccion, ESTADO_LABELS, ESTADO_COLORS } from '@/types/produccionAcademica';

interface Props {
  estado: EstadoProduccion;
  size?: 'small' | 'medium';
}

export default function EstadoChip({ estado, size = 'small' }: Props) {
  return (
    <Chip
      label={ESTADO_LABELS[estado] ?? estado}
      color={ESTADO_COLORS[estado]?.color ?? 'default'}
      size={size}
      variant="outlined"
    />
  );
}
