// src/types/competencias.ts

export type NivelCompetencia = "basico" | "intermedio" | "avanzado";

export interface CompetenciaInvestigativa {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: NivelCompetencia;
  /** Indicadores de logro (texto). Requerido por el backend. */
  indicadores: string;
  /** En lectura el backend embebe el objeto del semillero (no solo el id). */
  semillero: { id: number; nombre: string };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetenciaInvestigativaCreate {
  nombre: string;
  descripcion: string;
  nivel: NivelCompetencia;
  /** Indicadores de logro (texto). Requerido por el backend. */
  indicadores: string;
  semillero: number;
  is_active?: boolean;
}

export interface CompetenciaDashboard {
  promedio_puntaje: number | null;
  total_evaluaciones: number;
}
