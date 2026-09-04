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
//
// "Avance" es la nomenclatura de la UI; el recurso real en el backend es
// `Evidencia` (archivo adjunto a una Actividad), sin flujo de aprobación.
// Ver docs/HU-021_PLAN_IMPLEMENTACION.md, fase F0.
// ─────────────────────────────────────────────────────────────────────────────
export type TipoEvidencia =
  | "documento"
  | "acta"
  | "fotografia"
  | "video"
  | "otro";

export interface Avance {
  id: number;
  actividad: number;
  actividad_titulo?: string;
  proyecto_id?: number;
  tipo: TipoEvidencia;
  titulo: string;
  descripcion: string;
  archivo: string | null;
  subido_por?: number | null;
  subido_por_nombre?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvanceCreate {
  actividad: number;
  tipo: TipoEvidencia;
  titulo: string;
  descripcion: string;
  archivo: File;
}

export interface AvanceUpdate {
  actividad?: number;
  tipo?: TipoEvidencia;
  titulo?: string;
  descripcion?: string;
}
