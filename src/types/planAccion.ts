// src/types/planAccion.ts

// ─── Enums ────────────────────────────────────────────────────────────────────
export type EstadoPlanAccion =
  | 'borrador'
  | 'enviado'
  | 'aprobado'
  | 'rechazado'
  | 'en_ejecucion'
  | 'finalizado';

export type CategoriaObjetivo =
  | 'academicos'
  | 'investigativos'
  | 'administrativos'
  | 'institucionales';

// ─── Labels legibles ──────────────────────────────────────────────────────────
export const ESTADO_PLAN_LABELS: Record<EstadoPlanAccion, string> = {
  borrador:     'Borrador',
  enviado:      'Enviado',
  aprobado:     'Aprobado',
  rechazado:    'Rechazado',
  en_ejecucion: 'En ejecución',
  finalizado:   'Finalizado',
};

export const CATEGORIA_LABELS: Record<CategoriaObjetivo, string> = {
  academicos:      'Académicos',
  investigativos:  'Investigativos',
  administrativos: 'Administrativos',
  institucionales: 'Institucionales',
};

// Colores de chip según estado
export const ESTADO_PLAN_COLOR: Record<
  EstadoPlanAccion,
  'default' | 'info' | 'success' | 'error' | 'warning' | 'primary'
> = {
  borrador:     'default',
  enviado:      'info',
  aprobado:     'success',
  rechazado:    'error',
  en_ejecucion: 'primary',
  finalizado:   'warning',
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface ObjetivoPlanAccion {
  id?: number;
  descripcion: string;
  categoria: CategoriaObjetivo;
}

export interface PlanAccion {
  id: number;
  semillero: number;
  semillero_nombre: string;
  plan_estrategico?: number | null;
  titulo: string;
  semestre: string;
  objetivos: ObjetivoPlanAccion[];
  metas: string;
  estado: EstadoPlanAccion;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanAccionCreate {
  semillero: number;
  plan_estrategico?: number | null;
  titulo: string;
  semestre: string;
  objetivos: ObjetivoPlanAccion[];
  metas: string;
  estado?: EstadoPlanAccion;
}

export interface PlanAccionFilters {
  search?:    string;
  semillero?: string;
  semestre?:  string;
  page?:      number;
}

// ─── Dashboard de Plan de Acción ──────────────────────────────────────────────
export interface DashboardObjetivosCategoria {
  categoria: CategoriaObjetivo;
  label: string;
  count: number;
}

export interface DashboardResponsable {
  responsable_id: number | null;
  responsable_nombre: string;
  asignadas: number;
  completadas: number;
}

export interface DashboardPlanAccion {
  plan_id: number;
  titulo: string;
  semestre: string;
  semillero: string;
  estado: EstadoPlanAccion;
  /** Distribución de objetivos por categoría */
  objetivos_por_categoria: DashboardObjetivosCategoria[];
  /** Porcentaje de actividades del cronograma completadas */
  porcentaje_cronograma: number;
  total_actividades_cronograma: number;
  actividades_completadas: number;
  /** Actividades a tiempo vs. atrasadas */
  actividades_a_tiempo: number;
  actividades_atrasadas: number;
  /** Desglose por responsable */
  por_responsable: DashboardResponsable[];
}
