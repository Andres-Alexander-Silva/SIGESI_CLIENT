import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  IconButton, Tooltip, Alert, Skeleton,
  Card, CardContent, Grid, Divider,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import GroupsIcon from '@mui/icons-material/Groups';

import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionsContext';
import { useProduccionAcademica } from '@/hooks/useProduccionAcademica';

import {
  ProduccionAcademica,
  ProduccionAcademicaCreate,
  TIPO_LABELS,
} from '@/types/produccionAcademica';

import FiltrosProduccion from '@/components/produccionAcademica/FiltrosProduccion';
import EstadoChip from '@/components/produccionAcademica/EstadoChip';
import FormProduccion from '@/components/produccionAcademica/FormProduccion';
import DetalleProduccion from '@/components/produccionAcademica/DetalleProduccion';
import ConfirmarEliminar from '@/components/produccionAcademica/ConfirmarEliminar';

// ─── Roles con permisos de escritura ─────────────────────────────────────────
const ROLES_ESCRITURA = ['administrador', 'director_grupo', 'director_semillero'];
const ROLES_ADMIN     = ['administrador', 'director_grupo'];

// ─── Métricas rápidas (solo vista admin/director_grupo) ───────────────────────
function MetricCard({
  label, value, icon, color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
        <Box
          sx={{
            width: 44, height: 44, borderRadius: 2,
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
            {label}
          </Typography>
          <Typography variant="h5" fontFamily='"DM Sans", sans-serif' fontWeight={700} lineHeight={1.3}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Fila de skeleton para carga ─────────────────────────────────────────────
function SkeletonRows({ cols = 6, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}><Skeleton /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Vista estudiante / líder estudiantil (solo lectura, lista cards) ────────
function VistaEstudiante({
  items,
  onView,
}: {
  items: ProduccionAcademica[];
  onView: (item: ProduccionAcademica) => void;
}) {
  if (items.length === 0) {
    return (
      <Box textAlign="center" py={8} color="text.secondary">
        <ArticleIcon sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} />
        <Typography>No hay producciones académicas disponibles.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {items.map(item => (
        <Paper
          key={item.id}
          variant="outlined"
          sx={{
            p: 2,
            cursor: 'pointer',
            transition: 'border-color .15s',
            '&:hover': { borderColor: 'primary.main' },
          }}
          onClick={() => onView(item)}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box flex={1} minWidth={0}>
              <Stack direction="row" spacing={1} flexWrap="wrap" mb={0.75}>
                <Chip
                  label={TIPO_LABELS[item.tipo] ?? item.tipo}
                  size="small"
                  variant="outlined"
                />
                <EstadoChip estado={item.estado} />
              </Stack>
              <Typography variant="subtitle2" fontWeight={600} fontFamily='"DM Sans", sans-serif' mb={0.25}>
                {item.titulo}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.autores_nombres?.split(';')[0]?.trim()}
                {item.autores_nombres?.includes(';') ? ' y más' : ''}
                {item.revista_evento ? ` · ${item.revista_evento}` : ''}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
              {item.fecha_publicacion
                ? new Date(item.fecha_publicacion).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
                : '—'}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

// ─── Tabla principal (directores / admin) ────────────────────────────────────
function TablaProduccion({
  items,
  canEdit,
  onView,
  onEdit,
  onDelete,
}: {
  items: ProduccionAcademica[];
  canEdit: boolean;
  onView: (item: ProduccionAcademica) => void;
  onEdit: (item: ProduccionAcademica) => void;
  onDelete: (item: ProduccionAcademica) => void;
}) {
  if (items.length === 0) {
    return (
      <Box textAlign="center" py={8} color="text.secondary">
        <ArticleIcon sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} />
        <Typography>No se encontraron registros con los filtros aplicados.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, width: '40%' }}>Título</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Proyecto</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Publicación</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  onClick={() => onView(item)}
                >
                  {item.titulo}
                </Typography>
                {item.autores_nombres && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {item.autores_nombres.split(';')[0]?.trim()}
                    {item.autores_nombres.includes(';') ? ' +' : ''}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip label={TIPO_LABELS[item.tipo] ?? item.tipo} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{item.proyecto_titulo ?? '—'}</Typography>
              </TableCell>
              <TableCell>
                <EstadoChip estado={item.estado} />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {item.fecha_publicacion
                    ? new Date(item.fecha_publicacion).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })
                    : '—'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0} justifyContent="flex-end">
                  <Tooltip title="Ver detalle">
                    <IconButton size="small" onClick={() => onView(item)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canEdit && (
                    <>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => onEdit(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => onDelete(item)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ProduccionAcademicaPage() {
  const { activeRole } = useAuth();
  const { can } = usePermissions();

  const role        = activeRole ?? 'estudiante';
  const canWrite    = ROLES_ESCRITURA.includes(role) && can('/produccion', 'crear');
  const canDelete   = ROLES_ESCRITURA.includes(role) && can('/produccion', 'eliminar');
  const isAdmin     = ROLES_ADMIN.includes(role);
  const isStudent   = role === 'estudiante' || role === 'lider_estudiantil';

  // ─── Estado de modales ────────────────────────────────────────────────────
  const [formOpen,    setFormOpen]    = useState(false);
  const [editItem,    setEditItem]    = useState<ProduccionAcademica | null>(null);
  const [detailItem,  setDetailItem]  = useState<ProduccionAcademica | null>(null);
  const [deleteItem,  setDeleteItem]  = useState<ProduccionAcademica | null>(null);

  // ─── Datos de apoyo (proyectos, semilleros, etc.) ─────────────────────────
  // En un proyecto real estos vendrían de sus propios hooks/services.
  // Aquí los dejamos como arrays vacíos; la integración es directa.
  const [proyectos,  setProyectos]  = useState<any[]>([]);
  const [semilleros, setSemilleros] = useState<any[]>([]);
  const [lineas,     setLineas]     = useState<any[]>([]);
  const [usuarios,   setUsuarios]   = useState<any[]>([]);

  // ─── Hook principal CRUD ──────────────────────────────────────────────────
  const { data, isLoading, error, filters, setFilters, refresh, create, update, remove } =
    useProduccionAcademica();

  const items = data?.results ?? [];
  const total = data?.count    ?? 0;

  // ─── Métricas para admin ──────────────────────────────────────────────────
  const publicados = items.filter(i => i.estado === 'publicado').length;
  const enProceso  = items.filter(i => ['enviado', 'en_revision', 'aceptado'].includes(i.estado)).length;
  const autoresSet = new Set(items.flatMap(i => i.autores));

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenCreate = () => { setEditItem(null); setFormOpen(true); };
  const handleOpenEdit   = (item: ProduccionAcademica) => { setEditItem(item); setFormOpen(true); };

  const handleSave = useCallback(async (payload: ProduccionAcademicaCreate) => {
    if (editItem) {
      await update(editItem.id, payload);
    } else {
      await create(payload);
    }
  }, [editItem, create, update]);

  const handleDelete = useCallback(async (id: number) => {
    await remove(id);
  }, [remove]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setFilters({ page: newPage + 1 });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        mb={3}
      >
        <Box>
          <Typography
            variant="h4"
            fontFamily='"DM Sans", sans-serif'
            fontWeight={700}
            lineHeight={1.2}
          >
            Producción académica
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {isStudent
              ? 'Consulta los productos de investigación del semillero.'
              : 'Gestiona y registra la producción investigativa del semillero.'}
          </Typography>
        </Box>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Registrar producción
          </Button>
        )}
      </Stack>

      {/* ── Métricas (solo admin / director_grupo) ────────────────────────── */}
      {isAdmin && !isLoading && items.length > 0 && (
        <Grid container spacing={1.5} mb={3}>
          <Grid item xs={6} sm={3}>
            <MetricCard
              label="Total registros"
              value={total}
              icon={<ArticleIcon />}
              color="#C8102E"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard
              label="Publicados"
              value={publicados}
              icon={<CheckCircleOutlineIcon />}
              color="#2D6E3C"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard
              label="En proceso"
              value={enProceso}
              icon={<HourglassEmptyIcon />}
              color="#E87722"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricCard
              label="Autores involucrados"
              value={autoresSet.size}
              icon={<GroupsIcon />}
              color="#3B5BDB"
            />
          </Grid>
        </Grid>
      )}

      {/* ── Filtros (no para estudiante puro) ────────────────────────────── */}
      {!isStudent && (
        <Box mb={2}>
          <FiltrosProduccion filters={filters} onChange={setFilters} />
        </Box>
      )}

      {/* ── Error global ──────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={refresh}>
          {error}
        </Alert>
      )}

      {/* ── Contenido principal ───────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {/* Subheader con conteo */}
        {!isStudent && (
          <>
            <Box px={2} py={1.25}>
              <Typography variant="caption" color="text.secondary">
                {isLoading ? 'Cargando...' : `${total} registro${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Tabla o lista según rol */}
        {isLoading ? (
          <Table size="small">
            <TableBody><SkeletonRows cols={isStudent ? 3 : 6} /></TableBody>
          </Table>
        ) : isStudent ? (
          <Box p={2}>
            <VistaEstudiante items={items} onView={setDetailItem} />
          </Box>
        ) : (
          <TablaProduccion
            items={items}
            canEdit={canWrite}
            onView={setDetailItem}
            onEdit={handleOpenEdit}
            onDelete={setDeleteItem}
          />
        )}

        {/* Paginación */}
        {!isLoading && total > 0 && (
          <>
            <Divider />
            <TablePagination
              component="div"
              count={total}
              page={(filters.page ?? 1) - 1}
              rowsPerPage={10}
              rowsPerPageOptions={[10]}
              onPageChange={handlePageChange}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </>
        )}
      </Paper>

      {/* ── Modales y drawer ──────────────────────────────────────────────── */}
      <FormProduccion
        open={formOpen}
        item={editItem}
        proyectos={proyectos}
        semilleros={semilleros}
        lineas={lineas}
        usuarios={usuarios}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <DetalleProduccion
        item={detailItem}
        canEdit={canWrite}
        onClose={() => setDetailItem(null)}
        onEdit={handleOpenEdit}
      />

      <ConfirmarEliminar
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
