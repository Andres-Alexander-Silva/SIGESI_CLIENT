import { type ReactElement } from "react";
import {
  DashboardOutlined,
  GroupsOutlined,
  AssignmentOutlined,
  ArticleOutlined,
  CampaignOutlined,
  BarChartOutlined,
  SettingsOutlined,
  ScienceOutlined,
  PeopleOutlined,
  PersonOutlined,
  SecurityOutlined,
  SchoolOutlined,
  MenuBookOutlined,
  MenuOutlined,
  CheckBoxOutlined,
  FolderOutlined,
  EventOutlined,
  NotificationsOutlined,
  AdminPanelSettingsOutlined,
  AccountTreeOutlined,
  LibraryBooksOutlined,
  EmojiEventsOutlined,
  BusinessOutlined,
  HomeOutlined,
  ListAltOutlined,
  AnalyticsOutlined,
  ManageAccountsOutlined,
  LockOutlined,
  HelpOutlined,
  CalendarMonthOutlined,
  RateReviewOutlined,
  TrackChangesOutlined,
  PsychologyOutlined,
  GradingOutlined,
  AccountCircleOutlined,
} from "@mui/icons-material";
import { FaChartLine, FaTasks } from "react-icons/fa";

/**
 * Mapa de nombres de icono (devueltos por la API) a componentes MUI.
 * Los nombres son insensibles a mayúsculas/guiones/espacios.
 *
 * Para agregar nuevos iconos solo hay que añadir una entrada aquí.
 */
