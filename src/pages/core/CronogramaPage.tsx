// src/pages/core/CronogramaPage.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  IconButton, Tooltip, Alert, Skeleton,
  Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Divider,
  Card, CardContent, Grid, InputAdornment,
  LinearProgress, Collapse, Badge, List,
  ListItem, ListItemText, ListItemSecondaryAction,
  Switch, FormControlLabel,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteIcon        from '@mui/icons-material/Delete';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import SearchIcon        from '@mui/icons-material/Search';
import FilterListIcon    from '@mui/icons-material/FilterList';
import EventNoteIcon     from '@mui/icons-material/EventNote';
import CheckBoxIcon      from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ExpandMoreIcon    from '@mui/icons-material/ExpandMore';
import ExpandLessIcon    from '@mui/icons-material/ExpandLess';
import AddTaskIcon       from '@mui/icons-material/AddTask';
import TimelineIcon      from '@mui/icons-material/Timeline';
import PersonIcon        from '@mui/icons-material/Person';

import { useAuth }               from '@/context/AuthContext';
import { useCronograma }         from '@/hooks/useCronograma';
import {
  actividadCronogramaService,
} from '@/services/planEstrategico.service';
import { planAccionService }     from '@/services/planAccion.service';
import {
  CronogramaSemestral, CronogramaSemestralCreate,
  ActividadCronograma, ActividadCronogramaCreate,
  CronogramaFilters,
  ESTADO_CRONOGRAMA_LABELS, ESTADO_CRONOGRAMA_COLOR,
  EstadoCronogramaSemestral,
} from '@/types/planEstrategico';
import { formatApiError } from '@/utils/apiError';
import type { PlanAccion } from '@/types/planAccion';
import { UserRole } from '@/types';

// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES_ESCRITURA: UserRole[] = ['administrador', 'director_grupo', 'director_semillero'];

function getSemestres(): string[] {
  const year = new Date().getFullYear();
  const opts: string[] = [];
  for (let y = year - 1; y <= year + 1; y++) opts.push(`${y}-1`, `${y}-2`);
  return opts;
}

// ─── Estado chip ──────────────────────────────────────────────────────────────
function EstadoActividadChip({ estado }: { estado: string }) {
  const label = ESTADO_CRONOGRAMA_LABELS[estado as EstadoCronogramaSemestral] ?? estado;
  const color = ESTADO_CRONOGRAMA_COLOR[estado as EstadoCronogramaSemestral] ?? 'default';
  return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
}

// ─── Mini barra de cumplimiento ───────────────────────────────────────────────
function CumplimientoBar({ actividades }: { actividades: ActividadCronograma[] }) {
  if (!actividades?.length) return <Typography variant="caption" color="text.secondary">Sin actividades</Typography>;
  // No hay estado en ActividadCronograma base (es solo el contenedor), mostramos conteo
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {actividades.length} actividad{actividades.length !== 1 ? 'es' : ''}
      </Typography>
    </Stack>
  );
}

// ─── Form por defecto ─────────────────────────────────────────────────────────
const EMPTY_FORM: CronogramaSemestralCreate = {
  plan_accion:  0,
  descripcion:  '',
  responsable:  null,
  fecha_inicio: '',
  fecha_fin:    '',
  cumplido:     false,
};

const EMPTY_ACTIVIDAD: ActividadCronogramaCreate = {
  cronograma:          0,
  titulo:              '',
  descripcion:         '',
  responsable:         null,
  objetivo_general:    '',
  objetivos_especificos: '',
  fecha_inicio:        '',
  fecha_fin_estimada:  '',
  fecha_fin:           null,
};

