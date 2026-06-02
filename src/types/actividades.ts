// src/types/actividades.ts

export type EstadoActividad =
  | "pendiente"
  | "en_progreso"
  | "completada"
  | "cancelada"
  | "atrasada";

export interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  proyecto: number;
  proyecto_titulo?: string;
  responsable?: number | null;
  responsable_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoActividad;
  porcentaje_avance: number;
  created_at: string;
  updated_at: string;
}

export interface ActividadCreate {
  titulo: string;
  descripcion: string;
  proyecto: number;
  responsable?: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: EstadoActividad;
  porcentaje_avance?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Avances
// ─────────────────────────────────────────────────────────────────────────────
export type EstadoAvance =
  | "borrador"
  | "enviado"
  | "aprobado"
  | "rechazado"
  | "en_revision";

export interface Avance {
  id: number;
  descripcion: string;
  fecha: string;
  actividad: number;
  actividad_titulo?: string;
  proyecto?: number;
  proyecto_nombre?: string;
  estudiante?: number | null;
  estudiante_nombre?: string;
  evidencia?: string | null;
  evidencia_nombre?: string | null;
  estado: EstadoAvance;
  observaciones?: string | null;
  aprobado_por?: number | null;
  aprobado_por_nombre?: string | null;
  fecha_aprobacion?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvanceCreate {
  descripcion: string;
  fecha: string;
  actividad: number;
  evidencia?: File | null;
  estado?: EstadoAvance;
}

export interface AvanceUpdate {
  descripcion?: string;
  fecha?: string;
  actividad?: number;
  observaciones?: string;
  estado?: EstadoAvance;
}
