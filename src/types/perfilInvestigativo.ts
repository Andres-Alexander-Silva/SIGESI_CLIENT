// src/types/perfilInvestigativo.ts

export interface PerfilEstudianteNested {
  id: number;
  username: string;
  email: string | null;
  correo_personal: string;
  first_name: string;
  last_name: string;
  cedula: string;
  telefono?: string;
  foto?: string | null;
  roles: string[];
  codigo_estudiantil?: string;
  programa_academico?: number | null;
  is_active: boolean;
  is_graduated: boolean;
}

export interface PerfilInvestigativo {
  id: number;
  estudiante: PerfilEstudianteNested;
  resumen: string;
  fortalezas: string;
  areas_mejora: string;
  created_at: string;
  updated_at: string;
}

export interface PerfilInvestigativoCreate {
  estudiante: number;
  resumen?: string;
  fortalezas?: string;
  areas_mejora?: string;
}
