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
} from "@/types/convocatorias";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

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
// Participaciones en Evento
// ─────────────────────────────────────────────────────────────────────────────
export const participacionesEventoService = {
  list: (params?: { evento?: number; participante?: number }) =>
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

  remove: (id: number) =>
    api.delete(`/core/participaciones-evento/${id}/`),
};

export default {
  convocatoriasService,
  eventosService,
  participacionesEventoService,
};
