import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl,
  InputLabel, Switch, FormControlLabel, CircularProgress, Alert, Tooltip,
  InputAdornment, TextField,
} from '@mui/material';
import {
  AddOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  SecurityOutlined, RefreshOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { permisosService, opcionesService } from '@/services/config.service';
import { PermisoAdmin, OpcionAdmin, UserRole } from '@/types';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'administrador',      label: 'Administrador' },
  { value: 'director_grupo',     label: 'Director de Grupo' },
  { value: 'director_semillero', label: 'Director de Semillero' },
  { value: 'lider_estudiantil',  label: 'Líder Estudiantil' },
  { value: 'estudiante',         label: 'Estudiante' },
  { value: 'comite',             label: 'Comité' },
];

const EMPTY_FORM = { rol: 'estudiante' as UserRole, opcion: '' as string | number, permitido: true };

export default function PermisosPage() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [permisos, setPermisos] = useState<PermisoAdmin[]>([]);
  const [opciones, setOpciones] = useState<OpcionAdmin[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<PermisoAdmin | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rolFilter, setRolFilter] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [perms, ops] = await Promise.all([permisosService.list(), opcionesService.list()]);
      setPermisos(perms); setOpciones(ops);
    } catch { setError('No se pudieron cargar los permisos.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getOpcionNombre = (id: number) => opciones.find(o => o.id === id)?.nombre ?? `#${id}`;

  const filtered = permisos.filter(p => {
    const matchRol  = !rolFilter || p.rol === rolFilter;
    const matchText = !search   || getOpcionNombre(p.opcion).toLowerCase().includes(search.toLowerCase()) || p.rol.includes(search.toLowerCase());
    return matchRol && matchText;
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true); };
  const openEdit   = (p: PermisoAdmin) => {
    setEditing(p);
    setForm({ rol: p.rol, opcion: p.opcion, permitido: p.permitido });
    setFormError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      const payload: Partial<PermisoAdmin> = { rol: form.rol, opcion: Number(form.opcion), permitido: form.permitido };
      if (editing) await permisosService.update(editing.id, payload);
      else         await permisosService.create(payload);
      setDialogOpen(false); load();
    } catch (e: any) {
      setFormError(e?.response?.data ? JSON.stringify(e.response.data) : 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try { await permisosService.remove(deleteId); setDeleteId(null); load(); }
    catch { setError('No se pudo eliminar el permiso.'); }
    finally { setDeleteLoading(false); }
  };

  const rolColor = (rol: UserRole) => {
    const map: Record<UserRole, string> = {
      administrador: theme.palette.primary.main, director_grupo: theme.palette.secondary.main,
      director_semillero: theme.palette.secondary.light, lider_estudiantil: theme.palette.warning.main,
      estudiante: theme.palette.info.main, comite: theme.palette.text.secondary,
    };
    return map[rol] ?? theme.palette.text.secondary;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SecurityOutlined sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: theme.palette.text.primary }}>Permisos</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>Control de acceso por rol y opción</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Recargar"><IconButton onClick={load} size="small"><RefreshOutlined /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate} sx={{ borderRadius: 2, textTransform: 'none' }}>Nuevo permiso</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Buscar opción o rol…" value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18 }} /></InputAdornment> } }}
          sx={{ width: { xs: '100%', sm: 280 } }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por rol</InputLabel>
          <Select label="Filtrar por rol" value={rolFilter} onChange={e => setRolFilter(e.target.value)}>
            <MenuItem value="">Todos los roles</MenuItem>
            {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                {['Rol', 'Opción', 'Permitido', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.78rem', color: theme.palette.text.disabled }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: theme.palette.text.disabled }}>Sin resultados</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Chip label={ROLES.find(r => r.value === p.rol)?.label ?? p.rol} size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, color: rolColor(p.rol), bgcolor: `${rolColor(p.rol)}22` }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem' }}>{getOpcionNombre(p.opcion)}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.permitido ? 'Permitido' : 'Denegado'} size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600,
                        color:  p.permitido ? theme.palette.secondary.main : theme.palette.error.main,
                        bgcolor: p.permitido ? `${theme.palette.secondary.main}22` : `${theme.palette.error.main}22` }} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(p)}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteId(p.id)}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700 }}>
          {editing ? 'Editar permiso' : 'Nuevo permiso'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Rol *</InputLabel>
              <Select label="Rol *" value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value as UserRole }))}>
                {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Opción *</InputLabel>
              <Select label="Opción *" value={form.opcion} onChange={e => setForm(f => ({ ...f, opcion: e.target.value }))}>
                {opciones.map(o => <MenuItem key={o.id} value={o.id}>{o.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={form.permitido} onChange={e => setForm(f => ({ ...f, permitido: e.target.checked }))} color="success" />}
              label={form.permitido ? 'Permitido' : 'Denegado'}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {saving ? <CircularProgress size={18} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>¿Eliminar permiso?</DialogTitle>
        <DialogContent><Typography variant="body2">Esta acción no se puede deshacer.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {deleteLoading ? <CircularProgress size={18} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
