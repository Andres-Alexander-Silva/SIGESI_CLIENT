// src/types/planEstrategico.ts

// ─── Enums ────────────────────────────────────────────────────────────────────
export type EstadoPlanEstrategico =
  | 'borrador'
  | 'en_revision'
  | 'aprobado'
  | 'rechazado'
  | 'en_ejecucion'
  | 'finalizado';

// ─── Labels legibles ──────────────────────────────────────────────────────────
export const ESTADO_PE_LABELS: Record<EstadoPlanEstrategico, string> = {
  borrador:     'Borrador',
  en_revision:  'En revisión',
  aprobado:     'Aprobado',
  rechazado:    'Rechazado',
  en_ejecucion: 'En ejecución',
  finalizado:   'Finalizado',
};

export const ESTADO_PE_COLOR: Record<
  EstadoPlanEstrategico,
  'default' | 'info' | 'success' | 'error' | 'warning' | 'primary'
> = {
  borrador:     'default',
  en_revision:  'info',
  aprobado:     'success',
  rechazado:    'error',
  en_ejecucion: 'primary',
  finalizado:   'warning',
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface PlanEstrategico {
  id: number;
  semillero: {
    id: number;
    nombre: string;
    codigo: string;
    objetivo: string;
    grupo_investigacion: number;
    grupo_investigacion_nombre: string;
    director?: number | null;
    director_nombre?: string;
    is_active: boolean;
    fecha_creacion: string;
    estado_aval?: string;
    created_at: string;
    updated_at: string;
  };
  titulo: string;
  anio: number;
  objetivos: string;
  metas: string;
  indicadores: string;
  estado: EstadoPlanEstrategico;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string;
  fecha_aprobacion?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanEstrategicoCreate {
  semillero: number;
  titulo: string;
  anio: number;
  objetivos: string;
  metas: string;
  indicadores: string;
  estado?: EstadoPlanEstrategico;
}

export interface PlanEstrategicoFilters {
  search?:   string;
  semillero?: string;
  anio?:     string;
  estado?:   string;
  page?:     number;
}

// ─── Cronograma Semestral ─────────────────────────────────────────────────────
export type EstadoCronogramaSemestral = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada' | 'atrasada';

export const ESTADO_CRONOGRAMA_LABELS: Record<EstadoCronogramaSemestral, string> = {
  pendiente:    'Pendiente',
  en_progreso:  'En progreso',
  completada:   'Completada',
  cancelada:    'Cancelada',
  atrasada:     'Atrasada',
};

export const ESTADO_CRONOGRAMA_COLOR: Record<
  EstadoCronogramaSemestral,
  'default' | 'info' | 'success' | 'error' | 'warning' | 'primary'
> = {
  pendiente:   'default',
  en_progreso: 'primary',
  completada:  'success',
  cancelada:   'error',
  atrasada:    'warning',
};

// Estado de actividad de cronograma (según Swagger: pendiente | en_progreso | completada)
export type EstadoActividadCronograma = 'pendiente' | 'en_progreso' | 'completada';

export const ESTADO_ACT_CRON_LABELS: Record<EstadoActividadCronograma, string> = {
  pendiente:   'Pendiente',
  en_progreso: 'En progreso',
  completada:  'Completada',
};

export const ESTADO_ACT_CRON_COLOR: Record<
  EstadoActividadCronograma,
  'default' | 'info' | 'success' | 'error' | 'warning' | 'primary'
> = {
  pendiente:   'default',
  en_progreso: 'primary',
  completada:  'success',
};

export interface ActividadCronograma {
  id: number;
  cronograma: number;
  titulo: string;
  descripcion?: string;
  responsable?: number | null;
  responsable_nombre?: string;
  objetivo_general?: string;
  objetivos_especificos?: string;
  estado?: EstadoActividadCronograma;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  fecha_fin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActividadCronogramaCreate {
  cronograma: number;
  titulo: string;
  descripcion?: string;
  responsable?: number | null;
  objetivo_general?: string;
  objetivos_especificos?: string;
  estado?: EstadoActividadCronograma;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  fecha_fin?: string | null;
}

export interface CronogramaSemestral {
  id: number;
  plan_accion: number;
  semillero: number;
  semillero_nombre: string;
  semestre: string;
  descripcion?: string;
  responsable?: number | null;
  responsable_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  cumplido: boolean;
  actividades: ActividadCronograma[];
  created_at: string;
  updated_at: string;
}

export interface CronogramaSemestralCreate {
  plan_accion: number;
  descripcion?: string;
  responsable?: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  cumplido?: boolean;
}

export interface CronogramaFilters {
  search?:      string;
  plan_accion?: string;
  semillero?:   string;
  semestre?:    string;
  page?:        number;
}
