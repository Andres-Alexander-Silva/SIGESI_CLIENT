// src/types/formatos.ts

export type CategoriaFormato =
  | "planeacion"
  | "gestion"
  | "administrativos_y_academicos"
  | "mensual";

export type TipoVinculacionFormato = "catedratico" | "planta";

export interface FormatoInstitucional {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaFormato;
  categoria_display: string;
  archivo: string | null;
  tipo_vinculacion: TipoVinculacionFormato | null;
  tipo_vinculacion_display: string | null;
  version: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormatoInstitucionalCreate {
  slug: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaFormato;
  archivo: File;
  tipo_vinculacion?: TipoVinculacionFormato | null;
  version?: string;
  estado?: boolean;
}

export interface FormatoInstitucionalUpdate {
  nombre?: string;
  descripcion?: string;
  categoria?: CategoriaFormato;
  tipo_vinculacion?: TipoVinculacionFormato | null;
  version?: string;
  estado?: boolean;
}
