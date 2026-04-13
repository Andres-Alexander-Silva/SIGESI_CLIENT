import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Switch, FormControlLabel, CircularProgress, Alert, Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  AddOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  CheckBoxOutlined, RefreshOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { opcionesService, menusAdminService } from '@/services/config.service';
import { OpcionAdmin, MenuAdmin, AccionType } from '@/types';

const ACCIONES: { value: AccionType; label: string }[] = [
  { value: 'ver',      label: 'Ver' },
  { value: 'crear',    label: 'Crear' },
  { value: 'editar',   label: 'Editar' },
  { value: 'eliminar', label: 'Eliminar' },
  { value: 'aprobar',  label: 'Aprobar' },
  { value: 'exportar', label: 'Exportar' },
];

const EMPTY_FORM = { nombre: '', codigo: '', descripcion: '', accion: 'ver' as AccionType, menu: '' as string | number, is_active: true };

export default function OpcionesPage() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [opciones, setOpciones] = useState<OpcionAdmin[]>([]);
  const [menus,    setMenus]    = useState<MenuAdmin[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<OpcionAdmin | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [ops, mns] = await Promise.all([opcionesService.list(), menusAdminService.list()]);
      setOpciones(ops); setMenus(mns);
    } catch { setError('No se pudieron cargar las opciones.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = opciones.filter(o =>
    `${o.nombre} ${o.codigo}`.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true); };
  const openEdit   = (o: OpcionAdmin) => {
    setEditing(o);
    setForm({ nombre: o.nombre, codigo: o.codigo, descripcion: o.descripcion ?? '', accion: o.accion, menu: o.menu, is_active: o.is_active });
    setFormError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      const payload: Partial<OpcionAdmin> = {
        nombre:      form.nombre,
        codigo:      form.codigo,
        descripcion: form.descripcion || undefined,
        accion:      form.accion,
        menu:        Number(form.menu),
        is_active:   form.is_active,
      };
      if (editing) await opcionesService.update(editing.id, payload);
      else         await opcionesService.create(payload);
      setDialogOpen(false); load();
    } catch (e: any) {
      setFormError(e?.response?.data ? JSON.stringify(e.response.data) : 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try { await opcionesService.remove(deleteId); setDeleteId(null); load(); }
    catch { setError('No se pudo eliminar la opción.'); }
    finally { setDeleteLoading(false); }
  };

  const accionColor = (a: AccionType) => {
    const map: Record<AccionType, string> = {
      ver: theme.palette.info.main,  crear: theme.palette.secondary.main,
      editar: theme.palette.warning.main, eliminar: theme.palette.error.main,
      aprobar: '#8B5CF6', exportar: theme.palette.text.secondary,
    };
    return map[a] ?? theme.palette.text.secondary;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckBoxOutlined sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: theme.palette.text.primary }}>Opciones</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>Acciones disponibles en cada menú</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Recargar"><IconButton onClick={load} size="small"><RefreshOutlined /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate} sx={{ borderRadius: 2, textTransform: 'none' }}>Nueva opción</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TextField
        size="small" placeholder="Buscar por nombre o código…" value={search}
        onChange={e => setSearch(e.target.value)}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18 }} /></InputAdornment> } }}
        sx={{ mb: 2, width: { xs: '100%', sm: 340 } }}
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                {['Nombre', 'Código', 'Acción', 'Menú', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.78rem', color: theme.palette.text.disabled }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: theme.palette.text.disabled }}>Sin resultados</TableCell></TableRow>
              ) : filtered.map(o => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{o.nombre}</TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F3F5', px: 0.8, py: 0.3, borderRadius: 1 }}>{o.codigo}</Typography></TableCell>
                  <TableCell>
                    <Chip label={o.accion} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, color: accionColor(o.accion), bgcolor: `${accionColor(o.accion)}22` }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary }}>
                    {menus.find(m => m.id === o.menu)?.nombre ?? `#${o.menu}`}
                  </TableCell>
                  <TableCell>
                    <Chip label={o.is_active ? 'Activo' : 'Inactivo'} size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600,
                        color: o.is_active ? theme.palette.secondary.main : theme.palette.text.disabled,
                        bgcolor: o.is_active ? `${theme.palette.secondary.main}22` : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F3F5') }} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(o)}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteId(o.id)}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700 }}>
          {editing ? 'Editar opción' : 'Nueva opción'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} size="small" sx={{ gridColumn: '1 / -1' }} />
            <TextField label="Código único *" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} size="small" placeholder="ej: semilleros.ver" />
            <FormControl size="small">
              <InputLabel>Acción *</InputLabel>
              <Select label="Acción *" value={form.accion} onChange={e => setForm(f => ({ ...f, accion: e.target.value as AccionType }))}>
                {ACCIONES.map(a => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ gridColumn: '1 / -1' }}>
              <InputLabel>Menú *</InputLabel>
              <Select label="Menú *" value={form.menu} onChange={e => setForm(f => ({ ...f, menu: e.target.value }))}>
                {menus.map(m => <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} size="small" multiline rows={2} sx={{ gridColumn: '1 / -1' }} />
            <FormControlLabel
              control={<Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} color="success" />}
              label="Opción activa"
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
        <DialogTitle sx={{ fontWeight: 600 }}>¿Eliminar opción?</DialogTitle>
        <DialogContent><Typography variant="body2">Los permisos asociados a esta opción también se verán afectados.</Typography></DialogContent>
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
