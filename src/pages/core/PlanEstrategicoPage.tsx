// src/pages/core/PlanEstrategicoPage.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  IconButton, Tooltip, Alert, Skeleton,
  Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Divider,
  Card, CardContent, Grid, InputAdornment,
  LinearProgress, Collapse,
} from '@mui/material';
import AddIcon         from '@mui/icons-material/Add';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import VisibilityIcon  from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon      from '@mui/icons-material/Cancel';
import SearchIcon      from '@mui/icons-material/Search';
import FilterListIcon  from '@mui/icons-material/FilterList';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import FlagIcon        from '@mui/icons-material/Flag';
import BarChartIcon    from '@mui/icons-material/BarChart';
import ExpandMoreIcon  from '@mui/icons-material/ExpandMore';
import ExpandLessIcon  from '@mui/icons-material/ExpandLess';

import { useAuth }              from '@/context/AuthContext';
import { usePlanEstrategico }   from '@/hooks/usePlanEstrategico';
import { semillerosService }    from '@/services/core.service';
import {
  PlanEstrategico, PlanEstrategicoCreate,
  EstadoPlanEstrategico,
  ESTADO_PE_LABELS, ESTADO_PE_COLOR,
} from '@/types/planEstrategico';
import { formatApiError } from '@/utils/apiError';
import type { Semillero } from '@/types/core';

// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES_ESCRITURA = ['administrador', 'director_grupo', 'director_semillero'];
const ROLES_APROBADOR = ['administrador', 'director_grupo'];

function getYears() {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1, y + 2];
}

// ─── Form por defecto ─────────────────────────────────────────────────────────
const EMPTY_FORM: PlanEstrategicoCreate = {
  semillero:   0,
  titulo:      '',
  anio:        new Date().getFullYear(),
  objetivos:   '',
  metas:       '',
  indicadores: '',
  estado:      'borrador',
};

