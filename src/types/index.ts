// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export type UserRole =
  | 'administrador'
  | 'director_grupo'
  | 'director_semillero'
  | 'lider_estudiantil'
  | 'estudiante'

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Permisos / Menús  (GET /config/users/mis-permisos/)
// ─────────────────────────────────────────────────────────────────────────────
export type AccionType =
  | 'ver'
  | 'crear'
  | 'editar'
  | 'eliminar'
  | 'aprobar'
  | 'exportar';

/** Opción tal como devuelve GET /config/users/mis-permisos/
 *  (puede_* mapean a: ver=consultar, crear=crear, editar=actualizar, eliminar=eliminar) */
export interface Opcion {
  id: number;
  nombre: string;
  url: string;
  puede_consultar: boolean;
  puede_crear: boolean;
  puede_actualizar: boolean;
  puede_eliminar: boolean;
}

export interface Menu {
  id: number;
  nombre: string;
  icono: string;
  orden?: number;
  /** URL de navegación directa (hoja o hijo construido en cliente) */
  url?: string;
  is_active?: boolean;
  opciones?: Opcion[];
  /** Hijos construidos en cliente a partir de las opciones del menú */
  children?: Menu[];
}

export interface UserPermissionsResponse {
  rol: string;
  menus: Menu[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Config Admin
// ─────────────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserAdmin {
  id: number;
  username: string;
  email: string;
  correo_personal: string | null;
  is_graduated: boolean;
  first_name: string;
  last_name: string;
  cedula: string;
  telefono?: string;
  rol: UserRole;
  codigo_estudiantil?: string;
  programa_academico?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuAdmin {
  id: number;
  nombre: string;
  icono: string;
  estado?: boolean;
}

export interface OpcionAdmin {
  id: number;
  menu: number;
  nombre: string;
  url: string;
  estado?: boolean;
}

export interface PermisoAdmin {
  id: number;
  rol: UserRole;
  opcion: number;
  puede_consultar?: boolean;
  puede_crear?: boolean;
  puede_actualizar?: boolean;
  puede_eliminar?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_semilleros: number;
  total_proyectos: number;
  total_estudiantes: number;
  total_producciones: number;
  proyectos_activos: number;
  proyectos_finalizados: number;
}
