import api from './api';
import { ProduccionAcademica, ProduccionAcademicaCreate, ProduccionAcademicaFilters } from '@/types/produccionAcademica';
import { PaginatedResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const tokens = JSON.parse(localStorage.getItem('auth_tokens') ?? '{}');
  return tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {};
}

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
      `${BASE_URL}core/producciones-academicas/`,
      { headers: getAuthHeaders(), params: buildParams(filters) },
    );
    return data;
  },

  async get(id: number): Promise<ProduccionAcademica> {
    const { data } = await api.get<ProduccionAcademica>(
      `${BASE_URL}core/producciones-academicas/${id}/`,
      { headers: getAuthHeaders() },
    );
    return data;
  },

  async create(payload: ProduccionAcademicaCreate): Promise<ProduccionAcademica> {
    const { data } = await api.post<ProduccionAcademica>(
      `${BASE_URL}core/producciones-academicas/`,
      payload,
      { headers: getAuthHeaders() },
    );
    return data;
  },

  async update(id: number, payload: Partial<ProduccionAcademicaCreate>): Promise<ProduccionAcademica> {
    const { data } = await api.patch<ProduccionAcademica>(
      `${BASE_URL}core/producciones-academicas/${id}/`,
      payload,
      { headers: getAuthHeaders() },
    );
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(
      `${BASE_URL}core/producciones-academicas/${id}/`,
      { headers: getAuthHeaders() },
    );
  },

  async uploadArchivo(id: number, field: 'archivo' | 'certificado', file: File): Promise<ProduccionAcademica> {
    const form = new FormData();
    form.append(field, file);
    const { data } = await api.patch<ProduccionAcademica>(
      `${BASE_URL}core/producciones-academicas/${id}/`,
      form,
      { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },
};
