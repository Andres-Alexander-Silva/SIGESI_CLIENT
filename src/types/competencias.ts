// src/types/competencias.ts

export type NivelCompetencia = "basico" | "intermedio" | "avanzado";

export interface CompetenciaInvestigativa {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: NivelCompetencia;
  semillero: number;
  semillero_nombre?: string;
  is_active: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CompetenciaInvestigativaCreate {
  nombre: string;
  descripcion: string;
  nivel: NivelCompetencia;
  semillero: number;
  is_active?: boolean;
}

export interface CompetenciaDashboard {
  promedio_puntaje: number | null;
  total_evaluaciones: number;
}
