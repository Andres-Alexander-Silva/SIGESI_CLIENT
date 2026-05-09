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
    // Si hay evidencia, usar FormData (multipart)
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

  // Acción especial: aprobar
  aprobar: (id: number, observaciones?: string) =>
    api
      .patch<Avance>(`/core/avances/${id}/aprobar/`, { observaciones })
      .then((r) => r.data),

  // Acción especial: rechazar
  rechazar: (id: number, observaciones: string) =>
    api
      .patch<Avance>(`/core/avances/${id}/rechazar/`, { observaciones })
      .then((r) => r.data),
};

export default { actividadesService, avancesService };
