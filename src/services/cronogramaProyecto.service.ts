// src/services/cronogramaProyecto.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import {
  CronogramaProyecto,
  CronogramaProyectoCreate,
  CronogramaCumplimiento,
} from "@/types/core";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const cronogramaProyectoService = {
  list: (params?: { proyecto?: number; estado_actividad?: string }) =>
    api
      .get<CronogramaProyecto[] | PaginatedResponse<CronogramaProyecto>>(
        "/core/cronograma-proyecto/",
        { params },
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api
      .get<CronogramaProyecto>(`/core/cronograma-proyecto/${id}/`)
      .then((r) => r.data),

  create: (data: CronogramaProyectoCreate) => {
    // Si hay archivo, usar FormData
    if (data.archivo_cronograma instanceof File) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      return api
        .post<{ data: CronogramaProyecto }>(
          "/core/cronograma-proyecto/",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        )
        .then((r) => r.data.data ?? r.data);
    }
    return api
      .post<{ data: CronogramaProyecto }>("/core/cronograma-proyecto/", data)
      .then((r) => r.data.data ?? r.data);
  },

  update: (id: number, data: Partial<CronogramaProyectoCreate>) => {
    if (data.archivo_cronograma instanceof File) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      return api
        .patch<CronogramaProyecto>(
          `/core/cronograma-proyecto/${id}/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        )
        .then((r) => r.data);
    }
    return api
      .patch<CronogramaProyecto>(`/core/cronograma-proyecto/${id}/`, data)
      .then((r) => r.data);
  },

  remove: (id: number) => api.delete(`/core/cronograma-proyecto/${id}/`),

  /** GET /core/cronograma-proyecto/porcentaje-cumplimiento/?proyecto={id} */
  porcentajeCumplimiento: (proyectoId: number) =>
    api
      .get<CronogramaCumplimiento>(
        "/core/cronograma-proyecto/porcentaje-cumplimiento/",
        { params: { proyecto: proyectoId } },
      )
      .then((r) => r.data),
};
