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
  /**
   * Nombres de parámetro alineados con `EvidenciaFilter`
   * (apps/sigesi/views/core/evidencia_view.py): proyecto_id, usuario_id, tipo.
   */
  list: (params?: {
    proyecto_id?: number;
    usuario_id?: number;
    tipo?: string;
    search?: string;
  }) =>
    api
      .get<Avance[] | PaginatedResponse<Avance>>("/core/avances/", { params })
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Avance>(`/core/avances/${id}/`).then((r) => r.data),

  create: (data: AvanceCreate) => {
    const formData = new FormData();
    formData.append("actividad", String(data.actividad));
    formData.append("tipo", data.tipo);
    formData.append("titulo", data.titulo);
    formData.append("descripcion", data.descripcion);
    formData.append("archivo", data.archivo);
    return api
      .post<Avance>("/core/avances/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  update: (id: number, data: AvanceUpdate) =>
    api.patch<Avance>(`/core/avances/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/core/avances/${id}/`),

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
   * @param file    Archivo a subir (pdf, jpg, png, docx, xlsx; máx 20 MB)
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
