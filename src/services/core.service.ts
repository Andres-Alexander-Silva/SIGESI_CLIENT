import api from "./api";
import { PaginatedResponse } from "@/types";
import {
  Semillero,
  SemilleroCreate,
  SemilleroAval,
  Proyecto,
  ProyectoCreate,
  ProyectoChangeState,
  LineaInvestigacion,
  LineaInvestigacionCreate,
  GrupoInvestigacion,
  GrupoInvestigacionCreate,
} from "@/types/core";

function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const lineasService = {
  list: () =>
    api
      .get<
        LineaInvestigacion[] | PaginatedResponse<LineaInvestigacion>
      >("/core/lineas-investigacion/")
      .then((r) => extractList(r.data)),
  create: (data: LineaInvestigacionCreate) =>
    api
      .post<LineaInvestigacion>("/core/lineas-investigacion/", data)
      .then((r) => r.data),
  update: (id: number, data: Partial<LineaInvestigacionCreate>) =>
    api
      .patch<LineaInvestigacion>(`/core/lineas-investigacion/${id}/`, data)
      .then((r) => r.data),
  remove: (id: number) => api.delete(`/core/lineas-investigacion/${id}/`),
};

export const gruposService = {
  list: () =>
    api
      .get<
        GrupoInvestigacion[] | PaginatedResponse<GrupoInvestigacion>
      >("/core/grupos-investigacion/")
      .then((r) => extractList(r.data)),
  create: (data: GrupoInvestigacionCreate) =>
    api
      .post<GrupoInvestigacion>("/core/grupos-investigacion/", data)
      .then((r) => r.data),
  update: (id: number, data: Partial<GrupoInvestigacionCreate>) =>
    api
      .patch<GrupoInvestigacion>(`/core/grupos-investigacion/${id}/`, data)
      .then((r) => r.data),
  remove: (id: number) => api.delete(`/core/grupos-investigacion/${id}/`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Semilleros
// ─────────────────────────────────────────────────────────────────────────────
export const semillerosService = {
  list: () =>
    api
      .get<Semillero[] | PaginatedResponse<Semillero>>("/core/semilleros/")
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Semillero>(`/core/semilleros/${id}/`).then((r) => r.data),

  create: (data: SemilleroCreate) =>
    api.post<Semillero>("/core/semilleros/", data).then((r) => r.data),

  update: (id: number, data: Partial<SemilleroCreate>) =>
    api.patch<Semillero>(`/core/semilleros/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/core/semilleros/${id}/`),

  getAval: (id: number) =>
    api.get<SemilleroAval>(`/core/semilleros/${id}/aval/`).then((r) => r.data),

  updateAval: (id: number, data: SemilleroAval, archivoAval?: File) => {
    const formData = new FormData();
    // Campos de texto — solo se envían si tienen valor
    if (data.estado_aval) formData.append("estado_aval", data.estado_aval);
    if (data.tipo_documento)
      formData.append("tipo_documento", data.tipo_documento);
    if (data.numero_acta) formData.append("numero_acta", data.numero_acta);
    if (data.observaciones)
      formData.append("observaciones", data.observaciones);
    if (data.fecha_aprobacion)
      formData.append("fecha_aprobacion", data.fecha_aprobacion);
    // Archivo (opcional)
    if (archivoAval) formData.append("archivo_aval", archivoAval);
    return api
      .patch<SemilleroAval>(`/core/semilleros/${id}/aval/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  /**
   * URL para descarga autenticada del archivo del aval.
   * GET /core/semilleros/{id}/aval/download/
   */
  avalDownloadUrl: (id: number): string =>
    `/core/semilleros/${id}/aval/download/`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Proyectos
// ─────────────────────────────────────────────────────────────────────────────
export const proyectosService = {
  list: () =>
    api
      .get<Proyecto[] | PaginatedResponse<Proyecto>>("/core/proyectos/")
      .then((r) => extractList(r.data)),

  get: (id: number) =>
    api.get<Proyecto>(`/core/proyectos/${id}/`).then((r) => r.data),

  create: (data: ProyectoCreate) =>
    api.post<Proyecto>("/core/proyectos/", data).then((r) => r.data),

  update: (id: number, data: Partial<ProyectoCreate>) =>
    api.patch<Proyecto>(`/core/proyectos/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/core/proyectos/${id}/`),

  changeState: (id: number, data: ProyectoChangeState) =>
    api
      .patch<Proyecto>(`/core/proyectos/${id}/change_state/`, data)
      .then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────────────────────
// INSCRIPCIONES (Nuevo)
// ─────────────────────────────────────────────────────────────────────────────
export const inscripcionesService = {
  // Crear inscripción (unirse a semillero)
  create: (data: {
    semillero: number;
    semestre: string;
    estudiante?: number;
  }) => api.post("/core/inscripciones/", data).then((r) => r.data),

  // Listar inscripciones (según rol del usuario)
  list: (params?: { semillero_id?: number }) =>
    api.get("/core/inscripciones/", { params }).then((r) => r.data),

  // Retirar inscripción (DELETE lógico)
  remove: (id: number) =>
    api.delete(`/core/inscripciones/${id}/`).then((r) => r.data),
};

export default {
  semillerosService,
  proyectosService,
  inscripcionesService,
  lineasService,
  gruposService,
};

