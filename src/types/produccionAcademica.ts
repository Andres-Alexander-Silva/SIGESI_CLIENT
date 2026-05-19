// src/types/produccionAcademica.ts

export type TipoProduccion =
  | 'articulo'
  | 'ponencia'
  | 'poster'
  | 'capitulo_libro'
  | 'software'
  | 'prototipo'
  | 'trabajo_grado'
  | 'otro';

export type EstadoProduccion =
  | 'en_elaboracion'
  | 'enviado'
  | 'en_revision'
  | 'aceptado'
  | 'publicado'
  | 'rechazado';

export interface ProduccionAcademica {
  id: number;
  titulo: string;
  tipo: TipoProduccion;
  tipo_display: string;
  descripcion?: string;
  proyecto?: number | null;
  proyecto_titulo?: string;
  semillero: number;
  semillero_nombre: string;
  linea_investigacion?: number | null;
  linea_investigacion_nombre?: string;
  autores: number[];
  autores_nombres?: string;
  doi?: string;
  url_repositorio?: string;
  revista_evento?: string;
  fecha_publicacion?: string | null;
  estado: EstadoProduccion;
  estado_display: string;
  archivo?: string | null;
  certificado?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProduccionAcademicaCreate {
  titulo: string;
  tipo: TipoProduccion;
  descripcion?: string;
  proyecto: number;
  semillero: number;
  linea_investigacion?: number | null;
  autores: number[];
  doi?: string;
  url_repositorio?: string;
  revista_evento?: string;
  fecha_publicacion?: string | null;
  estado?: EstadoProduccion;
}

export interface ProduccionAcademicaFilters {
  search?: string;
  tipo?: string;
  estado?: string;
  proyecto?: string;
  semillero?: string;
  page?: number;
}

export const TIPO_LABELS: Record<TipoProduccion, string> = {
  articulo:       'Artículo',
  ponencia:       'Ponencia',
  poster:         'Póster',
  capitulo_libro: 'Capítulo de libro',
  software:       'Software',
  prototipo:      'Prototipo',
  trabajo_grado:  'Trabajo de grado',
  otro:           'Otro',
};

export const ESTADO_LABELS: Record<EstadoProduccion, string> = {
  en_elaboracion: 'En elaboración',
  enviado:        'Enviado',
  en_revision:    'En revisión',
  aceptado:       'Aceptado',
  publicado:      'Publicado',
  rechazado:      'Rechazado',
};

export const ESTADO_COLORS: Record<
  EstadoProduccion,
  { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }
> = {
  en_elaboracion: { color: 'default' },
  enviado:        { color: 'info' },
  en_revision:    { color: 'warning' },
  aceptado:       { color: 'success' },
  publicado:      { color: 'success' },
  rechazado:      { color: 'error' },
};
