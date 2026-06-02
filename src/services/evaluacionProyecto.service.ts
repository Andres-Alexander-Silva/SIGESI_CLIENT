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
        "/core/evaluaciones-proyecto/",
        { params },
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api
      .get<EvaluacionProyecto>(`/core/evaluaciones-proyecto/${id}/`)
      .then((r) => r.data),

  create: (data: EvaluacionProyectoCreate) =>
    api
      .post<EvaluacionProyecto>("/core/evaluaciones-proyecto/", data)
      .then((r) => r.data),

  update: (id: number, data: Partial<EvaluacionProyectoCreate>) =>
    api
      .patch<EvaluacionProyecto>(`/core/evaluaciones-proyecto/${id}/`, data)
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/core/evaluaciones-proyecto/${id}/`),
};
