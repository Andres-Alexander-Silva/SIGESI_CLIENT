// src/services/formatos.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import {
  FormatoInstitucional,
  FormatoInstitucionalCreate,
  FormatoInstitucionalUpdate,
} from "@/types/formatos";

const BASE = "/informes/formatos-institucionales/";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const formatosService = {
  list: (params?: { categoria?: string; tipo_vinculacion?: string; estado?: boolean; search?: string }) =>
    api
      .get<FormatoInstitucional[] | PaginatedResponse<FormatoInstitucional>>(BASE, { params })
      .then((r) => extractList(r.data)),

  get: (slug: string) =>
    api.get<FormatoInstitucional>(`${BASE}${slug}/`).then((r) => r.data),

  create: (data: FormatoInstitucionalCreate) => {
    const formData = new FormData();
    formData.append("slug", data.slug);
    formData.append("nombre", data.nombre);
    if (data.descripcion) formData.append("descripcion", data.descripcion);
    formData.append("categoria", data.categoria);
    formData.append("archivo", data.archivo);
    if (data.tipo_vinculacion) formData.append("tipo_vinculacion", data.tipo_vinculacion);
    if (data.version) formData.append("version", data.version);
    if (data.estado !== undefined) formData.append("estado", String(data.estado));
    return api
      .post<FormatoInstitucional>(BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  update: (slug: string, data: FormatoInstitucionalUpdate) =>
    api.patch<FormatoInstitucional>(`${BASE}${slug}/`, data).then((r) => r.data),

  remove: (slug: string) => api.delete(`${BASE}${slug}/`),

  /**
   * URL para descarga autenticada de un formato individual.
   * GET /informes/formatos-institucionales/{slug}/archive/download/
   */
  archiveDownloadUrl: (slug: string): string => `${BASE}${slug}/archive/download/`,

  /**
   * Sube o reemplaza el archivo de un formato existente.
   * PATCH /informes/formatos-institucionales/{slug}/archive/upload/
   */
  archiveUpload: (slug: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .patch(`${BASE}${slug}/archive/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => undefined);
  },

  /**
   * URL de descarga del paquete .zip "todos mis formatos" según el tipo de
   * vinculación del usuario indicado.
   * GET /informes/formularios-docente/?user={userId}
   */
  bulkDownloadUrl: (userId: number): string =>
    `/informes/formularios-docente/?user=${userId}`,
};

export default formatosService;
