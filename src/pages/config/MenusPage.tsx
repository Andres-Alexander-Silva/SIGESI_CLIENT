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
  MenuOutlined, RefreshOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { menusAdminService } from '@/services/config.service';
import { MenuAdmin } from '@/types';

const EMPTY_FORM = { nombre: '', icono: '', url: '', orden: 0, menu_padre: '' as string | number, is_active: true };

export default function MenusPage() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [menus,   setMenus]   = useState<MenuAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<MenuAdmin | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setMenus(await menusAdminService.list()); }
    catch { setError('No se pudieron cargar los menús.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = menus.filter(m =>
    `${m.nombre} ${m.url ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true); };
  const openEdit   = (m: MenuAdmin) => {
    setEditing(m);
    setForm({ nombre: m.nombre, icono: m.icono ?? '', url: m.url ?? '', orden: m.orden, menu_padre: m.menu_padre ?? '', is_active: m.is_active });
    setFormError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      const payload: Partial<MenuAdmin> = {
        nombre:     form.nombre,
        icono:      form.icono || undefined,
        url:        form.url   || undefined,
        orden:      Number(form.orden),
        menu_padre: form.menu_padre === '' ? null : Number(form.menu_padre),
        is_active:  form.is_active,
      };
      if (editing) await menusAdminService.update(editing.id, payload);
      else         await menusAdminService.create(payload);
      setDialogOpen(false); load();
    } catch (e: any) {
      setFormError(e?.response?.data ? JSON.stringify(e.response.data) : 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleteLoading(true);
    try { await menusAdminService.remove(deleteId); setDeleteId(null); load(); }
    catch { setError('No se pudo eliminar el menú.'); }
    finally { setDeleteLoading(false); }
  };

  const getParentName = (id: number | null) => menus.find(m => m.id === id)?.nombre ?? '—';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MenuOutlined sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: theme.palette.text.primary }}>Menús</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>Configuración de la navegación del sistema</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Recargar"><IconButton onClick={load} size="small"><RefreshOutlined /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate} sx={{ borderRadius: 2, textTransform: 'none' }}>Nuevo menú</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TextField
        size="small" placeholder="Buscar por nombre o URL…" value={search}
        onChange={e => setSearch(e.target.value)}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18 }} /></InputAdornment> } }}
        sx={{ mb: 2, width: { xs: '100%', sm: 340 } }}
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                {['Nombre', 'Icono', 'URL', 'Orden', 'Padre', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.78rem', color: theme.palette.text.disabled }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: theme.palette.text.disabled }}>Sin resultados</TableCell></TableRow>
              ) : filtered.map(m => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{m.nombre}</TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F3F5', px: 0.8, py: 0.3, borderRadius: 1 }}>{m.icono || '—'}</Typography></TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary }}>{m.url || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.82rem' }}>{m.orden}</TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary }}>{getParentName(m.menu_padre)}</TableCell>
                  <TableCell>
                    <Chip label={m.is_active ? 'Activo' : 'Inactivo'} size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600,
                        color: m.is_active ? theme.palette.secondary.main : theme.palette.text.disabled,
                        bgcolor: m.is_active ? `${theme.palette.secondary.main}22` : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F3F5') }} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(m)}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setDeleteId(m.id)}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
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
          {editing ? 'Editar menú' : 'Nuevo menú'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} size="small" sx={{ gridColumn: '1 / -1' }} />
            <TextField label="Icono (ej: fa-gauge)" value={form.icono} onChange={e => setForm(f => ({ ...f, icono: e.target.value }))} size="small" />
            <TextField label="Orden" type="number" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))} size="small" />
            <TextField label="URL" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} size="small" sx={{ gridColumn: '1 / -1' }} />
            <FormControl size="small" sx={{ gridColumn: '1 / -1' }}>
              <InputLabel>Menú padre</InputLabel>
              <Select label="Menú padre" value={form.menu_padre}
                onChange={e => setForm(f => ({ ...f, menu_padre: e.target.value }))}>
                <MenuItem value="">— Ninguno (raíz) —</MenuItem>
                {menus.filter(m => m.id !== editing?.id).map(m => <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} color="success" />}
              label="Menú activo"
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
        <DialogTitle sx={{ fontWeight: 600 }}>¿Eliminar menú?</DialogTitle>
        <DialogContent><Typography variant="body2">Sus opciones y submenús asociados podrían verse afectados.</Typography></DialogContent>
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
