// src/services/perfilInvestigativo.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import { PerfilInvestigativo, PerfilInvestigativoCreate } from "@/types/perfilInvestigativo";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const perfilInvestigativoService = {
  list: (params?: { estudiante?: number; search?: string }) =>
    api
      .get<PerfilInvestigativo[] | PaginatedResponse<PerfilInvestigativo>>(
        "/core/perfiles-investigativos/",
        { params },
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api
      .get<PerfilInvestigativo>(`/core/perfiles-investigativos/${id}/`)
      .then((r) => r.data),

  create: (data: PerfilInvestigativoCreate) =>
    api
      .post<PerfilInvestigativo>("/core/perfiles-investigativos/", data)
      .then((r) => r.data),

  update: (id: number, data: Partial<PerfilInvestigativoCreate>) =>
    api
      .patch<PerfilInvestigativo>(`/core/perfiles-investigativos/${id}/`, data)
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/core/perfiles-investigativos/${id}/`),
};

export default perfilInvestigativoService;
