// src/services/reportes.service.ts
// Servicio de API para el módulo de Reportes — SIGESI
// Refactorizado para usar el cliente axios centralizado (api.ts)

import api from "./api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardIndicadores {
  scope: string;
  semestre: string;
  proyectos_activos: number;
  estudiantes_activos: number;
  produccion_academica: number;
  actividades_completadas: number;
  cumplimiento_semestral: number;
  evaluaciones_registradas: number;
}

export interface ReporteProyecto {
  id: number;
  titulo: string;
  codigo: string;
  estado:
    | "idea"
    | "propuesta"
    | "en_ejecucion"
    | "en_resultados"
    | "cerrado"
    | "cancelado";
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  director?: { id: number; username: string; nombre_completo: string };
  lider?: { id: number; username: string; nombre_completo: string };
  total_actividades: number;
  actividades_completadas: number;
  avance_global: number;
  cantidad_producciones: number;
  estudiantes_activos_count: number;
}

export interface ReporteSemillero {
  id: number;
  nombre: string;
  codigo: string;
  fecha_creacion: string;
  director?: { id: number; username: string; nombre_completo: string };
  total_proyectos: number;
  proyectos_activos: number;
  total_matriculas: number;
  total_producciones: number;
}

export interface Informe {
  id: number;
  titulo: string;
  tipo: "mensual" | "semestral" | "anual" | "especial";
  semestre: string;
  contenido?: string;
  archivo?: string | null;
  estado: "borrador" | "generado" | "revisado" | "aprobado";
  fecha_generacion: string;
  created_at: string;
  updated_at: string;
  semillero: number;
  generado_por?: number | null;
}

export interface InformeCreateInput {
  titulo: string;
  tipo: "mensual" | "semestral" | "anual" | "especial";
  semestre: string;
  semillero: number;
  estado?: "borrador" | "generado" | "revisado" | "aprobado";
}

export interface FiltrosReportes {
  semillero?: number | string;
  tipo?: string;
  semestre?: string;
  estado?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildParams(
  params: Record<string, string | number | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) result[k] = String(v);
  });
  return result;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const reportesService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  /** GET /core/dashboard/ — indicadores del dashboard */
  async getDashboard(params?: {
    semestre?: string;
    scope?: "administrador" | "grupo" | "semillero";
  }): Promise<DashboardIndicadores> {
    const { data } = await api.get<DashboardIndicadores>("/core/dashboard/", {
      params: buildParams({ semestre: params?.semestre, scope: params?.scope }),
    });
    return data;
  },

  // ── Reportes de proyectos ──────────────────────────────────────────────────

  /** GET /reportes/proyectos/ — reporte consolidado de proyectos */
  async getReporteProyectos(filtros?: {
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<ReporteProyecto>> {
    const { data } = await api.get<PaginatedResponse<ReporteProyecto>>(
      "/reportes/proyectos/",
      {
        params: buildParams({
          search: filtros?.search,
          ordering: filtros?.ordering,
          page: filtros?.page,
        }),
      },
    );
    return data;
  },

  // ── Reportes de semilleros ─────────────────────────────────────────────────

  /** GET /reportes/semilleros/ — reporte consolidado de semilleros */
  async getReporteSemilleros(filtros?: {
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<ReporteSemillero>> {
    const { data } = await api.get<PaginatedResponse<ReporteSemillero>>(
      "/reportes/semilleros/",
      {
        params: buildParams({ search: filtros?.search, page: filtros?.page }),
      },
    );
    return data;
  },

  // ── Informes ───────────────────────────────────────────────────────────────

  /** GET /reportes/ — lista de informes */
  async getInformes(
    filtros?: FiltrosReportes,
  ): Promise<PaginatedResponse<Informe>> {
    const { data } = await api.get<PaginatedResponse<Informe>>("/reportes/", {
      params: buildParams({
        semillero: filtros?.semillero,
        tipo: filtros?.tipo,
        semestre: filtros?.semestre,
        estado: filtros?.estado,
        search: filtros?.search,
        ordering: filtros?.ordering,
        page: filtros?.page,
      }),
    });
    return data;
  },

  /** GET /reportes/{id}/ — detalle de un informe */
  async getInforme(id: number): Promise<Informe> {
    const { data } = await api.get<Informe>(`/reportes/${id}/`);
    return data;
  },

  /**
   * URL para descarga autenticada del archivo de un informe.
   * GET /reportes/{id}/archive/download/
   *
   * Usar siempre con downloadFile() (utils/downloadFile.ts) — nunca el campo
   * `archivo` crudo como href: MEDIA solo se sirve directo en DEBUG (ver
   * config/urls.py en SIGESI_API), así que un enlace directo da 404 en
   * producción y además no manda el Bearer.
   */
  archiveDownloadUrl(id: number): string {
    return `/reportes/${id}/archive/download/`;
  },

  /** POST /reportes/ — crear informe */
  async createInforme(payload: InformeCreateInput): Promise<Informe> {
    const { data } = await api.post<Informe>("/reportes/", payload);
    return data;
  },

  /** POST /reportes/generar/ — generar informe automático */
  async generarInforme(payload: InformeCreateInput): Promise<Informe> {
    const { data } = await api.post<Informe>("/reportes/generar/", payload);
    return data;
  },

  /** PATCH /reportes/{id}/ — actualizar informe parcialmente */
  async updateInforme(
    id: number,
    payload: Partial<InformeCreateInput>,
  ): Promise<Informe> {
    const { data } = await api.patch<Informe>(`/reportes/${id}/`, payload);
    return data;
  },

  /** DELETE /reportes/{id}/ — eliminar informe */
  async deleteInforme(id: number): Promise<void> {
    await api.delete(`/reportes/${id}/`);
  },

  // ── Exportación de informes ────────────────────────────────────────────────

  /**
   * Descarga el Excel como blob vía axios (incluye token automáticamente).
   */
  async exportarExcel(filtros?: FiltrosReportes): Promise<void> {
    const response = await api.get("/reportes/exportar/", {
      params: buildParams({
        semillero: filtros?.semillero,
        tipo: filtros?.tipo,
        semestre: filtros?.semestre,
        estado: filtros?.estado,
        search: filtros?.search,
      }),
      responseType: "blob",
    });
    const blob = new Blob([response.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_semilleros_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export default reportesService;
