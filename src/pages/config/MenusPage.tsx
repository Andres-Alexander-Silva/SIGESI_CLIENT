import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  CircularProgress, Alert, Tooltip, InputAdornment, TablePagination,
} from '@mui/material';
import {
  AddOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  MenuOutlined, RefreshOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { menusAdminService } from '@/services/config.service';
import { MenuAdmin } from '@/types';

const EMPTY_FORM = { nombre: '', icono: '', estado: true };

export default function MenusPage() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [menus,   setMenus]   = useState<MenuAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
  useEffect(() => { setPage(0); }, [search]);

  const filtered = menus.filter(m =>
    `${m.nombre} ${m.icono}`.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setDialogOpen(true); };
  const openEdit   = (m: MenuAdmin) => {
    setEditing(m);
    setForm({ nombre: m.nombre, icono: m.icono, estado: m.estado ?? true });
    setFormError(''); setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormError('');
    try {
      const payload: Partial<MenuAdmin> = { nombre: form.nombre, icono: form.icono, estado: form.estado };
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
        size="small" placeholder="Buscar por nombre o icono…" value={search}
        onChange={e => setSearch(e.target.value)}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18 }} /></InputAdornment> } }}
        sx={{ mb: 2, width: { xs: '100%', sm: 340 } }}
      />

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                {['Nombre', 'Icono', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.78rem', color: theme.palette.text.disabled }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: theme.palette.text.disabled }}>Sin resultados</TableCell></TableRow>
              ) : paginated.map(m => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{m.nombre}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F3F5', px: 0.8, py: 0.3, borderRadius: 1 }}>
                      {m.icono || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={m.estado !== false ? 'Activo' : 'Inactivo'} size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600,
                        color: m.estado !== false ? theme.palette.secondary.main : theme.palette.text.secondary,
                        bgcolor: m.estado !== false ? `${theme.palette.secondary.main}22` : (isDark ? 'rgba(255,255,255,0.1)' : '#F1F3F5') }} />
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700 }}>
          {editing ? 'Editar menú' : 'Nuevo menú'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} size="small" />
            <TextField label="Icono (ej: fa-gauge)" value={form.icono} onChange={e => setForm(f => ({ ...f, icono: e.target.value }))} size="small" />
            <FormControlLabel
              control={<Switch checked={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.checked }))} color="success" />}
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
        <DialogContent><Typography variant="body2">Sus opciones asociadas podrían verse afectadas.</Typography></DialogContent>
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
