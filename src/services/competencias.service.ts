// src/services/competencias.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import {
  CompetenciaInvestigativa,
  CompetenciaInvestigativaCreate,
  CompetenciaDashboard,
} from "@/types/competencias";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const competenciasService = {
  list: (params?: {
    semillero?: number;
    nivel?: string;
    is_active?: boolean;
    search?: string;
  }) =>
    api
      .get<
        CompetenciaInvestigativa[] | PaginatedResponse<CompetenciaInvestigativa>
      >("/core/competencias-investigativas/", { params })
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api
      .get<CompetenciaInvestigativa>(`/core/competencias-investigativas/${id}/`)
      .then((r) => r.data),

  create: (data: CompetenciaInvestigativaCreate) =>
    api
      .post<CompetenciaInvestigativa>("/core/competencias-investigativas/", data)
      .then((r) => r.data),

  update: (id: number, data: Partial<CompetenciaInvestigativaCreate>) =>
    api
      .patch<CompetenciaInvestigativa>(
        `/core/competencias-investigativas/${id}/`,
        data,
      )
      .then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/core/competencias-investigativas/${id}/`),

  dashboard: (id: number) =>
    api
      .get<CompetenciaDashboard>(
        `/core/competencias-investigativas/${id}/dashboard/`,
      )
      .then((r) => r.data),
};

export default competenciasService;
