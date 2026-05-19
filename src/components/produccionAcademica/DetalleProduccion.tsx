// src/components/produccionAcademica/DetalleProduccion.tsx

import {
  Drawer, Box, Typography, IconButton, Divider,
  Stack, Chip, Link, Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ProduccionAcademica, TIPO_LABELS } from '@/types/produccionAcademica';
import EstadoChip from './EstadoChip';

interface Props {
  item: ProduccionAcademica | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (item: ProduccionAcademica) => void;
}

function Campo({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" mt={0.25}>{value}</Typography>
    </Box>
  );
}

export default function DetalleProduccion({ item, canEdit, onClose, onEdit }: Props) {
  if (!item) return null;

  const fechaFormat = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  return (
    <Drawer anchor="right" open={!!item} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 460 } } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" p={2} pb={1.5}>
        <Typography variant="h6" fontFamily='"DM Sans", sans-serif' fontWeight={600} fontSize={17}>
          Detalle
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      <Box p={2.5} sx={{ overflowY: 'auto', flexGrow: 1 }}>
        <Stack spacing={0.75} mb={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={TIPO_LABELS[item.tipo] ?? item.tipo} size="small" variant="outlined" />
            <EstadoChip estado={item.estado} />
          </Stack>
          <Typography variant="subtitle1" fontWeight={600} fontFamily='"DM Sans", sans-serif' lineHeight={1.4} mt={0.5}>
            {item.titulo}
          </Typography>
          {item.descripcion && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {item.descripcion}
            </Typography>
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <Campo label="Proyecto" value={item.proyecto_titulo} />
          <Campo label="Semillero" value={item.semillero_nombre} />
          <Campo label="Línea de investigación" value={item.linea_investigacion_nombre} />
          <Campo label="Revista / Evento" value={item.revista_evento} />
          <Campo label="Fecha de publicación" value={fechaFormat(item.fecha_publicacion)} />
          <Campo label="DOI" value={item.doi} />

          {item.url_repositorio && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Repositorio
              </Typography>
              <Link
                href={item.url_repositorio}
                target="_blank"
                rel="noreferrer"
                variant="body2"
                display="flex"
                alignItems="center"
                gap={0.5}
                mt={0.25}
              >
                Ver enlace <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Link>
            </Box>
          )}

          {item.autores_nombres && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Autores
              </Typography>
              <Typography variant="body2" mt={0.25}>{item.autores_nombres}</Typography>
            </Box>
          )}

          <Stack direction="row" spacing={1}>
            {item.archivo && (
              <Button size="small" variant="outlined" href={item.archivo} target="_blank">
                Ver archivo
              </Button>
            )}
            {item.certificado && (
              <Button size="small" variant="outlined" href={item.certificado} target="_blank">
                Ver certificado
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            Registrado: {fechaFormat(item.created_at)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Actualizado: {fechaFormat(item.updated_at)}
          </Typography>
        </Stack>
      </Box>

      {canEdit && (
        <>
          <Divider />
          <Box p={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => { onClose(); onEdit(item); }}
            >
              Editar producción
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
}
