import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Switch, FormControlLabel, CircularProgress, Alert, Tooltip,
  InputAdornment, TablePagination,
} from '@mui/material';
import {
  AddOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  CheckBoxOutlined, RefreshOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { opcionesService, menusAdminService } from '@/services/config.service';
import { OpcionAdmin, MenuAdmin } from '@/types';

const EMPTY_FORM = { menu: '' as string | number, nombre: '', url: '', estado: true };

export default function OpcionesPage() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [opciones, setOpciones] = useState<OpcionAdmin[]>([]);
  const [menus,    setMenus]    = useState<MenuAdmin[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
  useEffect(() => { setPage(0); }, [search]);

  const getMenuNombre = (id: number) => menus.find(m => m.id === id)?.nombre ?? `#${id}`;

  const filtered = opciones.filter(o =>
    `${o.nombre} ${o.url}`.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true); };
  const openEdit   = (o: OpcionAdmin) => {
    setEditing(o);
    setForm({ menu: o.menu, nombre: o.nombre, url: o.url, estado: o.estado ?? true });
    setFormError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      const payload: Partial<OpcionAdmin> = {
        menu:   Number(form.menu),
        nombre: form.nombre,
        url:    form.url,
        estado: form.estado,
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
                {['Nombre', 'URL', 'Menú', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.78rem', color: theme.palette.text.disabled }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: theme.palette.text.disabled }}>Sin resultados</TableCell></TableRow>
              ) : paginated.map(o => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{o.nombre}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F3F5', px: 0.8, py: 0.3, borderRadius: 1 }}>
                      {o.url}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary }}>{getMenuNombre(o.menu)}</TableCell>
                  <TableCell>
                    <Chip label={o.estado !== false ? 'Activo' : 'Inactivo'} size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600,
                        color: o.estado !== false ? theme.palette.secondary.main : theme.palette.text.secondary,
                        bgcolor: o.estado !== false ? `${theme.palette.secondary.main}22` : (isDark ? 'rgba(255,255,255,0.1)' : '#F1F3F5') }} />
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
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700 }}>
          {editing ? 'Editar opción' : 'Nueva opción'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} size="small" />
            <TextField label="URL *" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} size="small" placeholder="ej: /configuracion/usuarios" />
            <FormControl size="small" fullWidth>
              <InputLabel>Menú *</InputLabel>
              <Select label="Menú *" value={form.menu} onChange={e => setForm(f => ({ ...f, menu: e.target.value }))}>
                {menus.map(m => <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.checked }))} color="success" />}
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
