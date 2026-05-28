// src/types/evaluaciones.ts

export type TipoEvaluacion = "autoevaluacion" | "heteroevaluacion";
export type NivelAlcanzado = "basico" | "intermedio" | "avanzado";

export interface Evaluacion {
  id: number;
  estudiante: number;
  estudiante_nombre?: string;
  competencia: number;
  competencia_nombre?: string;
  evaluador: number;
  evaluador_nombre?: string;
  tipo: TipoEvaluacion;
  semestre: string;
  puntaje: number | null;
  observaciones: string | null;
  nivel_alcanzado: NivelAlcanzado | null;
  fecha_creacion: string;
  fecha_calificacion: string | null;
}

export interface EvaluacionCreate {
  estudiante: number;
  competencia: number;
  tipo: TipoEvaluacion;
  evaluador?: number | null;
  semestre: string;
}

export interface EvaluacionCalificar {
  puntaje: number;
  nivel_alcanzado: NivelAlcanzado;
  observaciones?: string;
}