const MAP: Record<string, ReactElement> = {
  // ── Generales ────────────────────────────────────────────────────────────
  dashboard: <DashboardOutlined />,
  tachometer: <DashboardOutlined />, // fa-tachometer-alt
  tachometeralt: <DashboardOutlined />,
  gauge: <DashboardOutlined />, // fa-gauge
  gaugehigh: <DashboardOutlined />,
  speedometer: <DashboardOutlined />,
  home: <HomeOutlined />,
  house: <HomeOutlined />,
  menu: <ListAltOutlined />,
  list: <ListAltOutlined />,
  listalt: <ListAltOutlined />,

  // ── Competencias Investigativas ──────────────────────────────────────────
  psychology: <PsychologyOutlined />,
  competencias: <PsychologyOutlined />,
  competenciasinvestigativas: <PsychologyOutlined />,

  // ── Evaluaciones Investigativas ──────────────────────────────────────────
  grading: <GradingOutlined />,
  evaluacionesinvestigativas: <GradingOutlined />,

  // ── Dashboard / Estadísticas de Competencias ─────────────────────────────
  competenciasdashboard: <AnalyticsOutlined />,
  estadisticasinvestigativas: <AnalyticsOutlined />,
  competenciasestadisticas: <AnalyticsOutlined />,

  // ── Perfil Investigativo ──────────────────────────────────────────────────
  perfilinvestigativo: <AccountCircleOutlined />,
  perfil: <AccountCircleOutlined />,
  accountcircle: <AccountCircleOutlined />,

  // ── Semilleros / Investigación ───────────────────────────────────────────
  semilleros: <GroupsOutlined />,
  grupos: <GroupsOutlined />,
  investigacion: <ScienceOutlined />,
  science: <ScienceOutlined />,
  laboratorio: <ScienceOutlined />,
  flask: <ScienceOutlined />, // fa-flask
  microscope: <ScienceOutlined />,
  atom: <ScienceOutlined />,

  // ── Proyectos ─────────────────────────────────────────────────────────────
  proyectos: <AssignmentOutlined />,
  proyecto: <AssignmentOutlined />,
  tareas: <AssignmentOutlined />,
  assignment: <AssignmentOutlined />,
  tasks: <AssignmentOutlined />, // fa-tasks
  fatasks: <FaTasks />, // FaTasks
  clipboard: <AssignmentOutlined />,
  clipboardlist: <AssignmentOutlined />,
  listcheck: <ListAltOutlined />, // fa-list-check
  planaccion: <ListAltOutlined />,

  // ── Producción académica ─────────────────────────────────────────────────
  produccion: <ArticleOutlined />,
  articulos: <ArticleOutlined />,
  publicaciones: <ArticleOutlined />,
  libros: <LibraryBooksOutlined />,
  biblioteca: <LibraryBooksOutlined />,
  book: <LibraryBooksOutlined />, // fa-book
  books: <LibraryBooksOutlined />,
  file: <ArticleOutlined />, // fa-file-alt
  filealt: <ArticleOutlined />,
  filelines: <ArticleOutlined />,

  // ── Convocatorias / Eventos ───────────────────────────────────────────────
  convocatorias: <CampaignOutlined />,
  convocatoria: <CampaignOutlined />,
  bullhorn: <CampaignOutlined />, // fa-bullhorn
  megaphone: <CampaignOutlined />,
  eventos: <EventOutlined />,
  event: <EventOutlined />,
  calendar: <EventOutlined />, // fa-calendar / fa-calendar-alt
  calendaralt: <EventOutlined />,
  calendardays: <EventOutlined />,
  logros: <EmojiEventsOutlined />,
  trophy: <EmojiEventsOutlined />, // fa-trophy
  award: <EmojiEventsOutlined />,
  medal: <EmojiEventsOutlined />,

  // ── Reportes / Estadísticas ───────────────────────────────────────────────
  reportes: <BarChartOutlined />,
  reporte: <BarChartOutlined />,
  estadisticas: <AnalyticsOutlined />,
  analytics: <AnalyticsOutlined />,
  graficas: <BarChartOutlined />,
  chartbar: <BarChartOutlined />, // fa-chart-bar
  chartline: <AnalyticsOutlined />, // fa-chart-line
  fachartline: <FaChartLine />, // FaChartLine
  chartpie: <AnalyticsOutlined />, // fa-chart-pie
  barchart: <BarChartOutlined />,
  piechart: <AnalyticsOutlined />,

  // ── Usuarios / Personas ───────────────────────────────────────────────────
  usuarios: <PeopleOutlined />,
  people: <PeopleOutlined />,
  users: <PeopleOutlined />, // fa-users
  user: <PeopleOutlined />, // fa-user
  usergroup: <PeopleOutlined />,
  useradd: <PeopleOutlined />,
  estudiantes: <SchoolOutlined />,
  docentes: <SchoolOutlined />,
  school: <SchoolOutlined />,
  graduationcap: <SchoolOutlined />, // fa-graduation-cap
  usergraduate: <SchoolOutlined />,
  cursos: <MenuBookOutlined />,

  // ── Configuración / Admin ─────────────────────────────────────────────────
  configuracion: <SettingsOutlined />,
  settings: <SettingsOutlined />,
  cog: <SettingsOutlined />, // fa-cog
  cogs: <SettingsOutlined />, // fa-cogs
  gear: <SettingsOutlined />, // fa-gear
  gears: <SettingsOutlined />,
  sliders: <SettingsOutlined />, // fa-sliders-h
  slidershorizontal: <SettingsOutlined />,
  slidersv: <SettingsOutlined />,
  administracion: <AdminPanelSettingsOutlined />,
  admin: <AdminPanelSettingsOutlined />,
  permisos: <SecurityOutlined />,
  shield: <SecurityOutlined />, // fa-shield-alt
  shieldalt: <SecurityOutlined />,
  shieldhalved: <SecurityOutlined />,
  roles: <ManageAccountsOutlined />,
  usercog: <ManageAccountsOutlined />, // fa-user-cog
  usershield: <ManageAccountsOutlined />,
  seguridad: <LockOutlined />,
  lock: <LockOutlined />, // fa-lock
  key: <LockOutlined />, // fa-key

  // ── Estructura ────────────────────────────────────────────────────────────
  facultades: <BusinessOutlined />,
  programas: <AccountTreeOutlined />,
  estructura: <AccountTreeOutlined />,
  sitemap: <AccountTreeOutlined />, // fa-sitemap
  building: <BusinessOutlined />, // fa-building
  university: <BusinessOutlined />, // fa-university
  carpeta: <FolderOutlined />,
  folder: <FolderOutlined />,
  folderopen: <FolderOutlined />,

  // ── Notificaciones ────────────────────────────────────────────────────────
  notificaciones: <NotificationsOutlined />,
  notifications: <NotificationsOutlined />,
  bell: <NotificationsOutlined />, // fa-bell

  // ── Otros ─────────────────────────────────────────────────────────────────
  ayuda: <HelpOutlined />,
  help: <HelpOutlined />,
  question: <HelpOutlined />, // fa-question-circle
  questioncircle: <HelpOutlined />,
  info: <HelpOutlined />, // fa-info-circle
  infocircle: <HelpOutlined />,

  inscripcionsemilleros: <SchoolOutlined />,
  inscripcion: <AssignmentOutlined />,
  registro: <AssignmentOutlined />,
  filesignature: <AssignmentOutlined />, // fa-file-signature

  gestionarmiembros: <ManageAccountsOutlined />,
  miembros: <PeopleOutlined />,
  usersgear: <ManageAccountsOutlined />, // fa-users-gear
  usergear: <ManageAccountsOutlined />, // fa-user-gear
  programasacademicos: <SchoolOutlined />,
  cronogramaproyecto: <CalendarMonthOutlined />,
  evaluacionesproyecto: <RateReviewOutlined />,
  cronograma: <CalendarMonthOutlined />,
  evaluaciones: <RateReviewOutlined />,
  lan_estrategico: <TrackChangesOutlined />,
  bullseye: <TrackChangesOutlined />,
  target: <TrackChangesOutlined />,
};

