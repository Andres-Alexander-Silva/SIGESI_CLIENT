// src/pages/core/ParticipacionesEventoPage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EmojiEventsOutlined,
  FileUploadOutlined,
  InfoOutlined,
  RefreshOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import {
  participacionesEventoService,
  eventosService,
} from "@/services/convocatorias.service";
import { usersService } from "@/services/config.service";
import { usePermissions } from "@/context/PermissionsContext";
import {
  ParticipacionEvento,
  ParticipacionEventoCreate,
  TipoParticipacion,
  Evento,
} from "@/types/convocatorias";
import { UserAdmin } from "@/types";
import { validateFile, MAX_UPLOAD_SIZE_MB } from "@/utils/fileValidation";

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS_PART: {
  value: TipoParticipacion;
  label: string;
  color: "default" | "primary" | "secondary" | "success" | "info";
}[] = [
  { value: "ponente", label: "Ponente", color: "primary" },
  { value: "asistente", label: "Asistente", color: "default" },
  { value: "organizador", label: "Organizador", color: "secondary" },
  { value: "poster", label: "Póster", color: "info" },
];

interface PartForm {
  evento: string;
  participante: string;
  tipo_participacion: TipoParticipacion;
  postulacion: string;
  produccion: string;
}

const EMPTY_FORM: PartForm = {
  evento: "",
  participante: "",
  tipo_participacion: "asistente",
  postulacion: "",
  produccion: "",
};

const fmtDate = (d: string | null | undefined) =>
  d ? dayjs(d).format("DD MMM YYYY") : "—";

