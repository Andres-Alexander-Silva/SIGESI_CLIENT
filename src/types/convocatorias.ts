// src/types/convocatorias.ts

export type EstadoConvocatoria = "borrador" | "activa" | "cerrada" | "cancelada";
export type TipoConvocatoria = "interna" | "externa";
export type ModalidadEvento = "presencial" | "virtual" | "hibrida";
export type EstadoEvento = "programado" | "en_curso" | "finalizado" | "cancelado";
export type TipoParticipacion = "ponente" | "asistente" | "organizador" | "poster";

// ─────────────────────────────────────────────────────────────────────────────
// Evento
// ─────────────────────────────────────────────────────────────────────────────

export interface Evento {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  modalidad: ModalidadEvento;
  estado: EstadoEvento;
  ubicacion?: string;
  enlace_virtual?: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface EventoCreate {
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  modalidad: ModalidadEvento;
  estado?: EstadoEvento;
  ubicacion?: string;
  enlace_virtual?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convocatoria
// ─────────────────────────────────────────────────────────────────────────────

export interface Convocatoria {
  id: number;
  evento: Evento;
  estado: EstadoConvocatoria;
  tipo: TipoConvocatoria;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface ConvocatoriaCreate {
  evento: number;
  estado: EstadoConvocatoria;
  tipo: TipoConvocatoria;
}

// ─────────────────────────────────────────────────────────────────────────────
// Participación en Evento
// ─────────────────────────────────────────────────────────────────────────────

export interface ParticipacionEvento {
  id: number;
  evento: number;
  evento_nombre?: string;
  participante: number;
  participante_nombre?: string;
  postulacion?: number | null;
  produccion?: number | null;
  tipo_participacion: TipoParticipacion;
  certificado?: string | null;
  fecha_creacion: string;
}

export interface ParticipacionEventoCreate {
  evento: number;
  participante: number;
  tipo_participacion: TipoParticipacion;
  postulacion?: number | null;
}
