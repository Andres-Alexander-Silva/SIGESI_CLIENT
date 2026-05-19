// src/components/produccionAcademica/FormProduccion.tsx

import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Autocomplete,
  Chip, CircularProgress, Alert, Stack, Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  ProduccionAcademica,
  ProduccionAcademicaCreate,
  TIPO_LABELS,
  ESTADO_LABELS,
} from '@/types/produccionAcademica';
import { formatApiError } from '@/utils/apiError';
import { Proyecto } from '@/types/core';
import { Semillero } from '@/types/core';
import { LineaInvestigacion } from '@/types/core';
import { UserAdmin } from '@/types';

interface Props {
  open: boolean;
  item: ProduccionAcademica | null;
  proyectos: Proyecto[];
  semilleros: Semillero[];
  lineas: LineaInvestigacion[];
  usuarios: UserAdmin[];
  onClose: () => void;
  onSave: (payload: ProduccionAcademicaCreate) => Promise<void>;
}

const EMPTY: ProduccionAcademicaCreate = {
  titulo: '',
  tipo: 'articulo',
  descripcion: '',
  proyecto: 0,
  semillero: 0,
  linea_investigacion: null,
  autores: [],
  doi: '',
  url_repositorio: '',
  revista_evento: '',
  fecha_publicacion: null,
  estado: 'en_elaboracion',
};

export default function FormProduccion({
  open, item, proyectos, semilleros, lineas, usuarios, onClose, onSave,
}: Props) {
  const [form, setForm] = useState<ProduccionAcademicaCreate>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setForm({
        titulo:             item.titulo,
        tipo:               item.tipo,
        descripcion:        item.descripcion ?? '',
        proyecto:           item.proyecto ?? 0,
        semillero:          item.semillero,
        linea_investigacion: item.linea_investigacion ?? null,
        autores:            item.autores,
        doi:                item.doi ?? '',
        url_repositorio:    item.url_repositorio ?? '',
        revista_evento:     item.revista_evento ?? '',
        fecha_publicacion:  item.fecha_publicacion ?? null,
        estado:             item.estado,
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [item, open]);

  const set = <K extends keyof ProduccionAcademicaCreate>(
    key: K, value: ProduccionAcademicaCreate[K],
  ) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.titulo.trim()) { setError('El título es obligatorio.'); return; }
    if (!form.proyecto)      { setError('Debes seleccionar un proyecto.'); return; }
    if (!form.semillero)     { setError('Debes seleccionar un semillero.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(formatApiError(err, 'Error al guardar la producción académica.'));
    } finally {
      setSaving(false);
    }
  };

  const autoresSeleccionados = usuarios.filter(u => form.autores.includes(u.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span" fontFamily='"DM Sans", sans-serif' fontWeight={600}>
          {item ? 'Editar producción académica' : 'Registrar producción académica'}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} pt={0.5}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

          <TextField
            label="Título *"
            fullWidth
            value={form.titulo}
            onChange={e => set('titulo', e.target.value)}
            size="small"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small" label="Tipo *"
                value={form.tipo}
                onChange={e => set('tipo', e.target.value as any)}
              >
                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small" label="Estado"
                value={form.estado}
                onChange={e => set('estado', e.target.value as any)}
              >
                {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            label="Descripción"
            fullWidth multiline rows={3}
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            size="small"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small" label="Proyecto *"
                value={form.proyecto || ''}
                onChange={e => set('proyecto', Number(e.target.value))}
              >
                <MenuItem value="">Seleccionar proyecto</MenuItem>
                {proyectos.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.titulo}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth size="small" label="Semillero *"
                value={form.semillero || ''}
                onChange={e => set('semillero', Number(e.target.value))}
              >
                <MenuItem value="">Seleccionar semillero</MenuItem>
                {semilleros.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <TextField
            select fullWidth size="small" label="Línea de investigación"
            value={form.linea_investigacion ?? ''}
            onChange={e => set('linea_investigacion', e.target.value ? Number(e.target.value) : null)}
          >
            <MenuItem value="">Sin línea asignada</MenuItem>
            {lineas.map(l => (
              <MenuItem key={l.id} value={l.id}>{l.nombre}</MenuItem>
            ))}
          </TextField>

          <Autocomplete
            multiple
            size="small"
            options={usuarios}
            value={autoresSeleccionados}
            getOptionLabel={u => `${u.last_name}, ${u.first_name}`}
            onChange={(_, val) => set('autores', val.map(u => u.id))}
            renderTags={(val, getTagProps) =>
              val.map((u, i) => (
                <Chip
                  {...getTagProps({ index: i })}
                  key={u.id}
                  label={`${u.last_name}, ${u.first_name}`}
                  size="small"
                />
              ))
            }
            renderInput={params => <TextField {...params} label="Autores / Participantes" />}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="DOI" fullWidth size="small"
                value={form.doi}
                onChange={e => set('doi', e.target.value)}
                placeholder="10.XXXX/..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha de publicación" fullWidth size="small" type="date"
                value={form.fecha_publicacion ?? ''}
                onChange={e => set('fecha_publicacion', e.target.value || null)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Revista / Evento" fullWidth size="small"
                value={form.revista_evento}
                onChange={e => set('revista_evento', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="URL Repositorio" fullWidth size="small"
                value={form.url_repositorio}
                onChange={e => set('url_repositorio', e.target.value)}
                placeholder="https://..."
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Guardando...' : item ? 'Guardar cambios' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