/**
 * Mapa URL-segmento → icono. Clave = último segmento de la URL, en minúsculas.
 * Se usa para los ítems hijo del sidebar donde la API no proporciona un icono.
 */
const URL_MAP: Record<string, ReactElement> = {
  dashboard: <DashboardOutlined />,
  semilleros: <ScienceOutlined />,
  grupos: <GroupsOutlined />,
  proyectos: <AssignmentOutlined />,
  produccion: <ArticleOutlined />,
  convocatorias: <CampaignOutlined />,
  reportes: <BarChartOutlined />,
  usuarios: <PersonOutlined />,
  menus: <MenuOutlined />,
  opciones: <CheckBoxOutlined />,
  permisos: <SecurityOutlined />,
  programas_academicos: <SchoolOutlined />,
  cronograma_proyecto: <CalendarMonthOutlined />,
  evaluaciones_proyecto: <RateReviewOutlined />,
  plan_accion: <ListAltOutlined />,
  plan_estrategico: <TrackChangesOutlined />,
  cronograma: <CalendarMonthOutlined />,
  competencias_investigativas: <PsychologyOutlined />,
  evaluaciones_investigativas: <GradingOutlined />,
  competencias_estadisticas: <AnalyticsOutlined />,
  perfil_investigativo: <AccountCircleOutlined />,
};

/**
 * Devuelve un icono basado en el último segmento de una URL.
 * Ej: "/configuracion/usuarios" → PersonOutlined
 */
export function getUrlIcon(url: string | undefined): ReactElement {
  if (!url) return <FolderOutlined />;
  const segment = url.replace(/\/$/, "").split("/").pop()?.toLowerCase() ?? "";
  return URL_MAP[segment] ?? <FolderOutlined />;
}

/**
 * Devuelve el componente de icono correspondiente al nombre dado.
 * Soporta nombres clave simples ("dashboard"), clases Font Awesome ("fa-flask",
 * "fas fa-users") y cualquier combinación con guiones/underscores/espacios.
 * Si no encuentra coincidencia devuelve el icono por defecto.
 */
export function getMenuIcon(iconName: string | undefined): ReactElement {
  if (!iconName) return <FolderOutlined />;

  // 1. Quitar prefijos Font Awesome: "fa-", "fas ", "far ", "fal ", "fab "
  const stripped = iconName
    .replace(/^fa[srblx]?\s+/i, "") // "fas fa-flask" → "fa-flask"
    .replace(/^fa-/i, ""); // "fa-flask" → "flask"

  // 2. Normalizar: minúsculas, quitar guiones/espacios/underscores
  const key = stripped.toLowerCase().replace(/[-_\s]/g, "");

  return MAP[key] ?? <FolderOutlined />;
}

/**
 * Resuelve el icono del sidebar intentando primero por URL para priorizar
 * nuestras rutas conocidas, y luego por el nombre de icono devuelto por el backend.
 */
export function getSidebarIcon(
  icono: string | undefined,
  url: string | undefined,
): ReactElement {
  if (url) {
    const segment =
      url.replace(/\/$/, "").split("/").pop()?.toLowerCase() ?? "";
    if (URL_MAP[segment]) {
      return URL_MAP[segment];
    }
  }
  if (icono) {
    const stripped = icono.replace(/^fa[srblx]?\s+/i, "").replace(/^fa-/i, "");
    const key = stripped.toLowerCase().replace(/[-_\s]/g, "");
    if (MAP[key]) {
      return MAP[key];
    }
  }
  return <FolderOutlined />;
}
