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

export const dashboardService = {
  /**
   * Obtiene los indicadores del dashboard desde el endpoint real.
   * @param scope  'administrador' | 'grupo' | 'semillero'
   * @param semestre  Formato 'YYYY-1' o 'YYYY-2'. Si se omite, la API usa el vigente.
   */
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
};
