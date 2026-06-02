// src/services/convocatorias.service.ts
import api from "./api";
import { PaginatedResponse } from "@/types";
import {
  Convocatoria,
  ConvocatoriaCreate,
  Evento,
  EventoCreate,
  ParticipacionEvento,
  ParticipacionEventoCreate,
  Postulacion,
  PostulacionCreate,
} from "@/types/convocatorias";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Eventos
// ─────────────────────────────────────────────────────────────────────────────
export const eventosService = {
  list: (params?: { estado?: string; modalidad?: string; search?: string }) =>
    api
      .get<Evento[] | PaginatedResponse<Evento>>("/core/eventos/", { params })
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Evento>(`/core/eventos/${id}/`).then((r) => r.data),

  create: (data: EventoCreate) =>
    api.post<Evento>("/core/eventos/", data).then((r) => r.data),

  update: (id: number, data: Partial<EventoCreate>) =>
    api.patch<Evento>(`/core/eventos/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/core/eventos/${id}/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Convocatorias
// ─────────────────────────────────────────────────────────────────────────────
export const convocatoriasService = {
  list: (params?: {
    evento?: number;
    estado?: string;
    tipo?: string;
    search?: string;
  }) =>
    api
      .get<Convocatoria[] | PaginatedResponse<Convocatoria>>(
        "/core/convocatorias/",
        { params },
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Convocatoria>(`/core/convocatorias/${id}/`).then((r) => r.data),

  create: (data: ConvocatoriaCreate) =>
    api.post<Convocatoria>("/core/convocatorias/", data).then((r) => r.data),

  update: (id: number, data: Partial<ConvocatoriaCreate>) =>
    api
      .patch<Convocatoria>(`/core/convocatorias/${id}/`, data)
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/core/convocatorias/${id}/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Postulaciones
// ─────────────────────────────────────────────────────────────────────────────
export const postulacionesService = {
  list: (params?: {
    convocatoria?: number;
    semillero?: number;
    estado?: string;
    search?: string;
  }) =>
    api
      .get<Postulacion[] | PaginatedResponse<Postulacion>>(
        "/core/postulaciones/",
        { params },
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Postulacion>(`/core/postulaciones/${id}/`).then((r) => r.data),

  create: (data: PostulacionCreate) =>
    api.post<Postulacion>("/core/postulaciones/", data).then((r) => r.data),

  update: (id: number, data: Partial<PostulacionCreate>) =>
    api
      .patch<Postulacion>(`/core/postulaciones/${id}/`, data)
      .then((r) => r.data),

  remove: (id: number) => api.delete(`/core/postulaciones/${id}/`),

  aprobar: (id: number, resultado?: string) =>
    api
      .post<Postulacion>(`/core/postulaciones/${id}/aprobar/`, { resultado })
      .then((r) => r.data),

  rechazar: (id: number, resultado?: string) =>
    api
      .post<Postulacion>(`/core/postulaciones/${id}/rechazar/`, { resultado })
      .then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// Participaciones en Evento
// ─────────────────────────────────────────────────────────────────────────────
export const participacionesEventoService = {
  list: (params?: {
    evento?: number;
    participante?: number;
    tipo_participacion?: string;
    search?: string;
  }) =>
    api
      .get<ParticipacionEvento[] | PaginatedResponse<ParticipacionEvento>>(
        "/core/participaciones-evento/",
        { params },
      )
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api
      .get<ParticipacionEvento>(`/core/participaciones-evento/${id}/`)
      .then((r) => r.data),

  create: (data: ParticipacionEventoCreate) =>
    api
      .post<ParticipacionEvento>("/core/participaciones-evento/", data)
      .then((r) => r.data),

  update: (id: number, data: Partial<ParticipacionEventoCreate>) =>
    api
      .patch<ParticipacionEvento>(
        `/core/participaciones-evento/${id}/`,
        data,
      )
      .then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/core/participaciones-evento/${id}/`),

  cargarCertificado: (
    id: number,
    certificado: File,
    tipo_participacion: string,
  ) => {
    const fd = new FormData();
    fd.append("certificado", certificado);
    fd.append("tipo_participacion", tipo_participacion);
    return api
      .post<ParticipacionEvento>(
        `/core/participaciones-evento/${id}/cargar-certificado/`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then((r) => r.data);
  },

  descargarCertificadoUrl: (id: number) =>
    `/core/participaciones-evento/${id}/archive/download/`,
};

export default {
  eventosService,
  convocatoriasService,
  postulacionesService,
  participacionesEventoService,
};
