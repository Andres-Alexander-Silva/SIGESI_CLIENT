import { useState, useEffect, useCallback } from "react";
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
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  TablePagination,
  TextField,
  Card,
  CardContent,
  Grid,
  Divider,
  Tab,
  Tabs,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  SearchOutlined,
  RefreshOutlined,
  LogoutOutlined,
  PersonAddOutlined,
  ScienceOutlined,
  GroupOutlined,
  CheckCircleOutlined,
  SchoolOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import {
  semillerosService,
  inscripcionesService,
} from "@/services/core.service";
import { useAuth } from "@/context/AuthContext";
import { Semillero } from "@/types/core";

const CURRENT_SEMESTER = "2026-1";

interface Inscripcion {
  id: number;
  semillero: number;
  semillero_nombre?: string;
  semillero_codigo?: string;
  estudiante?: number;
  estudiante_nombre?: string;
  semestre: string;
  fecha_inscripcion?: string;
  estado?: "activa" | "inactiva" | "retirado";
  // legacy fallback
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function InscripcionesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user, activeRole } = useAuth();

  const currentRole = activeRole ?? user?.roles?.[0] ?? "";
  const isStudent = currentRole === "estudiante";
  const isDirector = currentRole === "director_semillero";
  const isAdmin =
    currentRole === "administrador" || currentRole === "director_grupo";

  // ── Estado general ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Datos ─────────────────────────────────────────────────────────────────
  const [semilleros, setSemilleros] = useState<Semillero[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [inscripcionMap, setInscripcionMap] = useState<
    Record<number, Inscripcion>
  >({});

  // ── UI ────────────────────────────────────────────────────────────────────
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState("");
  const [searchMis, setSearchMis] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageMis, setPageMis] = useState(0);

  // ── Diálogo confirmación retiro ───────────────────────────────────────────
  const [confirmRetiroId, setConfirmRetiroId] = useState<number | null>(null);
  const [retiroLoading, setRetiroLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Carga de datos
  // ─────────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [semData, inscData] = await Promise.all([
        semillerosService.list(),
        inscripcionesService.list(),
      ]);

      setSemilleros(semData.filter((s: Semillero) => s.is_active));

      const inscList: Inscripcion[] = Array.isArray(inscData)
        ? inscData
        : ((inscData as any).results ?? []);
      setInscripciones(inscList);

      // Mapa semilleroId → inscripción (para estudiante)
      const map: Record<number, Inscripcion> = {};
      inscList.forEach((insc) => {
        if (insc.semillero) map[insc.semillero] = insc;
      });
      setInscripcionMap(map);
    } catch (err: any) {
      setError("No se pudieron cargar los datos de inscripciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    setPageMis(0);
  }, [searchMis]);

  // ─────────────────────────────────────────────────────────────────────────
  // Acciones
  // ─────────────────────────────────────────────────────────────────────────
  const handleInscribirse = async (semilleroId: number) => {
    try {
      await inscripcionesService.create({
        semillero: semilleroId,
        semestre: CURRENT_SEMESTER,
      });
      setSuccessMsg("¡Te has inscrito correctamente al semillero!");
      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.non_field_errors?.[0] ||
          "Error al inscribirse. Intenta nuevamente.",
      );
    }
  };

  const handleConfirmRetiro = async () => {
    if (confirmRetiroId === null) return;
    setRetiroLoading(true);
    try {
      await inscripcionesService.remove(confirmRetiroId);
      setSuccessMsg("Te has retirado del semillero exitosamente.");
      setConfirmRetiroId(null);
      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Error al retirarse del semillero.",
      );
    } finally {
      setRetiroLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derivados
  // ─────────────────────────────────────────────────────────────────────────
  const isInscrito = (semilleroId: number) => !!inscripcionMap[semilleroId];

  const misInscripciones = inscripciones.filter((i) =>
    isStudent ? true : i.estado !== "retirado",
  );

  // Filtros
  const filteredSemilleros = semilleros.filter((s) =>
    `${s.nombre} ${s.codigo} ${s.grupo_investigacion_nombre ?? ""} ${s.director_nombre ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const filteredMis = misInscripciones.filter((i) =>
    `${i.semillero_nombre ?? ""} ${i.semillero_codigo ?? ""} ${i.semestre ?? ""} ${i.estudiante_nombre ?? ""}`
      .toLowerCase()
      .includes(searchMis.toLowerCase()),
  );

  const paginatedSemilleros = filteredSemilleros.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const paginatedMis = filteredMis.slice(
    pageMis * rowsPerPage,
    pageMis * rowsPerPage + rowsPerPage,
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Estadísticas rápidas (tarjetas superiores)
  // ─────────────────────────────────────────────────────────────────────────
  const statsCards = isStudent
    ? [
        {
          label: "Semilleros disponibles",
          value: semilleros.length,
          icon: <ScienceOutlined />,
          color: theme.palette.primary.main,
        },
        {
          label: "Mis inscripciones",
          value: Object.keys(inscripcionMap).length,
          icon: <CheckCircleOutlined />,
          color: theme.palette.success.main,
        },
        {
          label: "Semestre actual",
          value: CURRENT_SEMESTER,
          icon: <SchoolOutlined />,
          color: theme.palette.info.main,
        },
      ]
    : [
        {
          label: "Total inscripciones",
          value: inscripciones.length,
          icon: <GroupOutlined />,
          color: theme.palette.primary.main,
        },
        {
          label: "Semilleros activos",
          value: semilleros.length,
          icon: <ScienceOutlined />,
          color: theme.palette.secondary.main,
        },
        {
          label: "Semestre",
          value: CURRENT_SEMESTER,
          icon: <SchoolOutlined />,
          color: theme.palette.info.main,
        },
      ];

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 44,
              height: 44,
            }}
          >
            <PersonAddOutlined />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              fontFamily='"DM Sans", sans-serif'
            >
              Inscripciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rol actual: <strong>{currentRole}</strong>
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Recargar datos">
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Alertas ─────────────────────────────────────────────────────── */}
      {successMsg && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMsg("")}
        >
          {successMsg}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── Tarjetas de estadísticas ─────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statsCards.map((card) => (
          <Grid item xs={12} sm={4} key={card.label}>
            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent
                sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}
              >
                <Avatar
                  sx={{
                    bgcolor: `${card.color}18`,
                    color: card.color,
                    width: 44,
                    height: 44,
                  }}
                >
                  {card.icon}
                </Avatar>
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    fontFamily='"DM Sans", sans-serif'
                    lineHeight={1.2}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Tabs (solo para estudiante) ──────────────────────────────────── */}
      {isStudent && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              label="Semilleros disponibles"
              icon={<ScienceOutlined />}
              iconPosition="start"
            />
            <Tab
              label={`Mis semilleros (${Object.keys(inscripcionMap).length})`}
              icon={<CheckCircleOutlined />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
      )}

      {/* ── Cargando inicial ─────────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 0 / Vista Admin-Director: Semilleros disponibles
         ═══════════════════════════════════════════════════════════════════ */}
      {!loading && (tabValue === 0 || !isStudent) && (
        <>
          {/* Título de sección para admin/director */}
          {!isStudent && (
            <>
              <Typography
                variant="h6"
                fontWeight={600}
                fontFamily='"DM Sans", sans-serif'
                sx={{ mb: 1.5 }}
              >
                {isAdmin
                  ? "Todas las inscripciones"
                  : "Inscripciones en mis semilleros"}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          <TextField
            size="small"
            placeholder={
              isStudent
                ? "Buscar semillero por nombre, código, grupo..."
                : "Buscar por semillero, estudiante, semestre..."
            }
            value={isStudent ? search : searchMis}
            onChange={(e) =>
              isStudent
                ? setSearch(e.target.value)
                : setSearchMis(e.target.value)
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, width: { xs: "100%", sm: 360 } }}
          />

          {/* ── Tabla: ESTUDIANTE ve semilleros para inscribirse ── */}
          {isStudent && (
            <Paper
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)",
                      }}
                    >
                      <TableCell>
                        <strong>Semillero</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Código</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Grupo de Investigación</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Director</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Estado</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Inscripción</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSemilleros.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.disabled">
                            No se encontraron semilleros disponibles
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSemilleros.map((s) => {
                        const inscrito = isInscrito(s.id);
                        return (
                          <TableRow key={s.id} hover>
                            <TableCell>
                              <Typography fontWeight={600}>
                                {s.nombre}
                              </Typography>
                              {s.objetivo && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    maxWidth: 280,
                                  }}
                                >
                                  {s.objetivo}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {s.codigo}
                            </TableCell>
                            <TableCell>
                              {s.grupo_investigacion_nombre || "—"}
                            </TableCell>
                            <TableCell>{s.director_nombre || "—"}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={s.is_active ? "Activo" : "Inactivo"}
                                color={s.is_active ? "success" : "error"}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {inscrito ? (
                                <Chip
                                  label="Inscrito"
                                  color="primary"
                                  size="small"
                                  icon={<CheckCircleOutlined />}
                                />
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<PersonAddOutlined />}
                                  onClick={() => handleInscribirse(s.id)}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                  }}
                                >
                                  Inscribirse
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredSemilleros.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(+e.target.value);
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </Paper>
          )}

          {/* ── Tabla: ADMIN / DIRECTOR ve lista de inscripciones ── */}
          {!isStudent && (
            <Paper
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)",
                      }}
                    >
                      <TableCell>
                        <strong>Estudiante</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Semillero</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Código</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Semestre</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Fecha inscripción</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Estado</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedMis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.disabled">
                            No hay inscripciones registradas
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMis.map((insc) => (
                        <TableRow key={insc.id} hover>
                          <TableCell>
                            <Typography fontWeight={500}>
                              {insc.estudiante_nombre ||
                                `#${insc.estudiante}` ||
                                "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight={600}>
                              {insc.semillero_nombre ||
                                `Semillero #${insc.semillero}`}
                            </Typography>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {insc.semillero_codigo || "—"}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={insc.semestre} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            {insc.fecha_inscripcion
                              ? new Date(
                                  insc.fecha_inscripcion,
                                ).toLocaleDateString("es-CO")
                              : "—"}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                insc.estado === "activa"
                                  ? "Activa"
                                  : insc.estado === "retirado"
                                    ? "Retirado"
                                    : "Inactiva"
                              }
                              color={
                                insc.estado === "activa"
                                  ? "success"
                                  : insc.estado === "retirado"
                                    ? "error"
                                    : "default"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredMis.length}
                page={pageMis}
                onPageChange={(_, p) => setPageMis(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(+e.target.value);
                  setPageMis(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </Paper>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1 (solo ESTUDIANTE): Mis semilleros inscritos
         ═══════════════════════════════════════════════════════════════════ */}
      {!loading && isStudent && tabValue === 1 && (
        <>
          <TextField
            size="small"
            placeholder="Buscar en mis semilleros..."
            value={searchMis}
            onChange={(e) => setSearchMis(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, width: { xs: "100%", sm: 360 } }}
          />

          {Object.keys(inscripcionMap).length === 0 ? (
            <Paper
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                py: 8,
                textAlign: "center",
              }}
            >
              <ScienceOutlined
                sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aún no estás inscrito en ningún semillero
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Ve a "Semilleros disponibles" y haz clic en{" "}
                <strong>Inscribirse</strong> para unirte.
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2, borderRadius: 2, textTransform: "none" }}
                onClick={() => setTabValue(0)}
              >
                Ver semilleros disponibles
              </Button>
            </Paper>
          ) : (
            <Paper
              sx={{
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)",
                      }}
                    >
                      <TableCell>
                        <strong>Semillero</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Código</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Semestre</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Fecha inscripción</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Acciones</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedMis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography color="text.disabled">
                            No se encontraron coincidencias
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMis.map((insc) => {
                        const semillero = semilleros.find(
                          (s) => s.id === insc.semillero,
                        );
                        return (
                          <TableRow key={insc.id} hover>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: `${theme.palette.primary.main}18`,
                                    color: theme.palette.primary.main,
                                    width: 34,
                                    height: 34,
                                  }}
                                >
                                  <ScienceOutlined fontSize="small" />
                                </Avatar>
                                <Box>
                                  <Typography fontWeight={600}>
                                    {insc.semillero_nombre ||
                                      semillero?.nombre ||
                                      `Semillero #${insc.semillero}`}
                                  </Typography>
                                  {semillero?.grupo_investigacion_nombre && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {semillero.grupo_investigacion_nombre}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {insc.semillero_codigo ||
                                semillero?.codigo ||
                                "—"}
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={insc.semestre} size="small" />
                            </TableCell>
                            <TableCell align="center">
                              {insc.fecha_inscripcion
                                ? new Date(
                                    insc.fecha_inscripcion,
                                  ).toLocaleDateString("es-CO")
                                : "—"}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Salir del semillero">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<LogoutOutlined />}
                                  onClick={() => setConfirmRetiroId(insc.id)}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: "none",
                                  }}
                                >
                                  Retirarse
                                </Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredMis.length}
                page={pageMis}
                onPageChange={(_, p) => setPageMis(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(+e.target.value);
                  setPageMis(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </Paper>
          )}
        </>
      )}

      {/* ── Diálogo confirmación retiro ──────────────────────────────────── */}
      <Dialog
        open={confirmRetiroId !== null}
        onClose={() => setConfirmRetiroId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          ¿Retirarte del semillero?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta acción cancelará tu inscripción. Podrás volver a inscribirte
            más adelante si lo deseas.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmRetiroId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRetiro}
            disabled={retiroLoading}
            startIcon={
              retiroLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <LogoutOutlined />
              )
            }
          >
            {retiroLoading ? "Procesando..." : "Confirmar retiro"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
