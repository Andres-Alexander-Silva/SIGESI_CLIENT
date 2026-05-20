// src/services/evaluacionProyecto.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import { EvaluacionProyecto, EvaluacionProyectoCreate } from "@/types/core";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const evaluacionProyectoService = {
  list: (params?: {
    proyecto_id?: number;
    evaluador_id?: number;
    estado_proyecto?: string;
    search?: string;
    ordering?: string;
  }) =>
    api
      .get<EvaluacionProyecto[] | PaginatedResponse<EvaluacionProyecto>>(
        "/core/evaluaciones/",
        { params },
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api
      .get<EvaluacionProyecto>(`/core/evaluaciones/${id}/`)
      .then((r) => r.data),

  create: (data: EvaluacionProyectoCreate) =>
    api
      .post<EvaluacionProyecto>("/core/evaluaciones/", data)
      .then((r) => r.data),

  update: (id: number, data: Partial<EvaluacionProyectoCreate>) =>
    api
      .patch<EvaluacionProyecto>(`/core/evaluaciones/${id}/`, data)
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/core/evaluaciones/${id}/`),
};
