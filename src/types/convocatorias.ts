// src/types/convocatorias.ts

export type EstadoConvocatoria = "abierta" | "cerrada" | "en_evaluacion" | "finalizada";
export type TipoConvocatoria = "interna" | "externa";
export type ModalidadEvento = "presencial" | "virtual" | "hibrido";
export type EstadoEvento = "activo" | "finalizado" | "cancelado";
export type TipoParticipacion = "ponente" | "asistente" | "organizador" | "poster";
export type EstadoPostulacion = "pendiente" | "aceptada" | "rechazada" | "en_evaluacion";

// ─────────────────────────────────────────────────────────────────────────────
// Evento
// ─────────────────────────────────────────────────────────────────────────────

export interface Evento {
  id: number;
  nombre: string;
  descripcion: string;
  modalidad: ModalidadEvento;
  lugar: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: EstadoEvento;
  created_at: string;
  updated_at: string;
}

export interface EventoCreate {
  nombre: string;
  descripcion?: string;
  modalidad?: ModalidadEvento;
  lugar?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  estado?: EstadoEvento;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convocatoria
// ─────────────────────────────────────────────────────────────────────────────

export interface Convocatoria {
  id: number;
  evento: Evento;
  titulo: string;
  descripcion: string;
  tipo: TipoConvocatoria;
  entidad: string | null;
  fecha_apertura: string;
  fecha_cierre: string;
  requisitos: string | null;
  presupuesto: string | null;
  url: string | null;
  estado: EstadoConvocatoria;
  created_at: string;
  updated_at: string;
}

export interface ConvocatoriaCreate {
  evento: number;
  titulo: string;
  descripcion: string;
  tipo: TipoConvocatoria;
  entidad?: string;
  fecha_apertura: string;
  fecha_cierre: string;
  requisitos?: string;
  presupuesto?: number | null;
  url?: string;
  estado?: EstadoConvocatoria;
}

// ─────────────────────────────────────────────────────────────────────────────
// Postulación
// ─────────────────────────────────────────────────────────────────────────────

export interface PostulacionUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface PostulacionSemillero {
  id: number;
  nombre: string;
}

export interface PostulacionConvocatoria {
  id: number;
  titulo: string;
}

export interface Postulacion {
  id: number;
  convocatoria: PostulacionConvocatoria;
  semillero: PostulacionSemillero;
  estudiantes: PostulacionUser[];
  proyecto: number | null;
  estado: EstadoPostulacion;
  observaciones: string | null;
  resultado: string | null;
  aprobado_por: number | null;
  aprobado_por_nombre: string | null;
  fecha_resolucion: string | null;
  fecha_postulacion: string;
  created_at: string;
  updated_at: string;
}

export interface PostulacionCreate {
  convocatoria: number;
  semillero: number;
  estudiantes: number[];
  proyecto?: number | null;
  observaciones?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Participación en Evento
// ─────────────────────────────────────────────────────────────────────────────

export interface ParticipacionEvento {
  id: number;
  evento: Evento;
  participante: PostulacionUser;
  postulacion: number | null;
  produccion: number | null;
  tipo_participacion: TipoParticipacion;
  certificado: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipacionEventoCreate {
  evento: number;
  participante: number;
  tipo_participacion: TipoParticipacion;
  postulacion?: number | null;
  produccion?: number | null;
}
