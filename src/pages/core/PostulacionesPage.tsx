// src/pages/core/PostulacionesPage.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  GroupsOutlined,
  HowToVoteOutlined,
  InfoOutlined,
  RefreshOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import {
  postulacionesService,
  convocatoriasService,
} from "@/services/convocatorias.service";
import { semillerosService, inscripcionesService } from "@/services/core.service";
import { usePermissions } from "@/context/PermissionsContext";
import { useAuth } from "@/context/AuthContext";
import {
  Postulacion,
  PostulacionCreate,
  EstadoPostulacion,
  Convocatoria,
} from "@/types/convocatorias";
import { Semillero } from "@/types/core";

// Miembro matriculado de un semillero (origen válido de estudiantes a postular).
interface MiembroSemillero {
  id: number;
  nombre: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADOS_POST: {
  value: EstadoPostulacion;
  label: string;
  color: "default" | "warning" | "success" | "error" | "info";
}[] = [
  { value: "pendiente", label: "Pendiente", color: "warning" },
  { value: "en_evaluacion", label: "En Evaluación", color: "info" },
  { value: "aceptada", label: "Aceptada", color: "success" },
  { value: "rechazada", label: "Rechazada", color: "error" },
];

interface PostulacionForm {
  convocatoria: string;
  semillero: string;
  estudiantes: number[];
  observaciones: string;
}

const EMPTY_FORM: PostulacionForm = {
  convocatoria: "",
  semillero: "",
  estudiantes: [],
  observaciones: "",
};

const fmtDate = (d: string | null | undefined) =>
  d ? dayjs(d).format("DD MMM YYYY") : "—";

const getEstado = (v: string) =>
  ESTADOS_POST.find((e) => e.value === v) ?? {
    label: v,
    color: "default" as const,
  };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PostulacionesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { can } = usePermissions();
  const { activeRole } = useAuth();

  const canCreate =
    can("/postulaciones", "crear") || activeRole === "director_semillero";
  const canApprove =
    can("/postulaciones", "aprobar") ||
    activeRole === "administrador" ||
    activeRole === "director_grupo";
  const canDelete =
    can("/postulaciones", "eliminar") || activeRole === "administrador";