// ─── Estado chip ──────────────────────────────────────────────────────────────
function EstadoChip({ estado }: { estado: EstadoPlanEstrategico }) {
  return (
    <Chip
      label={ESTADO_PE_LABELS[estado]}
      color={ESTADO_PE_COLOR[estado]}
      size="small"
      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
}

// ─── Barra de progreso de texto ───────────────────────────────────────────────
function ProgressField({ label, value }: { label: string; value: string }) {
  const lines = value ? value.split('\n').filter(Boolean).length : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" color="text.secondary">{lines} ítems</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min((lines / 5) * 100, 100)}
        sx={{ height: 4, borderRadius: 2 }}
      />
    </Box>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PlanEstrategicoPage() {
  const { user }     = useAuth();
  const hook         = usePlanEstrategico();
  const canWrite     = ROLES_ESCRITURA.some(r => user?.roles?.includes(r));
  const canApprove   = ROLES_APROBADOR.some(r => user?.roles?.includes(r));

  // ── State ──────────────────────────────────────────────────────────────────
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [page, setPage]             = useState(0);
  const [rowsPerPage]               = useState(10);
  const [search, setSearch]         = useState('');
  const [filterSemillero, setFilterSemillero] = useState('');
  const [filterAnio, setFilterAnio]           = useState('');
  const [filterEstado, setFilterEstado]       = useState('');
  const [showFilters, setShowFilters]         = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected]     = useState<PlanEstrategico | null>(null);
  const [form, setForm]             = useState<PlanEstrategicoCreate>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const load = useCallback(() => {
    hook.fetchList({
      search:    search || undefined,
      semillero: filterSemillero || undefined,
      anio:      filterAnio || undefined,
      estado:    filterEstado || undefined,
      page:      page + 1,
    });
  }, [hook.fetchList, search, filterSemillero, filterAnio, filterEstado, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    semillerosService.list({ page: 1 } as Parameters<typeof semillerosService.list>[0])
      .then(r => setSemilleros(Array.isArray(r) ? r : (r as { results: Semillero[] }).results ?? []))
      .catch(() => {});
  }, []);

  // ── Handlers CRUD ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: PlanEstrategico) => {
    setSelected(item);
    setForm({
      semillero:   item.semillero.id,
      titulo:      item.titulo,
      anio:        item.anio,
      objetivos:   item.objetivos,
      metas:       item.metas,
      indicadores: item.indicadores,
      estado:      item.estado,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const openDetail = (item: PlanEstrategico) => {
    setSelected(item);
    setDetailOpen(true);
  };

  const openDelete = (item: PlanEstrategico) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!form.semillero || !form.titulo.trim() || !form.objetivos.trim() ||
        !form.metas.trim() || !form.indicadores.trim()) {
      setFormError('Todos los campos marcados son obligatorios');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (selected) {
        await hook.update(selected.id, form);
      } else {
        await hook.create(form);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setFormError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await hook.remove(selected.id);
      setDeleteOpen(false);
      load();
    } catch (e) {
      setFormError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleAprobar = async (item: PlanEstrategico) => {
    try {
      await hook.aprobar(item.id);
      load();
    } catch (e) {
      alert(formatApiError(e));
    }
  };

  const handleRechazar = async (item: PlanEstrategico) => {
    try {
      await hook.rechazar(item.id);
      load();
    } catch (e) {
      alert(formatApiError(e));
    }
  };

  // ── Estadísticas resumen ───────────────────────────────────────────────────
  const items = hook.data?.results ?? [];
  const totalAprobados  = items.filter(i => i.estado === 'aprobado').length;
  const totalEjecucion  = items.filter(i => i.estado === 'en_ejecucion').length;
  const totalBorrador   = items.filter(i => i.estado === 'borrador').length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
             alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary">
            Planes Estratégicos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de objetivos, metas e indicadores institucionales
          </Typography>
        </Box>
        {canWrite && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo Plan
          </Button>
        )}
      </Stack>

      {/* ── Tarjetas de resumen ─────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total', value: hook.data?.count ?? 0, color: 'text.primary', icon: <TrackChangesIcon /> },
          { label: 'Aprobados', value: totalAprobados,  color: 'success.main', icon: <CheckCircleIcon /> },
          { label: 'En ejecución', value: totalEjecucion, color: 'primary.main', icon: <BarChartIcon /> },
          { label: 'Borradores', value: totalBorrador,  color: 'text.secondary', icon: <FlagIcon /> },
        ].map(({ label, value, color, icon }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: '12px !important', px: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ color }}>{icon}</Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            size="small" placeholder="Buscar plan..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ flexGrow: 1 }}
          />
          <Tooltip title={showFilters ? 'Ocultar filtros' : 'Más filtros'}>
            <IconButton onClick={() => setShowFilters(v => !v)} color={showFilters ? 'primary' : 'default'}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Collapse in={showFilters}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={1.5}>
            <TextField
              select size="small" label="Semillero" value={filterSemillero}
              onChange={e => { setFilterSemillero(e.target.value); setPage(0); }}
              sx={{ minWidth: 180 }}>
              <MenuItem value="">Todos</MenuItem>
              {semilleros.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.nombre}</MenuItem>)}
            </TextField>
            <TextField
              select size="small" label="Año" value={filterAnio}
              onChange={e => { setFilterAnio(e.target.value); setPage(0); }}
              sx={{ minWidth: 120 }}>
              <MenuItem value="">Todos</MenuItem>
              {getYears().map(y => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
            </TextField>
            <TextField
              select size="small" label="Estado" value={filterEstado}
              onChange={e => { setFilterEstado(e.target.value); setPage(0); }}
              sx={{ minWidth: 160 }}>
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(ESTADO_PE_LABELS).map(([k, v]) =>
                <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </TextField>
            <Button size="small" onClick={() => { setSearch(''); setFilterSemillero(''); setFilterAnio(''); setFilterEstado(''); setPage(0); }}>
              Limpiar
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      {/* ── Errores ─────────────────────────────────────────────────── */}
      {hook.error && <Alert severity="error" sx={{ mb: 2 }}>{hook.error}</Alert>}

      {/* ── Tabla ───────────────────────────────────────────────────── */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell />
              <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Semillero</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Año</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Aprobado por</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hook.loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              : items.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No se encontraron planes estratégicos
                    </TableCell>
                  </TableRow>
                )
                : items.map(item => (
                  <>
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ '&:last-child td': { border: 0 } }}
                    >
                      <TableCell padding="checkbox">
                        <IconButton size="small" onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}>
                          {expandedRow === item.id ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                          {item.titulo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.semillero?.nombre ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={item.anio} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <EstadoChip estado={item.estado} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.aprobado_por_nombre ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => openDetail(item)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canWrite && (
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => openEdit(item)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canApprove && item.estado !== 'aprobado' && (
                            <Tooltip title="Aprobar">
                              <IconButton size="small" color="success" onClick={() => handleAprobar(item)}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canApprove && item.estado !== 'rechazado' && (
                            <Tooltip title="Rechazar">
                              <IconButton size="small" color="error" onClick={() => handleRechazar(item)}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canWrite && (
                            <Tooltip title="Eliminar">
                              <IconButton size="small" color="error" onClick={() => openDelete(item)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                    {/* ── Fila expandida ── */}
                    {expandedRow === item.id && (
                      <TableRow key={`exp-${item.id}`}>
                        <TableCell colSpan={7} sx={{ py: 0 }}>
                          <Collapse in timeout="auto">
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="caption" fontWeight={700} color="primary" gutterBottom>
                                    OBJETIVOS
                                  </Typography>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {item.objetivos || '—'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="caption" fontWeight={700} color="secondary" gutterBottom>
                                    METAS
                                  </Typography>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {item.metas || '—'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="caption" fontWeight={700} color="warning.dark" gutterBottom>
                                    INDICADORES
                                  </Typography>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {item.indicadores || '—'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={hook.data?.count ?? 0}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
          onPageChange={(_, p) => setPage(p)}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: Crear / Editar
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selected ? 'Editar Plan Estratégico' : 'Nuevo Plan Estratégico'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth label="Título del plan *" size="small"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select fullWidth label="Año *" size="small"
                value={form.anio}
                onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}>
                {getYears().map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                select fullWidth label="Semillero *" size="small"
                value={form.semillero || ''}
                onChange={e => setForm(f => ({ ...f, semillero: Number(e.target.value) }))}>
                {semilleros.map(s => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select fullWidth label="Estado" size="small"
                value={form.estado ?? 'borrador'}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoPlanEstrategico }))}>
                {Object.entries(ESTADO_PE_LABELS).map(([k, v]) =>
                  <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={4} label="Objetivos estratégicos *" size="small"
                placeholder="Describa los objetivos estratégicos del plan (uno por línea recomendado)..."
                value={form.objetivos}
                onChange={e => setForm(f => ({ ...f, objetivos: e.target.value }))}
              />
              <ProgressField label="Objetivos ingresados" value={form.objetivos} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={4} label="Metas institucionales *" size="small"
                placeholder="Defina las metas medibles del plan..."
                value={form.metas}
                onChange={e => setForm(f => ({ ...f, metas: e.target.value }))}
              />
              <ProgressField label="Metas ingresadas" value={form.metas} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={3} label="Indicadores de seguimiento *" size="small"
                placeholder="Especifique los indicadores clave (KPI) para medir el avance..."
                value={form.indicadores}
                onChange={e => setForm(f => ({ ...f, indicadores: e.target.value }))}
              />
              <ProgressField label="Indicadores ingresados" value={form.indicadores} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : selected ? 'Actualizar' : 'Crear Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: Detalle
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TrackChangesIcon color="primary" />
            <Box>
              {selected?.titulo}
              <Stack direction="row" spacing={1} mt={0.5}>
                {selected && <EstadoChip estado={selected.estado} />}
                <Chip label={`Año ${selected?.anio}`} size="small" variant="outlined" />
              </Stack>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {selected && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="overline" color="text.secondary">Semillero</Typography>
                <Typography fontWeight={600}>{selected.semillero?.nombre ?? '—'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="overline" color="text.secondary">Aprobado por</Typography>
                <Typography fontWeight={600}>{selected.aprobado_por_nombre ?? 'Sin aprobar'}</Typography>
                {selected.fecha_aprobacion && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(selected.fecha_aprobacion).toLocaleDateString('es-CO')}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="overline" color="primary">Objetivos Estratégicos</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selected.objetivos}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="overline" color="secondary">Metas</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selected.metas}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="overline" color="warning.dark">Indicadores</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selected.indicadores}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
          {canWrite && selected && (
            <Button variant="outlined" onClick={() => { setDetailOpen(false); openEdit(selected); }}>
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: Confirmar eliminación
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>¿Eliminar plan estratégico?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>
            Esta acción es irreversible.
          </Alert>
          <Typography>
            Se eliminará <strong>{selected?.titulo}</strong> y todos sus datos asociados.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
