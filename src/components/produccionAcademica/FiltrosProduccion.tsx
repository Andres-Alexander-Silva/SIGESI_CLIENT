import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { ProduccionAcademicaFilters, TIPO_LABELS, ESTADO_LABELS } from '@/types/produccionAcademica';

interface Props {
  filters: ProduccionAcademicaFilters;
  onChange: (partial: Partial<ProduccionAcademicaFilters>) => void;
}

export default function FiltrosProduccion({ filters, onChange }: Props) {
  const hasFilters = !!(filters.search || filters.tipo || filters.estado);

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
      <TextField
        size="small"
        placeholder="Buscar por título, autor, revista..."
        value={filters.search ?? ''}
        onChange={e => onChange({ search: e.target.value })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: 260, flexGrow: 1 }}
      />

      <TextField
        select
        size="small"
        label="Tipo"
        value={filters.tipo ?? ''}
        onChange={e => onChange({ tipo: e.target.value })}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">Todos los tipos</MenuItem>
        {Object.entries(TIPO_LABELS).map(([k, v]) => (
          <MenuItem key={k} value={k}>{v}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Estado"
        value={filters.estado ?? ''}
        onChange={e => onChange({ estado: e.target.value })}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">Todos los estados</MenuItem>
        {Object.entries(ESTADO_LABELS).map(([k, v]) => (
          <MenuItem key={k} value={k}>{v}</MenuItem>
        ))}
      </TextField>

      {hasFilters && (
        <Button
          size="small"
          startIcon={<FilterListOffIcon />}
          onClick={() => onChange({ search: '', tipo: '', estado: '' })}
          color="inherit"
        >
          Limpiar
        </Button>
      )}
    </Stack>
  );
}
