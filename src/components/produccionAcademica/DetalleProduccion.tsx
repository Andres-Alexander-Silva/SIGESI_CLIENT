// src/components/produccionAcademica/DetalleProduccion.tsx

import { useRef, useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider,
  Stack, Chip, Link, Button, CircularProgress, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { ProduccionAcademica, TIPO_LABELS } from '@/types/produccionAcademica';
import EstadoChip from './EstadoChip';
import { produccionAcademicaService } from '@/services/produccionAcademica.service';
import { downloadFile } from '@/utils/downloadFile';

interface Props {
  item: ProduccionAcademica | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (item: ProduccionAcademica) => void;
  onRefresh?: () => void;
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

export default function DetalleProduccion({ item, canEdit, onClose, onEdit, onRefresh }: Props) {
  const [downloading, setDownloading] = useState<'archivo' | 'certificado' | null>(null);
  const [uploading, setUploading]     = useState<'archivo' | 'certificado' | null>(null);
  const [fileError, setFileError]     = useState('');
  const [fileSuccess, setFileSuccess] = useState('');
  const archivoRef    = useRef<HTMLInputElement>(null);
  const certificadoRef = useRef<HTMLInputElement>(null);

  if (!item) return null;

  const fechaFormat = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const handleDownload = async (field: 'archivo' | 'certificado') => {
    setFileError('');
    setDownloading(field);
    try {
      const label = field === 'archivo' ? 'archivo' : 'certificado';
      await downloadFile(
        produccionAcademicaService.archiveDownloadUrl(item.id, field),
        `produccion_${item.id}_${label}.pdf`,
      );
    } catch {
      setFileError('No se pudo descargar el archivo.');
    } finally {
      setDownloading(null);
    }
  };

  const handleUpload = async (field: 'archivo' | 'certificado', file: File) => {
    setFileError('');
    setFileSuccess('');
    if (file.size > 5 * 1024 * 1024) {
      setFileError('El archivo supera los 5 MB permitidos.');
      return;
    }
    setUploading(field);
    try {
      await produccionAcademicaService.archiveUpload(item.id, field, file, {
        titulo: item.titulo,
        tipo: item.tipo,
        semillero: item.semillero,
        autores: item.autores,
        proyecto: item.proyecto ?? undefined,
        linea_investigacion: item.linea_investigacion ?? undefined,
        doi: item.doi,
        url_repositorio: item.url_repositorio,
        revista_evento: item.revista_evento,
        fecha_publicacion: item.fecha_publicacion ?? undefined,
        estado: item.estado,
        descripcion: item.descripcion,
      });
      setFileSuccess(
        field === 'archivo' ? 'Archivo subido correctamente.' : 'Certificado subido correctamente.',
      );
      onRefresh?.();
    } catch {
      setFileError('No se pudo subir el archivo. Verifica el formato (pdf, jpg, png, docx, xlsx).');
    } finally {
      setUploading(null);
    }
  };

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

          {/* ── Archivos: descargar y subir ── */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Archivos adjuntos
            </Typography>

            {/* Feedback */}
            {fileError   && <Alert severity="error"   sx={{ mb: 1 }} onClose={() => setFileError('')}>{fileError}</Alert>}
            {fileSuccess  && <Alert severity="success" sx={{ mb: 1 }} onClose={() => setFileSuccess('')}>{fileSuccess}</Alert>}

            {/* Archivo principal */}
            <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
              {item.archivo && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    downloading === 'archivo'
                      ? <CircularProgress size={14} />
                      : <DownloadIcon fontSize="small" />
                  }
                  disabled={downloading !== null || uploading !== null}
                  onClick={() => handleDownload('archivo')}
                >
                  Descargar archivo
                </Button>
              )}
              {canEdit && (
                <>
                  <input
                    ref={archivoRef}
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload('archivo', file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={
                      uploading === 'archivo'
                        ? <CircularProgress size={14} />
                        : <UploadFileIcon fontSize="small" />
                    }
                    disabled={downloading !== null || uploading !== null}
                    onClick={() => archivoRef.current?.click()}
                  >
                    {item.archivo ? 'Reemplazar archivo' : 'Subir archivo'}
                  </Button>
                </>
              )}
            </Stack>

            {/* Certificado */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {item.certificado && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    downloading === 'certificado'
                      ? <CircularProgress size={14} />
                      : <DownloadIcon fontSize="small" />
                  }
                  disabled={downloading !== null || uploading !== null}
                  onClick={() => handleDownload('certificado')}
                >
                  Descargar certificado
                </Button>
              )}
              {canEdit && (
                <>
                  <input
                    ref={certificadoRef}
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload('certificado', file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={
                      uploading === 'certificado'
                        ? <CircularProgress size={14} />
                        : <UploadFileIcon fontSize="small" />
                    }
                    disabled={downloading !== null || uploading !== null}
                    onClick={() => certificadoRef.current?.click()}
                  >
                    {item.certificado ? 'Reemplazar certificado' : 'Subir certificado'}
                  </Button>
                </>
              )}
            </Stack>
          </Box>
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