  // ─── Datos ───────────────────────────────────────────────────────────────
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  // Estudiantes matriculados en el semillero elegido (no usuarios globales).
  const [miembros, setMiembros] = useState<MiembroSemillero[]>([]);
  const [loadingMiembros, setLoadingMiembros] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Filtros ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterConvocatoria, setFilterConvocatoria] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 15;

  // ─── Dialog detalle ──────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Postulacion | null>(null);

  // ─── Dialog crear ─────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PostulacionForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ─── Dialog aprobar/rechazar ─────────────────────────────────────────────
  const [resolucionOpen, setResolucionOpen] = useState(false);
  const [resolucionPost, setResolucionPost] = useState<Postulacion | null>(null);
  const [resolucionAccion, setResolucionAccion] = useState<"aprobar" | "rechazar">("aprobar");
  const [resultado, setResultado] = useState("");
  const [resolviendo, setResolviendo] = useState(false);

  // ─── Dialog eliminar ─────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {};
      if (filterEstado) params.estado = filterEstado;
      if (filterConvocatoria) params.convocatoria = Number(filterConvocatoria);
      if (search) params.search = search;

      const [posts, convs, sems] = await Promise.allSettled([
        postulacionesService.list(params),
        convocatoriasService.list(),
        semillerosService.list(),
      ]);

      setPostulaciones(posts.status === "fulfilled" ? posts.value : []);
      setConvocatorias(convs.status === "fulfilled" ? convs.value : []);
      setSemilleros(sems.status === "fulfilled" ? sems.value : []);
    } catch {
      setError("No se pudieron cargar las postulaciones.");
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterConvocatoria, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Carga los estudiantes matriculados (activos) del semillero elegido, que son
  // los únicos válidos para postular según el backend.
  useEffect(() => {
    if (!formOpen || !form.semillero) {
      setMiembros([]);
      return;
    }
    let cancelado = false;
    setLoadingMiembros(true);
    inscripcionesService
      .list({ semillero_id: Number(form.semillero) })
      .then((data: unknown) => {
        if (cancelado) return;
        const rows = (Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []) as Array<{
          estudiante?: number;
          estudiante_nombre?: string;
          estado?: string;
        }>;
        const vistos = new Set<number>();
        const opts: MiembroSemillero[] = [];
        for (const r of rows) {
          if (r.estado !== "activa" || !r.estudiante || vistos.has(r.estudiante))
            continue;
          vistos.add(r.estudiante);
          opts.push({
            id: r.estudiante,
            nombre: r.estudiante_nombre ?? `Estudiante #${r.estudiante}`,
          });
        }
        setMiembros(opts);
      })
      .catch(() => {
        if (!cancelado) setMiembros([]);
      })
      .finally(() => {
        if (!cancelado) setLoadingMiembros(false);
      });
    return () => {
      cancelado = true;
    };
  }, [formOpen, form.semillero]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.convocatoria) errs.convocatoria = "La convocatoria es requerida.";
    if (!form.semillero) errs.semillero = "El semillero es requerido.";
    if (form.estudiantes.length === 0)
      errs.estudiantes = "Seleccione al menos un estudiante matriculado.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload: PostulacionCreate = {
        convocatoria: Number(form.convocatoria),
        semillero: Number(form.semillero),
        estudiantes: form.estudiantes,
        observaciones: form.observaciones || undefined,
      };
      await postulacionesService.create(payload);
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
        setSaveError("Error al crear la postulación.");
      }
    } finally {
      setSaving(false);
    }
  };

  const openResolucion = (post: Postulacion, accion: "aprobar" | "rechazar") => {
    setResolucionPost(post);
    setResolucionAccion(accion);
    setResultado("");
    setResolucionOpen(true);
  };

  const handleResolver = async () => {
    if (!resolucionPost) return;
    setResolviendo(true);
    try {
      if (resolucionAccion === "aprobar") {
        await postulacionesService.aprobar(resolucionPost.id, resultado || undefined);
      } else {
        await postulacionesService.rechazar(resolucionPost.id, resultado || undefined);
      }
      setResolucionOpen(false);
      await load();
    } catch {
      setError("No se pudo procesar la resolución.");
      setResolucionOpen(false);
    } finally {
      setResolviendo(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await postulacionesService.remove(deleteId);
      setDeleteId(null);
      await load();
    } catch {
      setError("No se pudo eliminar la postulación.");
      setDeleting(false);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = postulaciones.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.convocatoria.titulo.toLowerCase().includes(q) ||
      p.semillero.nombre.toLowerCase().includes(q)
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
          <HowToVoteOutlined sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Postulaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de postulaciones a convocatorias académicas
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refrescar">
            <IconButton onClick={load} disabled={loading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={handleOpenCreate}
            >
              Nueva Postulación
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
          placeholder="Buscar postulación..."
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
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Convocatoria</InputLabel>
          <Select
            label="Convocatoria"
            value={filterConvocatoria}
            onChange={(e) => {
              setFilterConvocatoria(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todas</MenuItem>
            {convocatorias.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.titulo}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            label="Estado"
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS_POST.map((e) => (
              <MenuItem key={e.value} value={e.value}>
                {e.label}
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
                <TableCell sx={{ fontWeight: 700 }}>Convocatoria</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semillero</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estudiantes</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
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
                    <HowToVoteOutlined
                      sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      No hay postulaciones registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((post) => {
                  const est = getEstado(post.estado);
                  const pendiente =
                    post.estado === "pendiente" || post.estado === "en_evaluacion";
                  return (
                    <TableRow key={post.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {post.convocatoria.titulo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <GroupsOutlined
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography variant="body2">
                            {post.semillero.nombre}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {post.estudiantes.length > 0 ? (
                          <AvatarGroup
                            max={3}
                            sx={{ justifyContent: "flex-start" }}
                          >
                            {post.estudiantes.map((e) => (
                              <Tooltip
                                key={e.id}
                                title={`${e.first_name} ${e.last_name}`}
                              >
                                <Avatar
                                  sx={{ width: 28, height: 28, fontSize: 12 }}
                                >
                                  {e.first_name[0]}
                                  {e.last_name[0]}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            Sin estudiantes
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={est.label}
                          color={est.color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(post.fecha_postulacion)}
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
                                setSelected(post);
                                setDetailOpen(true);
                              }}
                            >
                              <InfoOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canApprove && pendiente && (
                            <>
                              <Tooltip title="Aprobar">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() =>
                                    openResolucion(post, "aprobar")
                                  }
                                >
                                  <CheckOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rechazar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    openResolucion(post, "rechazar")
                                  }
                                >
                                  <CloseOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {canDelete && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteId(post.id)}
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
                <HowToVoteOutlined color="primary" />
                <span>Detalle de Postulación</span>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <Chip
                  label={getEstado(selected.estado).label}
                  color={getEstado(selected.estado).color}
                  sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                />

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Convocatoria
                  </Typography>
                  <Typography variant="body2" fontWeight={600} mt={0.5}>
                    {selected.convocatoria.titulo}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Semillero
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    {selected.semillero.nombre}
                  </Typography>
                </Box>

                {selected.estudiantes.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Estudiantes postulados ({selected.estudiantes.length})
                    </Typography>
                    <Stack spacing={0.5} mt={0.75}>
                      {selected.estudiantes.map((e) => (
                        <Stack
                          key={e.id}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                            {e.first_name[0]}{e.last_name[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {e.first_name} {e.last_name}
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 0.5 }}
                            >
                              ({e.email})
                            </Typography>
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}

                {selected.observaciones && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Observaciones
                    </Typography>
                    <Typography variant="body2" mt={0.5} sx={{ whiteSpace: "pre-line" }}>
                      {selected.observaciones}
                    </Typography>
                  </Box>
                )}

                {selected.resultado && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                      >
                        Resultado / Resolución
                      </Typography>
                      <Typography variant="body2" mt={0.5} sx={{ whiteSpace: "pre-line" }}>
                        {selected.resultado}
                      </Typography>
                      {selected.aprobado_por_nombre && (
                        <Typography variant="caption" color="text.secondary">
                          Por: {selected.aprobado_por_nombre} ·{" "}
                          {fmtDate(selected.fecha_resolucion)}
                        </Typography>
                      )}
                    </Box>
                  </>
                )}

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    Fecha de postulación
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    {fmtDate(selected.fecha_postulacion)}
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

      {/* ════ Dialog: Nueva Postulación ════ */}
      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Nueva Postulación
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            {saveError && <Alert severity="error">{saveError}</Alert>}

            <FormControl fullWidth disabled={saving} error={!!formErrors.convocatoria}>
              <InputLabel>Convocatoria *</InputLabel>
              <Select
                label="Convocatoria *"
                value={form.convocatoria}
                onChange={(e) =>
                  setForm({ ...form, convocatoria: e.target.value })
                }
              >
                {convocatorias
                  .filter((c) => c.estado === "abierta")
                  .map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.titulo}
                    </MenuItem>
                  ))}
              </Select>
              {formErrors.convocatoria && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.75 }}
                >
                  {formErrors.convocatoria}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth disabled={saving} error={!!formErrors.semillero}>
              <InputLabel>Semillero *</InputLabel>
              <Select
                label="Semillero *"
                value={form.semillero}
                onChange={(e) =>
                  // Al cambiar de semillero, los estudiantes previos dejan de ser válidos.
                  setForm({ ...form, semillero: e.target.value, estudiantes: [] })
                }
              >
                {semilleros.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.nombre}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.semillero && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.75 }}
                >
                  {formErrors.semillero}
                </Typography>
              )}
            </FormControl>

            <FormControl
              fullWidth
              disabled={saving || !form.semillero || loadingMiembros}
              error={!!formErrors.estudiantes}
            >
              <InputLabel>Estudiantes postulados *</InputLabel>
              <Select
                label="Estudiantes postulados *"
                multiple
                value={form.estudiantes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estudiantes: e.target.value as number[],
                  })
                }
                renderValue={(selected) =>
                  (selected as number[])
                    .map((id) => miembros.find((m) => m.id === id)?.nombre ?? id)
                    .join(", ")
                }
              >
                {miembros.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.nombre}
                  </MenuItem>
                ))}
              </Select>
              <Typography
                variant="caption"
                color={formErrors.estudiantes ? "error" : "text.secondary"}
                sx={{ mt: 0.5, ml: 1.75 }}
              >
                {formErrors.estudiantes
                  ? formErrors.estudiantes
                  : !form.semillero
                    ? "Seleccione un semillero primero."
                    : loadingMiembros
                      ? "Cargando estudiantes matriculados…"
                      : miembros.length === 0
                        ? "Este semillero no tiene estudiantes matriculados activos."
                        : "Solo se listan estudiantes matriculados en el semillero."}
              </Typography>
            </FormControl>

            <TextField
              label="Observaciones"
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
              multiline
              rows={3}
              disabled={saving}
              fullWidth
              placeholder="Información adicional sobre la postulación..."
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
            {saving ? "Guardando…" : "Crear Postulación"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ Dialog: Aprobar / Rechazar ════ */}
      <Dialog
        open={resolucionOpen}
        onClose={() => !resolviendo && setResolucionOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {resolucionAccion === "aprobar"
            ? "Aprobar Postulación"
            : "Rechazar Postulación"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {resolucionPost && (
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
                  {resolucionPost.convocatoria.titulo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {resolucionPost.semillero.nombre}
                </Typography>
              </Box>
            )}
            <TextField
              label="Resultado / Observación"
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="Observaciones de la resolución (opcional)..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setResolucionOpen(false)}
            disabled={resolviendo}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={resolucionAccion === "aprobar" ? "success" : "error"}
            onClick={handleResolver}
            disabled={resolviendo}
            startIcon={
              resolviendo ? (
                <CircularProgress size={16} />
              ) : resolucionAccion === "aprobar" ? (
                <CheckOutlined />
              ) : (
                <CloseOutlined />
              )
            }
          >
            {resolviendo
              ? "Procesando…"
              : resolucionAccion === "aprobar"
                ? "Aprobar"
                : "Rechazar"}
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
        <DialogTitle>¿Eliminar postulación?</DialogTitle>
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