// ─── Timeline visual de actividades ──────────────────────────────────────────
function TimelineActividades({ actividades }: { actividades: ActividadCronograma[] }) {
  if (!actividades?.length) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <TimelineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Sin actividades registradas
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', pl: 2 }}>
      {/* Línea vertical */}
      <Box sx={{
        position: 'absolute', left: 14, top: 8, bottom: 8,
        width: 2, bgcolor: 'divider', zIndex: 0,
      }} />
      {actividades.map((act, idx) => {
        const today = new Date();
        const fin   = new Date(act.fecha_fin_estimada);
        const esAtrasada = fin < today && !act.fecha_fin;
        return (
          <Box key={act.id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, position: 'relative', zIndex: 1 }}>
            {/* Dot */}
            <Box sx={{
              width: 12, height: 12, borderRadius: '50%', flexShrink: 0, mt: '4px',
              bgcolor: act.fecha_fin ? 'success.main' : esAtrasada ? 'error.main' : 'primary.main',
              border: '2px solid white',
              boxShadow: 1,
            }} />
            <Paper variant="outlined" sx={{ ml: 1.5, p: 1.5, flex: 1, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={0.5}>
                <Typography variant="body2" fontWeight={600}>{act.titulo}</Typography>
                {act.fecha_fin
                  ? <Chip label="Finalizada" color="success" size="small" />
                  : esAtrasada
                  ? <Chip label="Atrasada" color="error" size="small" />
                  : <Chip label="Pendiente" size="small" />
                }
              </Stack>
              {act.descripcion && (
                <Typography variant="caption" color="text.secondary">{act.descripcion}</Typography>
              )}
              <Stack direction="row" spacing={2} mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Inicio: {new Date(act.fecha_inicio).toLocaleDateString('es-CO')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fin est.: {new Date(act.fecha_fin_estimada).toLocaleDateString('es-CO')}
                </Typography>
                {act.responsable_nombre && (
                  <Stack direction="row" spacing={0.3} alignItems="center">
                    <PersonIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">{act.responsable_nombre}</Typography>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CronogramaPage() {
  const { user }   = useAuth();
  const hook       = useCronograma();
  const canWrite   = ROLES_ESCRITURA.some(r => user?.roles?.includes(r));

  // ── State ──────────────────────────────────────────────────────────────────
  const [planes, setPlanes]   = useState<PlanAccion[]>([]);
  const [page, setPage]       = useState(0);
  const [rowsPerPage]         = useState(10);
  const [search, setSearch]   = useState('');
  const [filterPlan, setFilterPlan]       = useState('');
  const [filterSemestre, setFilterSemestre] = useState('');
  const [showFilters, setShowFilters]     = useState(false);
  const [expandedRow, setExpandedRow]     = useState<number | null>(null);
  const [viewMode, setViewMode]           = useState<'table' | 'timeline'>('table');

  // Dialogs
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [detailOpen, setDetailOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [actDialogOpen, setActDialogOpen] = useState(false);
  const [selected, setSelected]         = useState<CronogramaSemestral | null>(null);
  const [form, setForm]                 = useState<CronogramaSemestralCreate>(EMPTY_FORM);
  const [actForm, setActForm]           = useState<ActividadCronogramaCreate>(EMPTY_ACTIVIDAD);
  const [selectedAct, setSelectedAct]   = useState<ActividadCronograma | null>(null);
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);
  const [actFormError, setActFormError] = useState<string | null>(null);

  // ── Carga ─────────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    const filters: CronogramaFilters = {
      search:      search || undefined,
      plan_accion: filterPlan || undefined,
      semestre:    filterSemestre || undefined,
      page:        page + 1,
    };
    hook.fetchList(filters);
  }, [hook.fetchList, search, filterPlan, filterSemestre, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    planAccionService.list()
      .then(r => setPlanes(r.results))
      .catch(() => {});
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: CronogramaSemestral) => {
    setSelected(item);
    setForm({
      plan_accion: item.plan_accion,
      descripcion: item.descripcion ?? '',
      responsable: item.responsable ?? null,
      fecha_inicio: item.fecha_inicio,
      fecha_fin:    item.fecha_fin,
      cumplido:     item.cumplido,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const openDetail = (item: CronogramaSemestral) => {
    setSelected(item);
    setDetailOpen(true);
  };

  const openDelete = (item: CronogramaSemestral) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  const openAddActividad = (cron: CronogramaSemestral) => {
    setSelected(cron);
    setSelectedAct(null);
    setActForm({ ...EMPTY_ACTIVIDAD, cronograma: cron.id });
    setActFormError(null);
    setActDialogOpen(true);
  };

  const openEditActividad = (cron: CronogramaSemestral, act: ActividadCronograma) => {
    setSelected(cron);
    setSelectedAct(act);
    setActForm({
      cronograma:            act.cronograma,
      titulo:                act.titulo,
      descripcion:           act.descripcion ?? '',
      responsable:           act.responsable ?? null,
      objetivo_general:      act.objetivo_general ?? '',
      objetivos_especificos: act.objetivos_especificos ?? '',
      fecha_inicio:          act.fecha_inicio,
      fecha_fin_estimada:    act.fecha_fin_estimada,
      fecha_fin:             act.fecha_fin ?? null,
    });
    setActFormError(null);
    setActDialogOpen(true);
  };

  // ── CRUD cronograma ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.plan_accion || !form.fecha_inicio || !form.fecha_fin) {
      setFormError('Plan de acción, fecha inicio y fecha fin son obligatorios');
      return;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      setFormError('La fecha de fin debe ser mayor o igual a la fecha de inicio');
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

  // ── CRUD actividades ──────────────────────────────────────────────────────
  const handleSaveActividad = async () => {
    if (!actForm.titulo.trim() || !actForm.fecha_inicio || !actForm.fecha_fin_estimada) {
      setActFormError('Título, fecha inicio y fecha fin estimada son obligatorios');
      return;
    }
    if (actForm.fecha_fin_estimada < actForm.fecha_inicio) {
      setActFormError('La fecha fin estimada debe ser mayor o igual al inicio');
      return;
    }
    setSaving(true);
    setActFormError(null);
    try {
      if (selectedAct) {
        await actividadCronogramaService.update(selectedAct.id, actForm);
      } else {
        await actividadCronogramaService.create(actForm);
      }
      setActDialogOpen(false);
      load();
    } catch (e) {
      setActFormError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActividad = async (actId: number) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try {
      await actividadCronogramaService.remove(actId);
      load();
    } catch (e) {
      alert(formatApiError(e));
    }
  };

  // ── Estadísticas ──────────────────────────────────────────────────────────
  const items = hook.data?.results ?? [];
  const totalCumplidos = items.filter(i => i.cumplido).length;
  const totalActividades = items.reduce((s, i) => s + (i.actividades?.length ?? 0), 0);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
             alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary">
            Cronogramas Semestrales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Planificación y seguimiento de actividades estratégicas por semestre
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<TimelineIcon />}
            onClick={() => setViewMode(v => v === 'timeline' ? 'table' : 'timeline')}>
            {viewMode === 'timeline' ? 'Ver tabla' : 'Ver timeline'}
          </Button>
          {canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Nuevo Cronograma
            </Button>
          )}
        </Stack>
      </Stack>

      {/* ── Tarjetas resumen ─────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total cronogramas', value: hook.data?.count ?? 0, color: 'text.primary' },
          { label: 'Cumplidos', value: totalCumplidos, color: 'success.main' },
          { label: 'En proceso', value: (hook.data?.count ?? 0) - totalCumplidos, color: 'primary.main' },
          { label: 'Total actividades', value: totalActividades, color: 'warning.dark' },
        ].map(({ label, value, color }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: '12px !important', px: 2 }}>
                <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            size="small" placeholder="Buscar cronograma..." value={search}
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
              select size="small" label="Plan de acción" value={filterPlan}
              onChange={e => { setFilterPlan(e.target.value); setPage(0); }}
              sx={{ minWidth: 200 }}>
              <MenuItem value="">Todos</MenuItem>
              {planes.map(p => <MenuItem key={p.id} value={String(p.id)}>{p.titulo}</MenuItem>)}
            </TextField>
            <TextField
              select size="small" label="Semestre" value={filterSemestre}
              onChange={e => { setFilterSemestre(e.target.value); setPage(0); }}
              sx={{ minWidth: 140 }}>
              <MenuItem value="">Todos</MenuItem>
              {getSemestres().map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <Button size="small" onClick={() => { setSearch(''); setFilterPlan(''); setFilterSemestre(''); setPage(0); }}>
              Limpiar
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      {hook.error && <Alert severity="error" sx={{ mb: 2 }}>{hook.error}</Alert>}

      {/* ── Vista tabla ─────────────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell />
                <TableCell sx={{ fontWeight: 700 }}>Semillero / Plan</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semestre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Cumplido</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actividades</TableCell>
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
                        No se encontraron cronogramas
                      </TableCell>
                    </TableRow>
                  )
                  : items.map(item => (
                    <>
                      <TableRow key={item.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell padding="checkbox">
                          <IconButton size="small" onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}>
                            {expandedRow === item.id ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.semillero_nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {planes.find(p => p.id === item.plan_accion)?.titulo ?? `Plan #${item.plan_accion}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.semestre} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(item.fecha_inicio).toLocaleDateString('es-CO')} —{' '}
                            {new Date(item.fecha_fin).toLocaleDateString('es-CO')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {item.cumplido
                            ? <CheckBoxIcon color="success" fontSize="small" />
                            : <CheckBoxOutlineBlankIcon color="disabled" fontSize="small" />}
                        </TableCell>
                        <TableCell align="center">
                          <Badge badgeContent={item.actividades?.length ?? 0} color="primary">
                            <EventNoteIcon fontSize="small" color="action" />
                          </Badge>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Ver detalle">
                              <IconButton size="small" onClick={() => openDetail(item)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canWrite && (
                              <>
                                <Tooltip title="Agregar actividad">
                                  <IconButton size="small" color="primary" onClick={() => openAddActividad(item)}>
                                    <AddTaskIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <IconButton size="small" onClick={() => openEdit(item)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton size="small" color="error" onClick={() => openDelete(item)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                      {/* Fila expandida con actividades */}
                      {expandedRow === item.id && (
                        <TableRow key={`exp-${item.id}`}>
                          <TableCell colSpan={7} sx={{ py: 0 }}>
                            <Collapse in timeout="auto">
                              <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                  <Typography variant="subtitle2" fontWeight={700}>
                                    Actividades del cronograma
                                  </Typography>
                                  {canWrite && (
                                    <Button size="small" startIcon={<AddIcon />} onClick={() => openAddActividad(item)}>
                                      Agregar
                                    </Button>
                                  )}
                                </Stack>
                                {!item.actividades?.length ? (
                                  <Typography variant="body2" color="text.secondary">
                                    Sin actividades registradas
                                  </Typography>
                                ) : (
                                  <List dense disablePadding>
                                    {item.actividades.map(act => (
                                      <ListItem
                                        key={act.id}
                                        divider
                                        sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 0.5 }}>
                                        <ListItemText
                                          primary={<Typography variant="body2" fontWeight={600}>{act.titulo}</Typography>}
                                          secondary={
                                            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={0.5}>
                                              <Typography variant="caption">
                                                {new Date(act.fecha_inicio).toLocaleDateString('es-CO')} →{' '}
                                                {new Date(act.fecha_fin_estimada).toLocaleDateString('es-CO')}
                                              </Typography>
                                              {act.responsable_nombre && (
                                                <Typography variant="caption" color="text.secondary">
                                                  👤 {act.responsable_nombre}
                                                </Typography>
                                              )}
                                              {act.fecha_fin && (
                                                <Chip label="Finalizada" color="success" size="small" />
                                              )}
                                            </Stack>
                                          }
                                        />
                                        {canWrite && (
                                          <ListItemSecondaryAction>
                                            <IconButton size="small" onClick={() => openEditActividad(item, act)}>
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDeleteActividad(act.id)}>
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </ListItemSecondaryAction>
                                        )}
                                      </ListItem>
                                    ))}
                                  </List>
                                )}
                                {item.descripcion && (
                                  <Box mt={1.5}>
                                    <Typography variant="caption" color="text.secondary">
                                      Descripción: {item.descripcion}
                                    </Typography>
                                  </Box>
                                )}
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
      ) : (
        /* ── Vista Timeline ────────────────────────────────────────── */
        <Box>
          {hook.loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="outlined" sx={{ mb: 2, borderRadius: 2, p: 2 }}>
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="rectangular" height={100} sx={{ mt: 1, borderRadius: 1 }} />
              </Card>
            ))
          ) : items.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
              <TimelineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No se encontraron cronogramas</Typography>
            </Paper>
          ) : (
            items.map(item => (
              <Card key={item.id} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" fontWeight={700}>{item.semillero_nombre}</Typography>
                        <Chip label={item.semestre} size="small" color="primary" variant="outlined" />
                        {item.cumplido && <Chip label="Cumplido" size="small" color="success" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(item.fecha_inicio).toLocaleDateString('es-CO')} —{' '}
                        {new Date(item.fecha_fin).toLocaleDateString('es-CO')}
                      </Typography>
                    </Box>
                    {canWrite && (
                      <Stack direction="row" spacing={0.5}>
                        <Button size="small" startIcon={<AddTaskIcon />} onClick={() => openAddActividad(item)}>
                          Actividad
                        </Button>
                        <IconButton size="small" onClick={() => openEdit(item)}><EditIcon fontSize="small" /></IconButton>
                      </Stack>
                    )}
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <TimelineActividades actividades={item.actividades ?? []} />
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL: Crear / Editar cronograma
      ════════════════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {selected ? 'Editar Cronograma' : 'Nuevo Cronograma Semestral'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select fullWidth label="Plan de acción *" size="small"
                value={form.plan_accion || ''}
                onChange={e => setForm(f => ({ ...f, plan_accion: Number(e.target.value) }))}>
                {planes.map(p => <MenuItem key={p.id} value={p.id}>{p.titulo} — {p.semestre}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={2} label="Descripción" size="small"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Fecha de inicio *" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Fecha de fin *" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                value={form.fecha_fin}
                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.cumplido ?? false}
                    onChange={e => setForm(f => ({ ...f, cumplido: e.target.checked }))}
                    color="success"
                  />
                }
                label="Marcar como cumplido"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : selected ? 'Actualizar' : 'Crear Cronograma'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          MODAL: Agregar / Editar actividad
      ════════════════════════════════════════════════════════════════ */}
      <Dialog open={actDialogOpen} onClose={() => setActDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>
          {selectedAct ? 'Editar Actividad' : 'Nueva Actividad'}
          {selected && (
            <Typography variant="caption" color="text.secondary" display="block">
              Cronograma: {selected.semillero_nombre} — {selected.semestre}
            </Typography>
          )}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {actFormError && <Alert severity="error" sx={{ mb: 2 }}>{actFormError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Título de la actividad *" size="small"
                value={actForm.titulo}
                onChange={e => setActForm(f => ({ ...f, titulo: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={2} label="Descripción" size="small"
                value={actForm.descripcion}
                onChange={e => setActForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={2} label="Objetivo general" size="small"
                value={actForm.objetivo_general}
                onChange={e => setActForm(f => ({ ...f, objetivo_general: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={2} label="Objetivos específicos" size="small"
                value={actForm.objetivos_especificos}
                onChange={e => setActForm(f => ({ ...f, objetivos_especificos: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Fecha de inicio *" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                value={actForm.fecha_inicio}
                onChange={e => setActForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Fecha fin estimada *" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                value={actForm.fecha_fin_estimada}
                onChange={e => setActForm(f => ({ ...f, fecha_fin_estimada: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Fecha fin real (si completada)" type="date" size="small"
                InputLabelProps={{ shrink: true }}
                value={actForm.fecha_fin ?? ''}
                onChange={e => setActForm(f => ({ ...f, fecha_fin: e.target.value || null }))}
                helperText="Dejar vacío si la actividad no ha concluido"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveActividad} disabled={saving}>
            {saving ? 'Guardando...' : selectedAct ? 'Actualizar' : 'Agregar Actividad'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          MODAL: Detalle completo
      ════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EventNoteIcon color="primary" />
            <Box>
              Cronograma — {selected?.semillero_nombre}
              <Stack direction="row" spacing={1} mt={0.5}>
                <Chip label={selected?.semestre} size="small" color="primary" variant="outlined" />
                {selected?.cumplido && <Chip label="Cumplido" size="small" color="success" />}
              </Stack>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {selected && (
            <>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" color="text.secondary">Período</Typography>
                  <Typography fontWeight={600}>
                    {new Date(selected.fecha_inicio).toLocaleDateString('es-CO')} —{' '}
                    {new Date(selected.fecha_fin).toLocaleDateString('es-CO')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" color="text.secondary">Responsable</Typography>
                  <Typography fontWeight={600}>{selected.responsable_nombre ?? '—'}</Typography>
                </Grid>
                {selected.descripcion && (
                  <Grid item xs={12}>
                    <Typography variant="overline" color="text.secondary">Descripción</Typography>
                    <Typography>{selected.descripcion}</Typography>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Actividades ({selected.actividades?.length ?? 0})
                </Typography>
                {canWrite && (
                  <Button size="small" startIcon={<AddTaskIcon />}
                    onClick={() => { setDetailOpen(false); openAddActividad(selected); }}>
                    Agregar actividad
                  </Button>
                )}
              </Stack>
              <TimelineActividades actividades={selected.actividades ?? []} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          MODAL: Confirmar eliminación
      ════════════════════════════════════════════════════════════════ */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>¿Eliminar cronograma?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>Esta acción es irreversible.</Alert>
          <Typography>
            Se eliminará el cronograma de <strong>{selected?.semillero_nombre}</strong> para el semestre{' '}
            <strong>{selected?.semestre}</strong> y todas sus actividades.
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
