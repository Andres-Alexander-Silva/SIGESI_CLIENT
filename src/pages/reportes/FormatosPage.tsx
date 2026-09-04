// src/pages/reportes/FormatosPage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Switch,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  RefreshOutlined,
  AttachFileOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { formatosService } from "@/services/formatos.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import { downloadFile } from "@/utils/downloadFile";
import { validateFile, EXTENSIONES_GENERALES } from "@/utils/fileValidation";
import {
  FormatoInstitucional,
  CategoriaFormato,
  TipoVinculacionFormato,
} from "@/types/formatos";

const CATEGORIAS: { value: CategoriaFormato; label: string }[] = [
  { value: "planeacion", label: "Planeación" },
  { value: "gestion", label: "Gestión" },
  { value: "administrativos_y_academicos", label: "Administrativos y Académicos" },
  { value: "mensual", label: "Mensual" },
];

const TIPOS_VINCULACION: { value: TipoVinculacionFormato; label: string }[] = [
  { value: "catedratico", label: "Catedrático" },
  { value: "planta", label: "Planta" },
];

interface FormState {
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaFormato;
  tipo_vinculacion: TipoVinculacionFormato | "";
  version: string;
  archivo: File | null;
}

const EMPTY_FORM: FormState = {
  slug: "",
  nombre: "",
  descripcion: "",
  categoria: "gestion",
  tipo_vinculacion: "",
  version: "",
  archivo: null,
};

