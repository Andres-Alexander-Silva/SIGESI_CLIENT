// src/services/planEstrategico.service.ts
import api from './api';
import {
  PlanEstrategico,
  PlanEstrategicoCreate,
  PlanEstrategicoFilters,
  CronogramaSemestral,
  CronogramaSemestralCreate,
  CronogramaFilters,
  ActividadCronograma,
  ActividadCronogramaCreate,
} from '@/types/planEstrategico';
import { PaginatedResponse } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizePE<T>(data: T[] | PaginatedResponse<T>): PaginatedResponse<T> {
  if (Array.isArray(data)) return { count: data.length, next: null, previous: null, results: data };
  return data as PaginatedResponse<T>;
}

function buildPEParams(filters: PlanEstrategicoFilters) {
  const p: Record<string, string> = {};
  if (filters.search)    p.search    = filters.search;
  if (filters.semillero) p.semillero = filters.semillero;
  if (filters.anio)      p.anio      = filters.anio;
  if (filters.estado)    p.estado    = filters.estado;
  if (filters.page)      p.page      = String(filters.page);
  return p;
}

function buildCronParams(filters: CronogramaFilters) {
  const p: Record<string, string> = {};
  if (filters.search)      p.search      = filters.search;
  if (filters.plan_accion) p.plan_accion = filters.plan_accion;
  if (filters.semillero)   p.semillero   = filters.semillero;
  if (filters.semestre)    p.semestre    = filters.semestre;
  if (filters.page)        p.page        = String(filters.page);
  return p;
}

// ─── Plan Estratégico ─────────────────────────────────────────────────────────
export const planEstrategicoService = {
  async list(filters: PlanEstrategicoFilters = {}): Promise<PaginatedResponse<PlanEstrategico>> {
    const { data } = await api.get<PlanEstrategico[] | PaginatedResponse<PlanEstrategico>>(
      '/core/plan-estrategico/',
      { params: buildPEParams(filters) },
    );
    return normalizePE(data);
  },

  async get(id: number): Promise<PlanEstrategico> {
    const { data } = await api.get<PlanEstrategico>(`/core/plan-estrategico/${id}/`);
    return data;
  },

  async create(payload: PlanEstrategicoCreate): Promise<PlanEstrategico> {
    const { data } = await api.post<PlanEstrategico>('/core/plan-estrategico/', payload);
    return data;
  },

  async update(id: number, payload: Partial<PlanEstrategicoCreate>): Promise<PlanEstrategico> {
    const { data } = await api.patch<PlanEstrategico>(`/core/plan-estrategico/${id}/`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/core/plan-estrategico/${id}/`);
  },

  async aprobar(id: number): Promise<PlanEstrategico> {
    const { data } = await api.post<PlanEstrategico>(`/core/plan-estrategico/${id}/aprobar/`);
    return data;
  },

  async rechazar(id: number): Promise<PlanEstrategico> {
    const { data } = await api.post<PlanEstrategico>(`/core/plan-estrategico/${id}/rechazar/`);
    return data;
  },
};

// ─── Cronograma Semestral ─────────────────────────────────────────────────────
export const cronogramaService = {
  async list(filters: CronogramaFilters = {}): Promise<PaginatedResponse<CronogramaSemestral>> {
    const { data } = await api.get<CronogramaSemestral[] | PaginatedResponse<CronogramaSemestral>>(
      '/core/cronograma/',
      { params: buildCronParams(filters) },
    );
    return normalizePE(data);
  },

  async get(id: number): Promise<CronogramaSemestral> {
    const { data } = await api.get<CronogramaSemestral>(`/core/cronograma/${id}/`);
    return data;
  },

  async create(payload: CronogramaSemestralCreate): Promise<CronogramaSemestral> {
    const { data } = await api.post<CronogramaSemestral>('/core/cronograma/', payload);
    return data;
  },

  async update(id: number, payload: Partial<CronogramaSemestralCreate>): Promise<CronogramaSemestral> {
    const { data } = await api.patch<CronogramaSemestral>(`/core/cronograma/${id}/`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/core/cronograma/${id}/`);
  },
};

// ─── Actividades de Cronograma ────────────────────────────────────────────────
export const actividadCronogramaService = {
  async list(cronogramaId?: number): Promise<ActividadCronograma[]> {
    const params: Record<string, string> = {};
    if (cronogramaId) params.cronograma = String(cronogramaId);
    const { data } = await api.get<ActividadCronograma[] | PaginatedResponse<ActividadCronograma>>(
      '/core/actividad-cronograma/',
      { params },
    );
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<ActividadCronograma>).results;
  },

  async create(payload: ActividadCronogramaCreate): Promise<ActividadCronograma> {
    const { data } = await api.post<ActividadCronograma>('/core/actividad-cronograma/', payload);
    return data;
  },

  async update(id: number, payload: Partial<ActividadCronogramaCreate>): Promise<ActividadCronograma> {
    const { data } = await api.patch<ActividadCronograma>(`/core/actividad-cronograma/${id}/`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/core/actividad-cronograma/${id}/`);
  },
};
