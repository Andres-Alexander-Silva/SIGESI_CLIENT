import { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  IconButton, Tooltip, Alert, Skeleton,
  Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Divider,
  Card, CardContent, Grid, Collapse,
} from '@mui/material';
import AddIcon            from '@mui/icons-material/Add';
import EditIcon           from '@mui/icons-material/Edit';
import DeleteIcon         from '@mui/icons-material/Delete';
import VisibilityIcon     from '@mui/icons-material/Visibility';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import CancelIcon         from '@mui/icons-material/Cancel';
import SearchIcon         from '@mui/icons-material/Search';
import FilterListIcon     from '@mui/icons-material/FilterList';
import AssignmentIcon     from '@mui/icons-material/Assignment';
import AddCircleIcon      from '@mui/icons-material/AddCircle';
import RemoveCircleIcon   from '@mui/icons-material/RemoveCircle';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import ExpandLessIcon     from '@mui/icons-material/ExpandLess';

import { useAuth }        from '@/context/AuthContext';
import { usePlanAccion }  from '@/hooks/usePlanAccion';
import { semillerosService } from '@/services/core.service';
import {
  PlanAccion, PlanAccionCreate, ObjetivoPlanAccion,
  EstadoPlanAccion, CategoriaObjetivo,
  ESTADO_PLAN_LABELS, ESTADO_PLAN_COLOR, CATEGORIA_LABELS,
} from '@/types/planAccion';
import { formatApiError } from '@/utils/apiError';
import { useEffect } from 'react';
import type { Semillero } from '@/types/core';
import { UserRole } from '@/types';

// ─── Constantes de rol ────────────────────────────────────────────────────────
const ROLES_ESCRITURA: UserRole[] = ['administrador', 'director_grupo', 'director_semillero', 'lider_estudiantil'];
const ROLES_APROBADOR : UserRole[] = ['administrador', 'director_grupo'];

// ─── Semestres disponibles ────────────────────────────────────────────────────
function getSemestres(): string[] {
  const year = new Date().getFullYear();
  const opts: string[] = [];
  for (let y = year - 1; y <= year + 1; y++) {
    opts.push(`${y}-1`, `${y}-2`);
  }
  return opts;
}

// ─── Chip de estado ───────────────────────────────────────────────────────────
function EstadoChip({ estado }: { estado: EstadoPlanAccion }) {
  return (
    <Chip
      label={ESTADO_PLAN_LABELS[estado] ?? estado}
      color={ESTADO_PLAN_COLOR[estado] ?? 'default'}
      size="small"
      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
    />
  );
}

