// src/services/planAccion.service.ts
import api from './api';
import { PlanAccion, PlanAccionCreate, PlanAccionFilters } from '@/types/planAccion';
import { PaginatedResponse } from '@/types';

function buildParams(filters: PlanAccionFilters) {
  const params: Record<string, string> = {};
  if (filters.search)    params.search    = filters.search;
  if (filters.semillero) params.semillero = filters.semillero;
  if (filters.semestre)  params.semestre  = filters.semestre;
  if (filters.page)      params.page      = String(filters.page);
  return params;
}

export const planAccionService = {
  async list(filters: PlanAccionFilters = {}): Promise<PaginatedResponse<PlanAccion>> {
    const { data } = await api.get<PlanAccion[] | PaginatedResponse<PlanAccion>>(
      '/core/plan-accion/',
      { params: buildParams(filters) },
    );
    // El endpoint puede devolver array o paginado
    if (Array.isArray(data)) {
      return { count: data.length, next: null, previous: null, results: data };
    }
    return data as PaginatedResponse<PlanAccion>;
  },

  async get(id: number): Promise<PlanAccion> {
    const { data } = await api.get<PlanAccion>(`/core/plan-accion/${id}/`);
    return data;
  },

  async create(payload: PlanAccionCreate): Promise<PlanAccion> {
    const { data } = await api.post<PlanAccion>('/core/plan-accion/', payload);
    return data;
  },

  async update(id: number, payload: Partial<PlanAccionCreate>): Promise<PlanAccion> {
    const { data } = await api.patch<PlanAccion>(`/core/plan-accion/${id}/`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/core/plan-accion/${id}/`);
  },

  async aprobar(id: number): Promise<PlanAccion> {
    const { data } = await api.post<PlanAccion>(`/core/plan-accion/${id}/aprobar/`);
    return data;
  },

  async rechazar(id: number): Promise<PlanAccion> {
    const { data } = await api.post<PlanAccion>(`/core/plan-accion/${id}/rechazar/`);
    return data;
  },
};
