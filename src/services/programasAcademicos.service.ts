// src/services/programasAcademicos.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import { ProgramaAcademico, ProgramaAcademicoCreate } from "@/types/core";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const programasAcademicosService = {
  list: () =>
    api
      .get<ProgramaAcademico[] | PaginatedResponse<ProgramaAcademico>>(
        "/core/programas-academicos/",
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api
      .get<ProgramaAcademico>(`/core/programas-academicos/${id}/`)
      .then((r) => r.data),

  create: (data: ProgramaAcademicoCreate) =>
    api
      .post<ProgramaAcademico>("/core/programas-academicos/", data)
      .then((r) => r.data),

  update: (id: number, data: Partial<ProgramaAcademicoCreate>) =>
    api
      .patch<ProgramaAcademico>(`/core/programas-academicos/${id}/`, data)
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/core/programas-academicos/${id}/`),
};