// ─── Skeleton de tabla ────────────────────────────────────────────────────────
function SkeletonRows({ cols = 7, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}><Skeleton variant="text" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Formulario crear / editar
// ─────────────────────────────────────────────────────────────────────────────
interface FormModalProps {
  open:       boolean;
  editItem:   PlanAccion | null;
  semilleros: Semillero[];
  onClose:    () => void;
  onSave:     (payload: PlanAccionCreate) => Promise<void>;
}

const OBJETIVO_VACIO: ObjetivoPlanAccion = { descripcion: '', categoria: 'academicos' };

function FormModal({ open, editItem, semilleros, onClose, onSave }: FormModalProps) {
  const [saving, setSaving]   = useState(false);
  const [apiErr, setApiErr]   = useState<string | null>(null);

  // Campos del form
  const [semillero,  setSemillero]  = useState('');
  const [titulo,     setTitulo]     = useState('');
  const [semestre,   setSemestre]   = useState('');
  const [metas,      setMetas]      = useState('');
  const [estado,     setEstado]     = useState<EstadoPlanAccion>('borrador');
  const [objetivos,  setObjetivos]  = useState<ObjetivoPlanAccion[]>([{ ...OBJETIVO_VACIO }]);

  // Prellenar al editar
  useEffect(() => {
    if (editItem) {
      setSemillero(String(editItem.semillero));
      setTitulo(editItem.titulo);
      setSemestre(editItem.semestre);
      setMetas(editItem.metas);
      setEstado(editItem.estado);
      setObjetivos(editItem.objetivos.length > 0
        ? editItem.objetivos.map(o => ({ descripcion: o.descripcion, categoria: o.categoria }))
        : [{ ...OBJETIVO_VACIO }]
      );
    } else {
      setSemillero('');
      setTitulo('');
      setSemestre('');
      setMetas('');
      setEstado('borrador');
      setObjetivos([{ ...OBJETIVO_VACIO }]);
    }
    setApiErr(null);
  }, [editItem, open]);

  // Manejo de objetivos
  const addObjetivo = () => setObjetivos(prev => [...prev, { ...OBJETIVO_VACIO }]);
  const removeObjetivo = (idx: number) =>
    setObjetivos(prev => prev.filter((_, i) => i !== idx));
  const updateObjetivo = (idx: number, field: keyof ObjetivoPlanAccion, value: string) =>
    setObjetivos(prev =>
      prev.map((o, i) => i === idx ? { ...o, [field]: value } : o)
    );

  const handleSave = async () => {
    if (!semillero || !titulo.trim() || !semestre || !metas.trim()) {
      setApiErr('Completa todos los campos obligatorios.');
      return;
    }
    if (objetivos.some(o => !o.descripcion.trim())) {
      setApiErr('Todos los objetivos deben tener descripción.');
      return;
    }
    setSaving(true);
    setApiErr(null);
    try {
      await onSave({
        semillero: Number(semillero),
        titulo: titulo.trim(),
        semestre,
        metas: metas.trim(),
        estado,
        objetivos,
      });
      onClose();
    } catch (err: any) {
      setApiErr(formatApiError(err, 'Error al guardar el plan de acción.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700 }}>
        {editItem ? 'Editar plan de acción' : 'Nuevo plan de acción'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {apiErr && <Alert severity="error" sx={{ borderRadius: 2 }}>{apiErr}</Alert>}

          {/* Fila 1: Semillero + Semestre */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <TextField
                select fullWidth required label="Semillero"
                value={semillero} onChange={e => setSemillero(e.target.value)}
              >
                {semilleros.map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>{s.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                select fullWidth required label="Semestre"
                value={semestre} onChange={e => setSemestre(e.target.value)}
              >
                {getSemestres().map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {/* Fila 2: Título */}
          <TextField
            fullWidth required label="Título del plan"
            value={titulo} onChange={e => setTitulo(e.target.value)}
            inputProps={{ maxLength: 300 }}
          />

          {/* Fila 3: Metas */}
          <TextField
            fullWidth required multiline rows={3} label="Metas"
            value={metas} onChange={e => setMetas(e.target.value)}
            placeholder="Describe las metas que se pretenden alcanzar..."
          />

          {/* Fila 4: Estado */}
          <TextField
            select fullWidth label="Estado"
            value={estado} onChange={e => setEstado(e.target.value as EstadoPlanAccion)}
          >
            {(Object.keys(ESTADO_PLAN_LABELS) as EstadoPlanAccion[]).map(k => (
              <MenuItem key={k} value={k}>{ESTADO_PLAN_LABELS[k]}</MenuItem>
            ))}
          </TextField>

          {/* Objetivos */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                Objetivos ({objetivos.length})
              </Typography>
              <Button
                size="small" startIcon={<AddCircleIcon />}
                onClick={addObjetivo} variant="outlined"
              >
                Agregar objetivo
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              {objetivos.map((obj, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Box flex={1}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            select fullWidth size="small" label="Categoría"
                            value={obj.categoria}
                            onChange={e => updateObjetivo(idx, 'categoria', e.target.value)}
                          >
                            {(Object.keys(CATEGORIA_LABELS) as CategoriaObjetivo[]).map(k => (
                              <MenuItem key={k} value={k}>{CATEGORIA_LABELS[k]}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <TextField
                            fullWidth size="small" label="Descripción *"
                            value={obj.descripcion}
                            onChange={e => updateObjetivo(idx, 'descripcion', e.target.value)}
                            multiline rows={2}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                    <Tooltip title="Eliminar objetivo">
                      <span>
                        <IconButton
                          size="small" color="error"
                          onClick={() => removeObjetivo(idx)}
                          disabled={objetivos.length === 1}
                        >
                          <RemoveCircleIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained" onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : editItem ? 'Actualizar' : 'Crear plan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Detalle / Vista
// ─────────────────────────────────────────────────────────────────────────────
function DetalleModal({ open, plan, onClose }: { open: boolean; plan: PlanAccion | null; onClose: () => void }) {
  if (!plan) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon color="primary" />
        {plan.titulo}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Badges */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <EstadoChip estado={plan.estado} />
            <Chip label={plan.semestre} size="small" variant="outlined" />
          </Stack>

          <Divider />

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
              SEMILLERO
            </Typography>
            <Typography variant="body2">{plan.semillero_nombre}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
              METAS
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{plan.metas}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
              OBJETIVOS ({plan.objetivos.length})
            </Typography>
            <Stack spacing={1}>
              {plan.objetivos.map((obj, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Chip
                    label={CATEGORIA_LABELS[obj.categoria] ?? obj.categoria}
                    size="small" variant="filled" sx={{ mb: 0.5, fontSize: '0.7rem' }}
                  />
                  <Typography variant="body2">{obj.descripcion}</Typography>
                </Paper>
              ))}
              {plan.objetivos.length === 0 && (
                <Typography variant="body2" color="text.secondary">Sin objetivos registrados.</Typography>
              )}
            </Stack>
          </Box>

          {plan.aprobado_por_nombre && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                APROBADO POR
              </Typography>
              <Typography variant="body2">{plan.aprobado_por_nombre}</Typography>
              {plan.fecha_aprobacion && (
                <Typography variant="caption" color="text.secondary">
                  {new Date(plan.fecha_aprobacion).toLocaleString('es-CO')}
                </Typography>
              )}
            </Box>
          )}

          <Divider />

          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">CREADO</Typography>
              <Typography variant="caption">{new Date(plan.created_at).toLocaleDateString('es-CO')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">ACTUALIZADO</Typography>
              <Typography variant="caption">{new Date(plan.updated_at).toLocaleDateString('es-CO')}</Typography>
            </Box>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Confirmar eliminación / acción
// ─────────────────────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open:     boolean;
  title:    string;
  message:  string;
  color?:   'error' | 'warning' | 'success';
  onConfirm: () => Promise<void>;
  onClose:  () => void;
}

function ConfirmDialog({ open, title, message, color = 'error', onConfirm, onClose }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setErr(null);
    try {
      await onConfirm();
      onClose();
    } catch (e: any) {
      setErr(formatApiError(e, 'Ocurrió un error.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"DM Sans", sans-serif' }}>{title}</DialogTitle>
      <DialogContent>
        {err && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{err}</Alert>}
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          variant="contained" color={color}
          onClick={handleConfirm} disabled={loading}
        >
          {loading ? 'Procesando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function PlanAccionPage() {
  const { activeRole } = useAuth();

  const puedeEscribir = activeRole != null && ROLES_ESCRITURA.includes(activeRole);
  const puedeAprobar  = activeRole != null && ROLES_APROBADOR.includes(activeRole);

  // Hook de datos
  const { data, isLoading, error, filters, setFilters, refresh, create, update, remove, aprobar, rechazar } =
    usePlanAccion();

  // Semilleros para el selector
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  useEffect(() => {
    semillerosService.list().then(setSemilleros).catch(() => {});
  }, []);

  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Modales
  const [formOpen,    setFormOpen]    = useState(false);
  const [editItem,    setEditItem]    = useState<PlanAccion | null>(null);
  const [detailPlan,  setDetailPlan]  = useState<PlanAccion | null>(null);
  const [deletePlan,  setDeletePlan]  = useState<PlanAccion | null>(null);
  const [aprobarPlan, setAprobarPlan] = useState<PlanAccion | null>(null);
  const [rechazarPlan,setRechazarPlan]= useState<PlanAccion | null>(null);

  // Acciones
  const handleSearch = useCallback(() => {
    setFilters({ search: searchInput });
  }, [searchInput, setFilters]);

  const handleOpenCreate = () => { setEditItem(null); setFormOpen(true); };
  const handleOpenEdit   = (p: PlanAccion) => { setEditItem(p); setFormOpen(true); };

  const handleSave = async (payload: PlanAccionCreate) => {
    if (editItem) {
      await update(editItem.id, payload);
    } else {
      await create(payload);
    }
  };

  const planes = data?.results ?? [];
  const total  = data?.count   ?? 0;
  const page   = (filters.page ?? 1) - 1;

  return (
    <Box>
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={3} spacing={1.5}>
        <Box>
          <Typography variant="h5" fontFamily='"DM Sans", sans-serif' fontWeight={700}>
            Planes de Acción
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de planes de acción semestrales por semillero
          </Typography>
        </Box>
        {puedeEscribir && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Nuevo plan
          </Button>
        )}
      </Stack>

      {/* ── Tarjetas métricas ────────────────────────────────────────────── */}
      {data && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total planes', value: total, color: '#C8102E' },
            { label: 'Aprobados',    value: planes.filter(p => p.estado === 'aprobado').length,    color: '#2D6E3C' },
            { label: 'En ejecución', value: planes.filter(p => p.estado === 'en_ejecucion').length, color: '#3B5BDB' },
            { label: 'Borradores',   value: planes.filter(p => p.estado === 'borrador').length,    color: '#868E96' },
          ].map(({ label, value, color }) => (
            <Grid item xs={6} md={3} key={label}>
              <Card variant="outlined">
                <CardContent sx={{ py: '12px !important' }}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="h5" fontFamily='"DM Sans", sans-serif' fontWeight={700} color={color}>
                    {value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Barra de búsqueda / filtros ──────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small" placeholder="Buscar por título..." sx={{ flex: 1 }}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} /> }}
          />
          <Button variant="outlined" onClick={handleSearch} size="small">Buscar</Button>
          <Tooltip title="Filtros avanzados">
            <IconButton size="small" onClick={() => setShowFilters(f => !f)} color={showFilters ? 'primary' : 'default'}>
              <FilterListIcon />
              {showFilters ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Filtros adicionales */}
        <Collapse in={showFilters}>
          <Divider sx={{ my: 1.5 }} />
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                select fullWidth size="small" label="Semillero"
                value={filters.semillero ?? ''}
                onChange={e => setFilters({ semillero: e.target.value || undefined })}
              >
                <MenuItem value="">Todos</MenuItem>
                {semilleros.map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>{s.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select fullWidth size="small" label="Semestre"
                value={filters.semestre ?? ''}
                onChange={e => setFilters({ semestre: e.target.value || undefined })}
              >
                <MenuItem value="">Todos</MenuItem>
                {getSemestres().map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} display="flex" alignItems="center">
              <Button
                size="small" variant="text" color="inherit"
                onClick={() => { setFilters({ semillero: undefined, semestre: undefined, search: undefined }); setSearchInput(''); }}
              >
                Limpiar filtros
              </Button>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* ── Alerta de error ──────────────────────────────────────────────── */}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
              <TableCell>Título</TableCell>
              <TableCell>Semillero</TableCell>
              <TableCell>Semestre</TableCell>
              <TableCell align="center">Objetivos</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <SkeletonRows cols={7} rows={6} />
            ) : planes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography color="text.secondary">No se encontraron planes de acción.</Typography>
                    {puedeEscribir && (
                      <Button size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                        Crear primer plan
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              planes.map(plan => (
                <TableRow key={plan.id} hover>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{plan.titulo}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>{plan.semillero_nombre}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={plan.semestre} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={plan.objetivos.length} size="small" />
                  </TableCell>
                  <TableCell>
                    <EstadoChip estado={plan.estado} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(plan.created_at).toLocaleDateString('es-CO')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => setDetailPlan(plan)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {puedeEscribir && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small" color="primary"
                            onClick={() => handleOpenEdit(plan)}
                            disabled={plan.estado === 'aprobado'}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {puedeAprobar && plan.estado !== 'aprobado' && plan.estado !== 'rechazado' && (
                        <>
                          <Tooltip title="Aprobar">
                            <IconButton size="small" color="success" onClick={() => setAprobarPlan(plan)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rechazar">
                            <IconButton size="small" color="warning" onClick={() => setRechazarPlan(plan)}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {puedeEscribir && (
                        <Tooltip title="Eliminar">
                          <span>
                            <IconButton
                              size="small" color="error"
                              onClick={() => setDeletePlan(plan)}
                              disabled={plan.estado === 'aprobado'}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={10}
          rowsPerPageOptions={[10]}
          onPageChange={(_, newPage) => setFilters({ page: newPage + 1 })}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      <FormModal
        open={formOpen}
        editItem={editItem}
        semilleros={semilleros}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <DetalleModal
        open={Boolean(detailPlan)}
        plan={detailPlan}
        onClose={() => setDetailPlan(null)}
      />

      <ConfirmDialog
        open={Boolean(deletePlan)}
        title="Eliminar plan de acción"
        message={`¿Estás seguro de eliminar "${deletePlan?.titulo}"? Esta acción no se puede deshacer.`}
        color="error"
        onConfirm={async () => { await remove(deletePlan!.id); setDeletePlan(null); }}
        onClose={() => setDeletePlan(null)}
      />

      <ConfirmDialog
        open={Boolean(aprobarPlan)}
        title="Aprobar plan de acción"
        message={`¿Deseas aprobar el plan "${aprobarPlan?.titulo}"?`}
        color="success"
        onConfirm={async () => { await aprobar(aprobarPlan!.id); setAprobarPlan(null); }}
        onClose={() => setAprobarPlan(null)}
      />

      <ConfirmDialog
        open={Boolean(rechazarPlan)}
        title="Rechazar plan de acción"
        message={`¿Deseas rechazar el plan "${rechazarPlan?.titulo}"?`}
        color="warning"
        onConfirm={async () => { await rechazar(rechazarPlan!.id); setRechazarPlan(null); }}
        onClose={() => setRechazarPlan(null)}
      />
    </Box>
  );
}