const getTipo = (v: string) =>
  TIPOS_PART.find((t) => t.value === v) ?? { label: v, color: "default" as const };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ParticipacionesEventoPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();

  const canWrite = can("/participaciones_evento", "crear");
  const canDelete = can("/participaciones_evento", "eliminar");

  // ─── Datos ───────────────────────────────────────────────────────────────
  const [participaciones, setParticipaciones] = useState<ParticipacionEvento[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [usuarios, setUsuarios] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Filtros ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterEvento, setFilterEvento] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 15;

  // ─── Dialogs ─────────────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ParticipacionEvento | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ParticipacionEvento | null>(null);
  const [form, setForm] = useState<PartForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Upload certificado ───────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<ParticipacionEvento | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      if (filterEvento) params.evento = Number(filterEvento);
      if (filterTipo) params.tipo_participacion = filterTipo;
      if (search) params.search = search;

      const [parts, evs, users] = await Promise.allSettled([
        participacionesEventoService.list(params),
        eventosService.list(),
        usersService.list(),
      ]);

      setParticipaciones(parts.status === "fulfilled" ? parts.value : []);
      setEventos(evs.status === "fulfilled" ? evs.value : []);
      setUsuarios(users.status === "fulfilled" ? users.value : []);
    } catch {
      setError("No se pudieron cargar las participaciones.");
    } finally {
      setLoading(false);
    }
  }, [filterEvento, filterTipo, search]);

  useEffect(() => {
    load();
  }, [load]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.evento) errs.evento = "El evento es requerido.";
    if (!form.participante) errs.participante = "El participante es requerido.";
    if (!form.tipo_participacion)
      errs.tipo_participacion = "El tipo es requerido.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (p: ParticipacionEvento) => {
    setEditing(p);
    setForm({
      evento: String(p.evento.id),
      participante: String(p.participante.id),
      tipo_participacion: p.tipo_participacion,
      postulacion: p.postulacion ? String(p.postulacion) : "",
      produccion: p.produccion ? String(p.produccion) : "",
    });
    setFormErrors({});
    setSaveError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload: ParticipacionEventoCreate = {
        evento: Number(form.evento),
        participante: Number(form.participante),
        tipo_participacion: form.tipo_participacion,
        postulacion: form.postulacion ? Number(form.postulacion) : null,
        produccion: form.produccion ? Number(form.produccion) : null,
      };
      if (editing) {
        await participacionesEventoService.update(editing.id, payload);
      } else {
        await participacionesEventoService.create(payload);
      }
      setFormOpen(false);
      await load();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: Record<string, string | string[]> };
      };
      if (err?.response?.data) {
        const data = err.response.data;
        const fieldErrs: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setFormErrors(fieldErrs);
        setSaveError("Revisa los campos marcados.");
      } else {
        setSaveError("Error al guardar la participación.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await participacionesEventoService.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError("No se pudo eliminar la participación.");
      setDeleting(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadCertificado = async (file: File) => {
    if (!uploadTarget) return;
    const fileError = validateFile(file);
    if (fileError) {
      setUploadError(fileError);
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await participacionesEventoService.cargarCertificado(
        uploadTarget.id,
        file,
        uploadTarget.tipo_participacion,
      );
      setUploadOpen(false);
      await load();
    } catch {
      setUploadError(`No se pudo subir el certificado. Verifica el formato y tamaño (máx. ${MAX_UPLOAD_SIZE_MB} MB).`);
    } finally {
      setUploading(false);
    }
  };

  const filtered = participaciones.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.evento.nombre.toLowerCase().includes(q) ||
      `${p.participante.first_name} ${p.participante.last_name}`
        .toLowerCase()
        .includes(q) ||
      p.participante.email.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Encabezado ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <EmojiEventsOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Participaciones en Eventos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registro de participación en eventos académicos
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refrescar">
            <IconButton onClick={load} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {canWrite && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpenCreate}
            >
              Registrar Participación
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Filtros ── */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          bgcolor: isDark ? "grey.900" : "grey.50",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar participante o evento..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Evento</InputLabel>
          <Select
            label="Evento"
            value={filterEvento}
            onChange={(e) => {
              setFilterEvento(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {eventos.map((ev) => (
              <MenuItem key={ev.id} value={String(ev.id)}>
                {ev.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            label="Tipo"
            value={filterTipo}
            onChange={(e) => {
              setFilterTipo(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {TIPOS_PART.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Tabla ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "grey.900" : "grey.50" }}>
                <TableCell sx={{ fontWeight: 700 }}>Evento</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Participante</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Certificado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <EmojiEventsOutlined
                      sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      No hay participaciones registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((p) => {
                  const tipo = getTipo(p.tipo_participacion);
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {p.evento.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(p.evento.fecha_inicio)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {p.participante.first_name} {p.participante.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.participante.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tipo.label}
                          color={tipo.color}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {p.certificado ? (
                          <Chip
                            label="Disponible"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="Sin certificado"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(p.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          justifyContent="flex-end"
                          spacing={0.25}
                        >
                          <Tooltip title="Ver detalle">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelected(p);
                                setDetailOpen(true);
                              }}
                            >
                              <InfoOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {p.certificado && (
                            <Tooltip title="Descargar certificado">
                              <IconButton
                                size="small"
                                color="primary"
                                component="a"
                                href={participacionesEventoService.descargarCertificadoUrl(p.id)}
                                target="_blank"
                                rel="noopener"
                              >
                                <DownloadOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canWrite && (
                            <>
                              <Tooltip title="Subir certificado">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => {
                                    setUploadTarget(p);
                                    setUploadError(null);
                                    setUploadOpen(true);
                                  }}
                                >
                                  <FileUploadOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenEdit(p)}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {canDelete && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <DeleteOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
          />
        </TableContainer>
      )}

      {/* ════ Dialog: Detalle ════ */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmojiEventsOutlined color="primary" />
                <span>Detalle de Participación</span>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <Chip
                  label={getTipo(selected.tipo_participacion).label}
                  color={getTipo(selected.tipo_participacion).color}
                  sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                />

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Evento
                  </Typography>
                  <Typography variant="body2" fontWeight={600} mt={0.5}>
                    {selected.evento.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fmtDate(selected.evento.fecha_inicio)}
                    {selected.evento.fecha_fin &&
                      ` → ${fmtDate(selected.evento.fecha_fin)}`}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Participante
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    {selected.participante.first_name}{" "}
                    {selected.participante.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selected.participante.email}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Certificado
                  </Typography>
                  <Box mt={0.75}>
                    {selected.certificado ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadOutlined />}
                        component="a"
                        href={participacionesEventoService.descargarCertificadoUrl(selected.id)}
                        target="_blank"
                        rel="noopener"
                      >
                        Descargar certificado
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin certificado cargado
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Registrado
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    {fmtDate(selected.created_at)}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setDetailOpen(false)} color="inherit">
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ════ Dialog: Crear / Editar ════ */}
      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editing ? "Editar Participación" : "Registrar Participación"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            {saveError && <Alert severity="error">{saveError}</Alert>}

            <FormControl fullWidth disabled={saving} error={!!formErrors.evento}>
              <InputLabel>Evento *</InputLabel>
              <Select
                label="Evento *"
                value={form.evento}
                onChange={(e) => setForm({ ...form, evento: e.target.value })}
              >
                {eventos.map((ev) => (
                  <MenuItem key={ev.id} value={String(ev.id)}>
                    {ev.nombre}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.evento && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {formErrors.evento}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth disabled={saving} error={!!formErrors.participante}>
              <InputLabel>Participante *</InputLabel>
              <Select
                label="Participante *"
                value={form.participante}
                onChange={(e) =>
                  setForm({ ...form, participante: e.target.value })
                }
              >
                {usuarios.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.first_name} {u.last_name}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.75 }}
                    >
                      ({u.email})
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
              {formErrors.participante && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {formErrors.participante}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth disabled={saving}>
              <InputLabel>Tipo de participación *</InputLabel>
              <Select
                label="Tipo de participación *"
                value={form.tipo_participacion}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo_participacion: e.target.value as TipoParticipacion,
                  })
                }
              >
                {TIPOS_PART.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="ID Postulación relacionada"
              type="number"
              value={form.postulacion}
              onChange={(e) => setForm({ ...form, postulacion: e.target.value })}
              disabled={saving}
              fullWidth
              placeholder="Opcional"
              inputProps={{ min: 1 }}
            />

            <TextField
              label="ID Producción académica relacionada"
              type="number"
              value={form.produccion}
              onChange={(e) => setForm({ ...form, produccion: e.target.value })}
              disabled={saving}
              fullWidth
              placeholder="Opcional"
              inputProps={{ min: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setFormOpen(false)}
            disabled={saving}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? "Guardando…" : editing ? "Actualizar" : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ Dialog: Subir certificado ════ */}
      <Dialog
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Subir Certificado</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {uploadTarget && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: isDark ? "grey.900" : "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {uploadTarget.participante.first_name}{" "}
                  {uploadTarget.participante.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {uploadTarget.evento.nombre}
                </Typography>
              </Box>
            )}
            {uploadError && <Alert severity="error">{uploadError}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Formatos permitidos: PDF, JPG, PNG, DOCX, XLSX. Tamaño máximo: {MAX_UPLOAD_SIZE_MB} MB.
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadCertificado(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="outlined"
              startIcon={
                uploading ? (
                  <CircularProgress size={16} />
                ) : (
                  <FileUploadOutlined />
                )
              }
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              fullWidth
            >
              {uploading ? "Subiendo…" : "Seleccionar archivo"}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadOpen(false)}
            disabled={uploading}
            color="inherit"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ Dialog: Eliminar ════ */}
      <Dialog
        open={!!deleteId}
        onClose={() => !deleting && setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar participación?</DialogTitle>
        <DialogContent>
          <Typography>
            Esta acción no se puede deshacer. ¿Deseas continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteId(null)}
            disabled={deleting}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
