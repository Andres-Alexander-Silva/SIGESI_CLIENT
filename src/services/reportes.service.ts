// src/services/reportes.service.ts
// Servicio de API para el módulo de Reportes — SIGESI

const API_BASE = "https://sigesi-api.onrender.com/api/v1";

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
  tipo: "semestral" | "anual" | "especial";
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
  tipo: "semestral" | "anual" | "especial";
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

function buildHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) q.set(k, String(v));
  });
  const str = q.toString();
  return str ? `?${str}` : "";
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Error ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) msg = body.detail;
      else if (typeof body === "object") msg = JSON.stringify(body);
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const reportesService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  /** GET /core/dashboard/ — indicadores del dashboard */
  getDashboard(
    token: string,
    params?: {
      semestre?: string;
      scope?: "administrador" | "grupo" | "semillero";
    },
  ): Promise<DashboardIndicadores> {
    const q = buildQuery({ semestre: params?.semestre, scope: params?.scope });
    return fetch(`${API_BASE}/core/dashboard/${q}`, {
      headers: buildHeaders(token),
    }).then((r) => handleResponse<DashboardIndicadores>(r));
  },

  // ── Reportes de proyectos ──────────────────────────────────────────────────

  /** GET /reportes/proyectos/ — reporte consolidado de proyectos */
  getReporteProyectos(
    token: string,
    filtros?: { search?: string; ordering?: string; page?: number },
  ): Promise<PaginatedResponse<ReporteProyecto>> {
    const q = buildQuery({
      search: filtros?.search,
      ordering: filtros?.ordering,
      page: filtros?.page,
    });
    return fetch(`${API_BASE}/reportes/proyectos/${q}`, {
      headers: buildHeaders(token),
    }).then((r) => handleResponse<PaginatedResponse<ReporteProyecto>>(r));
  },

  // ── Reportes de semilleros ─────────────────────────────────────────────────

  /** GET /reportes/semilleros/ — reporte consolidado de semilleros */
  getReporteSemilleros(
    token: string,
    filtros?: { search?: string; page?: number },
  ): Promise<PaginatedResponse<ReporteSemillero>> {
    const q = buildQuery({ search: filtros?.search, page: filtros?.page });
    return fetch(`${API_BASE}/reportes/semilleros/${q}`, {
      headers: buildHeaders(token),
    }).then((r) => handleResponse<PaginatedResponse<ReporteSemillero>>(r));
  },

  // ── Informes ───────────────────────────────────────────────────────────────

  /** GET /reportes/ — lista de informes */
  getInformes(
    token: string,
    filtros?: FiltrosReportes,
  ): Promise<PaginatedResponse<Informe>> {
    const q = buildQuery({
      semillero: filtros?.semillero,
      tipo: filtros?.tipo,
      semestre: filtros?.semestre,
      estado: filtros?.estado,
      search: filtros?.search,
      ordering: filtros?.ordering,
      page: filtros?.page,
    });
    return fetch(`${API_BASE}/reportes/${q}`, {
      headers: buildHeaders(token),
    }).then((r) => handleResponse<PaginatedResponse<Informe>>(r));
  },

  /** GET /reportes/{id}/ — detalle de un informe */
  getInforme(token: string, id: number): Promise<Informe> {
    return fetch(`${API_BASE}/reportes/${id}/`, {
      headers: buildHeaders(token),
    }).then((r) => handleResponse<Informe>(r));
  },

  /** POST /reportes/ — crear informe */
  createInforme(token: string, data: InformeCreateInput): Promise<Informe> {
    return fetch(`${API_BASE}/reportes/`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Informe>(r));
  },

  /** POST /reportes/generar/ — generar informe automático */
  generarInforme(token: string, data: InformeCreateInput): Promise<Informe> {
    return fetch(`${API_BASE}/reportes/generar/`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Informe>(r));
  },

  /** PATCH /reportes/{id}/ — actualizar informe parcialmente */
  updateInforme(
    token: string,
    id: number,
    data: Partial<InformeCreateInput>,
  ): Promise<Informe> {
    return fetch(`${API_BASE}/reportes/${id}/`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Informe>(r));
  },

  /** DELETE /reportes/{id}/ — eliminar informe */
  deleteInforme(token: string, id: number): Promise<void> {
    return fetch(`${API_BASE}/reportes/${id}/`, {
      method: "DELETE",
      headers: buildHeaders(token),
    }).then((r) => {
      if (!r.ok) throw new Error(`Error ${r.status}: ${r.statusText}`);
    });
  },

  // ── Exportación ────────────────────────────────────────────────────────────

  /**
   * Construye la URL de exportación Excel para abrir en nueva pestaña.
   * GET /reportes/exportar/
   */
  getExportUrl(filtros?: FiltrosReportes): string {
    const q = buildQuery({
      semillero: filtros?.semillero,
      tipo: filtros?.tipo,
      semestre: filtros?.semestre,
      estado: filtros?.estado,
      search: filtros?.search,
    });
    return `${API_BASE}/reportes/exportar/${q}`;
  },

  /**
   * Descarga el Excel como blob (útil si el endpoint requiere auth en el header).
   */
  async exportarExcel(token: string, filtros?: FiltrosReportes): Promise<void> {
    const q = buildQuery({
      semillero: filtros?.semillero,
      tipo: filtros?.tipo,
      semestre: filtros?.semestre,
      estado: filtros?.estado,
      search: filtros?.search,
    });
    const res = await fetch(`${API_BASE}/reportes/exportar/${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Error al exportar: ${res.status}`);
    const blob = await res.blob();
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
