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

  /**
   * Descarga autenticada del archivo adjunto de un cronograma.
   * GET /core/cronograma-proyecto/{id}/archive/download/
   * Devuelve la URL relativa lista para pasársela a downloadFile().
   */
  archiveDownloadUrl: (id: number, field?: string): string => {
    const qs = field ? `?field=${encodeURIComponent(field)}` : "";
    return `/core/cronograma-proyecto/${id}/archive/download/${qs}`;
  },

  /**
   * Sube o reemplaza el archivo adjunto de un cronograma.
   * PATCH /core/cronograma-proyecto/{id}/archive/upload/
   * @param id    ID del registro de cronograma
   * @param file  Archivo a subir (pdf, jpg, png, docx, xlsx; máx 5 MB)
   * @param data  Campos obligatorios del cronograma requeridos por el endpoint
   */
  archiveUpload: (
    id: number,
    file: File,
    data: {
      proyecto: number;
      actividad: string;
      descripcion_actividad: string;
      fecha_inicio: string;
      fecha_fin: string;
      fecha_entrega: string;
      estado_actividad?: string;
      observaciones?: string;
    },
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("proyecto", String(data.proyecto));
    formData.append("actividad", data.actividad);
    formData.append("descripcion_actividad", data.descripcion_actividad);
    formData.append("fecha_inicio", data.fecha_inicio);
    formData.append("fecha_fin", data.fecha_fin);
    formData.append("fecha_entrega", data.fecha_entrega);
    if (data.estado_actividad)
      formData.append("estado_actividad", data.estado_actividad);
    if (data.observaciones) formData.append("observaciones", data.observaciones);
    return api
      .patch(`/core/cronograma-proyecto/${id}/archive/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => undefined);
  },
};
