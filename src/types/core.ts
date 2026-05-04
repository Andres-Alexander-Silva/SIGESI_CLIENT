export interface LineaInvestigacion {
  id: number;
  nombre: string;
  descripcion?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LineaInvestigacionCreate {
  nombre: string;
  descripcion?: string;
  is_active?: boolean;
}

export interface GrupoInvestigacion {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  fecha_creacion: string;
  programa_academico: number;
  director?: number | null;
  director_nombre?: string;
  lineas_investigacion?: number[];
  lineas_investigacion_nombres?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GrupoInvestigacionCreate {
  nombre: string;
  codigo: string;
  descripcion?: string;
  fecha_creacion: string;
  programa_academico: number;
  director?: number | null;
  lineas_investigacion?: number[];
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Semilleros
// ─────────────────────────────────────────────────────────────────────────────
export interface Semillero {
  id: number;
  nombre: string;
  codigo: string;
  objetivo: string;
  mision?: string;
  vision?: string;
  fecha_creacion: string;
  grupo_investigacion: number;
  grupo_investigacion_nombre: string;
  director?: number | null;
  director_nombre?: string;
  lider_estudiantil?: number | null;
  lider_estudiantil_nombre?: string;
  lineas_investigacion?: number[];
  lineas_investigacion_nombres?: string;
  logo?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemilleroCreate {
  nombre: string;
  codigo: string;
  objetivo: string;
  mision?: string;
  vision?: string;
  fecha_creacion: string;
  grupo_investigacion: number;
  director: number;
  lider_estudiantil?: number | null;
  lineas_investigacion?: number[];
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Proyectos
// ─────────────────────────────────────────────────────────────────────────────
export type EstadoProyecto =
  | "idea"
  | "propuesta"
  | "en_ejecucion"
  | "en_resultados"
  | "cerrado"
  | "cancelado";

export interface Proyecto {
  id: number;
  titulo: string;
  codigo: string;
  descripcion: string;
  objetivo_general: string;
  objetivos_especificos?: string;
  semilleros: number[];
  semilleros_nombres?: string;
  linea_investigacion?: number | null;
  linea_investigacion_nombre?: string;
  director?: number | null;
  director_nombre?: string;
  lider?: number | null;
  lider_nombre?: string;
  estudiantes?: number[];
  estudiantes_nombres?: string;
  estado: EstadoProyecto;
  fecha_inicio?: string | null;
  fecha_fin_estimada?: string | null;
  fecha_cierre?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProyectoCreate {
  titulo: string;
  codigo: string;
  descripcion: string;
  objetivo_general: string;
  objetivos_especificos?: string;
  semilleros: number[];
  linea_investigacion?: number | null;
  director?: number | null;
  lider?: number | null;
  estudiantes?: number[];
  estado?: EstadoProyecto;
  fecha_inicio?: string | null;
  fecha_fin_estimada?: string | null;
  fecha_cierre?: string | null;
  is_active?: boolean;
}

export interface ProyectoChangeState {
  estado: EstadoProyecto;
}
