// src/services/evaluaciones.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import {
  Evaluacion,
  EvaluacionCreate,
  EvaluacionCalificar,
} from "@/types/evaluaciones";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const evaluacionesService = {
  list: (params?: {
    estudiante?: number;
    competencia?: number;
    tipo?: string;
    semestre?: string;
    search?: string;
  }) =>
    api
      .get<Evaluacion[] | PaginatedResponse<Evaluacion>>(
        "/core/evaluaciones/",
        { params },
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Evaluacion>(`/core/evaluaciones/${id}/`).then((r) => r.data),

  create: (data: EvaluacionCreate) =>
    api.post<Evaluacion>("/core/evaluaciones/", data).then((r) => r.data),

  update: (id: number, data: Partial<EvaluacionCreate>) =>
    api
      .patch<Evaluacion>(`/core/evaluaciones/${id}/`, data)
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/core/evaluaciones/${id}/`),

  calificar: (id: number, data: EvaluacionCalificar) =>
    api
      .post<Evaluacion>(`/core/evaluaciones/${id}/calificar/`, data)
      .then((r) => r.data),
};

export default evaluacionesService;