export default function FormatosPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { user } = useAuth();

  const canWrite = can("/formatos", "crear");
  const canDelete = can("/formatos", "eliminar");

  const [formatos, setFormatos] = useState<FormatoInstitucional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FormatoInstitucional | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFormatos(await formatosService.list());
    } catch {
      setError("No se pudieron cargar los formatos institucionales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async (formato: FormatoInstitucional) => {
    setDownloadingSlug(formato.slug);
    try {
      await downloadFile(
        formatosService.archiveDownloadUrl(formato.slug),
        formato.nombre,
      );
    } catch {
      setError("No se pudo descargar el formato.");
    } finally {
      setDownloadingSlug(null);
    }
  };

  const handleDownloadBulk = async () => {
    if (!user) return;
    setDownloadingSlug("__bulk__");
    try {
      await downloadFile(formatosService.bulkDownloadUrl(user.id), "mis_formatos.zip");
    } catch {
      setError("No se pudo descargar el paquete de formatos.");
    } finally {
      setDownloadingSlug(null);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.slug.trim()) errs.slug = "El slug es requerido.";
    if (!form.nombre.trim()) errs.nombre = "El nombre es requerido.";
    if (!editing && !form.archivo) errs.archivo = "El archivo es requerido.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpen = (formato?: FormatoInstitucional) => {
    if (formato) {
      setEditing(formato);
      setForm({
        slug: formato.slug,
        nombre: formato.nombre,
        descripcion: formato.descripcion,
        categoria: formato.categoria,
        tipo_vinculacion: formato.tipo_vinculacion ?? "",
        version: formato.version,
        archivo: null,
      });
    } else {
      setEditing(null);
      setForm(EMPTY_FORM);
    }
    setFormErrors({});
    setFileError(null);
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (fileError) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) {
        await formatosService.update(editing.slug, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          categoria: form.categoria,
          tipo_vinculacion: form.tipo_vinculacion || null,
          version: form.version,
        });
        if (form.archivo) {
          await formatosService.archiveUpload(editing.slug, form.archivo);
        }
      } else {
        await formatosService.create({
          slug: form.slug,
          nombre: form.nombre,
          descripcion: form.descripcion,
          categoria: form.categoria,
          archivo: form.archivo as File,
          tipo_vinculacion: form.tipo_vinculacion || null,
          version: form.version,
        });
      }
      setDialogOpen(false);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, string[]> } };
      if (err?.response?.data) {
        const data = err.response.data;
        const fieldErrs: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrs[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setFormErrors(fieldErrs);
        setSaveError("Revisa los campos marcados.");
      } else {
        setSaveError("Error al guardar el formato.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (formato: FormatoInstitucional) => {
    try {
      await formatosService.update(formato.slug, { estado: !formato.estado });
      await load();
    } catch {
      setError("No se pudo actualizar el estado del formato.");
    }
  };

  const handleDelete = async () => {
    if (!deleteSlug) return;
    setDeleting(true);
    try {
      await formatosService.remove(deleteSlug);
      setDeleteSlug(null);
      await load();
    } catch {
      setError("No se pudo eliminar el formato.");
    } finally {
      setDeleting(false);
    }
  };

  const getCategoriaLabel = (v: string) =>
    CATEGORIAS.find((c) => c.value === v)?.label ?? v;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
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
          <FolderOpenOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Formatos Institucionales
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Repositorio de formatos y plantillas para directores de semillero
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Descargar todos mis formatos">
            <span>
              <IconButton
                onClick={handleDownloadBulk}
                disabled={downloadingSlug === "__bulk__"}
              >
                {downloadingSlug === "__bulk__" ? (
                  <CircularProgress size={20} />
                ) : (
                  <DownloadOutlined />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Refrescar">
            <IconButton onClick={load} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {canWrite && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => handleOpen()}
            >
              Agregar Formato
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "grey.800" : "grey.100" }}>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vinculación</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Versión</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : formatos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No hay formatos institucionales registrados.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                formatos.map((f) => (
                  <TableRow key={f.slug} hover>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {f.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {f.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoriaLabel(f.categoria)}
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {f.tipo_vinculacion_display ?? "Todos"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{f.version || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      {canWrite ? (
                        <Switch
                          size="small"
                          checked={f.estado}
                          onChange={() => handleToggleEstado(f)}
                        />
                      ) : (
                        <Chip
                          label={f.estado ? "Activo" : "Inactivo"}
                          size="small"
                          color={f.estado ? "success" : "default"}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Descargar">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={downloadingSlug === f.slug}
                            onClick={() => handleDownload(f)}
                          >
                            {downloadingSlug === f.slug ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DownloadOutlined fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      {canWrite && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(f)}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteSlug(f.slug)}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Dialog Crear / Editar ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editing ? "Editar Formato" : "Agregar Formato"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}

            <TextField
              label="Slug *"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              error={!!formErrors.slug}
              helperText={formErrors.slug || "Identificador único, p. ej. plan-accion-semillero"}
              disabled={saving || !!editing}
              fullWidth
            />

            <TextField
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
              disabled={saving}
              fullWidth
            />

            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              disabled={saving}
              multiline
              rows={2}
              fullWidth
            />

            <FormControl fullWidth disabled={saving}>
              <InputLabel>Categoría *</InputLabel>
              <Select
                label="Categoría *"
                value={form.categoria}
                onChange={(e) =>
                  setForm({ ...form, categoria: e.target.value as CategoriaFormato })
                }
              >
                {CATEGORIAS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={saving}>
              <InputLabel>Tipo de vinculación</InputLabel>
              <Select
                label="Tipo de vinculación"
                value={form.tipo_vinculacion}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo_vinculacion: e.target.value as TipoVinculacionFormato | "",
                  })
                }
              >
                <MenuItem value="">Todos (sin restricción)</MenuItem>
                {TIPOS_VINCULACION.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Versión"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              disabled={saving}
              fullWidth
            />

            <Box>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Archivo {!editing && "*"}
              </Typography>
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: fileError || formErrors.archivo ? "error.main" : "divider",
                  borderRadius: 1,
                  p: 2,
                  textAlign: "center",
                  bgcolor: isDark ? "grey.900" : "grey.50",
                  cursor: "pointer",
                  "&:hover": { borderColor: "primary.main" },
                }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={EXTENSIONES_GENERALES.join(",")}
                  style={{ display: "none" }}
                  disabled={saving}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    const err = file ? validateFile(file) : null;
                    setFileError(err);
                    if (!err) setForm({ ...form, archivo: file });
                  }}
                />
                <AttachFileOutlined color="action" sx={{ mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {form.archivo
                    ? form.archivo.name
                    : editing
                      ? "Haz clic para reemplazar el archivo (opcional)"
                      : "Haz clic para adjuntar un archivo"}
                </Typography>
              </Box>
              {(fileError || formErrors.archivo) && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                  {fileError || formErrors.archivo}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !!fileError}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? "Guardando…" : editing ? "Actualizar" : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmar eliminación ── */}
      <Dialog open={!!deleteSlug} onClose={() => !deleting && setDeleteSlug(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Eliminar formato?</DialogTitle>
        <DialogContent>
          <Typography>Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSlug(null)} disabled={deleting} color="inherit">
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
