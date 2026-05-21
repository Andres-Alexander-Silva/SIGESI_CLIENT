// src/services/actividades.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import {
  Actividad,
  ActividadCreate,
  Avance,
  AvanceCreate,
  AvanceUpdate,
} from "@/types/actividades";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Actividades
// ─────────────────────────────────────────────────────────────────────────────
export const actividadesService = {
  list: (params?: { proyecto?: number; estado?: string; search?: string }) =>
    api
      .get<Actividad[] | PaginatedResponse<Actividad>>("/core/actividades/", {
        params,
      })
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Actividad>(`/core/actividades/${id}/`).then((r) => r.data),

  create: (data: ActividadCreate) =>
    api.post<Actividad>("/core/actividades/", data).then((r) => r.data),

  update: (id: number, data: Partial<ActividadCreate>) =>
    api.patch<Actividad>(`/core/actividades/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/core/actividades/${id}/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Avances
// ─────────────────────────────────────────────────────────────────────────────
export const avancesService = {
  list: (params?: {
    actividad?: number;
    proyecto?: number;
    estudiante?: number;
    estado?: string;
    search?: string;
  }) =>
    api
      .get<Avance[] | PaginatedResponse<Avance>>("/core/avances/", { params })
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Avance>(`/core/avances/${id}/`).then((r) => r.data),

  create: (data: AvanceCreate) => {
    if (data.evidencia) {
      const formData = new FormData();
      formData.append("descripcion", data.descripcion);
      formData.append("fecha", data.fecha);
      formData.append("actividad", String(data.actividad));
      formData.append("evidencia", data.evidencia);
      if (data.estado) formData.append("estado", data.estado);
      return api
        .post<Avance>("/core/avances/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    }
    const payload = {
      descripcion: data.descripcion,
      fecha: data.fecha,
      actividad: data.actividad,
      estado: data.estado ?? "enviado",
    };
    return api.post<Avance>("/core/avances/", payload).then((r) => r.data);
  },

  update: (id: number, data: AvanceUpdate) =>
    api.patch<Avance>(`/core/avances/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/core/avances/${id}/`),

  aprobar: (id: number, observaciones?: string) =>
    api
      .patch<Avance>(`/core/avances/${id}/aprobar/`, { observaciones })
      .then((r) => r.data),

  rechazar: (id: number, observaciones: string) =>
    api
      .patch<Avance>(`/core/avances/${id}/rechazar/`, { observaciones })
      .then((r) => r.data),

  /**
   * URL para descarga autenticada del archivo adjunto de un avance.
   * GET /core/avances/{id}/archive/download/
   */
  archiveDownloadUrl: (id: number | string, field?: string): string => {
    const qs = field ? `?field=${encodeURIComponent(field)}` : "";
    return `/core/avances/${id}/archive/download/${qs}`;
  },

  /**
   * Sube o reemplaza el archivo adjunto de un avance.
   * PATCH /core/avances/{id}/archive/upload/
   * @param id      ID del avance
   * @param file    Archivo a subir (pdf, jpg, png, docx, xlsx; máx 5 MB)
   * @param payload Campos obligatorios del avance requeridos por el endpoint
   */
  archiveUpload: (
    id: number | string,
    file: File,
    payload: {
      actividad: number;
      tipo: "documento" | "acta" | "fotografia" | "video" | "otro";
      titulo: string;
      descripcion?: string;
    },
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("actividad", String(payload.actividad));
    formData.append("tipo", payload.tipo);
    formData.append("titulo", payload.titulo);
    if (payload.descripcion) formData.append("descripcion", payload.descripcion);
    formData.append("archivo", file);
    return api
      .patch(`/core/avances/${id}/archive/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => undefined);
  },
};

export default { actividadesService, avancesService };
