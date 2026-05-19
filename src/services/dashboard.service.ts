import api from "./api";

export interface DashboardApiStats {
  scope: string;
  semestre: string;
  proyectos_activos: number;
  estudiantes_activos: number;
  produccion_academica: number;
  actividades_completadas: number;
  cumplimiento_semestral: number;
  evaluaciones_registradas: number;
}

export type DashboardScope = "administrador" | "grupo" | "semillero";

// ─── Métricas por proyecto ─────────────────────────────────────────────────
export interface MetricaProyecto {
  id: number;
  titulo: string;
  codigo: string;
  estado: string;
  porcentaje_progreso: number;
  actividades_completadas: number;
  total_actividades: number;
  alertas: string[];
  estado_cronograma: "al_dia" | "atrasado" | "en_riesgo";
  fecha_fin_estimada?: string | null;
  director_nombre?: string;
  lider_nombre?: string;
}

export interface MetricasDashboardResponse {
  resumen: {
    total_proyectos: number;
    proyectos_al_dia: number;
    proyectos_atrasados: number;
    proyectos_en_riesgo: number;
  };
  proyectos: MetricaProyecto[];
}

export const dashboardService = {
  async getStats(
    scope?: DashboardScope,
    semestre?: string,
  ): Promise<DashboardApiStats> {
    const params: Record<string, string> = {};
    if (scope) params.scope = scope;
    if (semestre) params.semestre = semestre;
    const response = await api.get("/core/dashboard/", { params });
    return response.data;
  },

  async getMetricasProyectos(
    proyectoId?: number,
  ): Promise<MetricasDashboardResponse> {
    const params: Record<string, string> = {};
    if (proyectoId) params.proyecto = String(proyectoId);
    const response = await api.get("/core/proyectos/metricas-dashboard/", {
      params,
    });
    return response.data;
  },
};
