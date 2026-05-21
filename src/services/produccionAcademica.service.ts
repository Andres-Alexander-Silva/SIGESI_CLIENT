import api from './api';
import { ProduccionAcademica, ProduccionAcademicaCreate, ProduccionAcademicaFilters } from '@/types/produccionAcademica';
import { PaginatedResponse } from '@/types';

function buildParams(filters: ProduccionAcademicaFilters) {
  const params: Record<string, string> = {};
  if (filters.search)    params.search    = filters.search;
  if (filters.tipo)      params.tipo      = filters.tipo;
  if (filters.estado)    params.estado    = filters.estado;
  if (filters.proyecto)  params.proyecto  = filters.proyecto;
  if (filters.semillero) params.semillero = filters.semillero;
  if (filters.page)      params.page      = String(filters.page);
  return params;
}

export const produccionAcademicaService = {
  async list(filters: ProduccionAcademicaFilters = {}): Promise<PaginatedResponse<ProduccionAcademica>> {
    const { data } = await api.get<PaginatedResponse<ProduccionAcademica>>(
      '/core/producciones-academicas/',
      { params: buildParams(filters) },
    );
    return data;
  },

  async get(id: number): Promise<ProduccionAcademica> {
    const { data } = await api.get<ProduccionAcademica>(
      `/core/producciones-academicas/${id}/`,
    );
    return data;
  },

  async create(payload: ProduccionAcademicaCreate): Promise<ProduccionAcademica> {
    const { data } = await api.post<ProduccionAcademica>(
      '/core/producciones-academicas/',
      payload,
    );
    return data;
  },

  async update(id: number, payload: Partial<ProduccionAcademicaCreate>): Promise<ProduccionAcademica> {
    const { data } = await api.patch<ProduccionAcademica>(
      `/core/producciones-academicas/${id}/`,
      payload,
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/core/producciones-academicas/${id}/`);
  },

  async uploadArchivo(id: number, field: 'archivo' | 'certificado', file: File): Promise<ProduccionAcademica> {
    const form = new FormData();
    form.append(field, file);
    const { data } = await api.patch<ProduccionAcademica>(
      `/core/producciones-academicas/${id}/`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  /**
   * URL para descarga autenticada de archivo o certificado de una producción.
   * GET /core/producciones-academicas/{id}/archive/download/
   * @param field  'archivo' | 'certificado'  (opcional si el registro tiene uno solo)
   */
  archiveDownloadUrl(id: number, field?: 'archivo' | 'certificado'): string {
    const qs = field ? `?field=${encodeURIComponent(field)}` : '';
    return `/core/producciones-academicas/${id}/archive/download/${qs}`;
  },

  /**
   * Sube o reemplaza un archivo (archivo o certificado) de una producción académica.
   * PATCH /core/producciones-academicas/{id}/archive/upload/
   * @param id      ID de la producción
   * @param field   Campo de archivo: 'archivo' | 'certificado'
   * @param file    Archivo a subir (pdf, jpg, png, docx, xlsx; máx 5 MB)
   * @param payload Campos obligatorios de la producción requeridos por el endpoint
   */
  async archiveUpload(
    id: number,
    field: 'archivo' | 'certificado',
    file: File,
    payload: {
      titulo: string;
      tipo: string;
      semillero: number;
      autores: number[];
      proyecto?: number;
      linea_investigacion?: number;
      doi?: string;
      url_repositorio?: string;
      revista_evento?: string;
      fecha_publicacion?: string;
      estado?: string;
      descripcion?: string;
    },
  ): Promise<void> {
    const form = new FormData();
    form.append('file', file);
    form.append('field', field);
    form.append('titulo', payload.titulo);
    form.append('tipo', payload.tipo);
    form.append('semillero', String(payload.semillero));
    payload.autores.forEach((a) => form.append('autores', String(a)));
    if (payload.proyecto != null) form.append('proyecto', String(payload.proyecto));
    if (payload.linea_investigacion != null) form.append('linea_investigacion', String(payload.linea_investigacion));
    if (payload.doi) form.append('doi', payload.doi);
    if (payload.url_repositorio) form.append('url_repositorio', payload.url_repositorio);
    if (payload.revista_evento) form.append('revista_evento', payload.revista_evento);
    if (payload.fecha_publicacion) form.append('fecha_publicacion', payload.fecha_publicacion);
    if (payload.estado) form.append('estado', payload.estado);
    if (payload.descripcion) form.append('descripcion', payload.descripcion);
    await api.patch(
      `/core/producciones-academicas/${id}/archive/upload/?field=${encodeURIComponent(field)}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
