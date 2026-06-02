import api from "./api";
import { dashboardService, DashboardScope } from "./dashboard.service";
import { SemestreStats, IndicadoresActuales } from "@/types/analitica";

/** Genera los últimos N semestres en orden cronológico ascendente */
export function getLastNSemesters(n: number, desde?: string): string[] {
  const semesters: string[] = [];
  let year: number;
  let half: number;

  if (desde) {
    const [y, h] = desde.split("-").map(Number);
    year = y;
    half = h;
  } else {
    const now = new Date();
    year = now.getFullYear();
    half = now.getMonth() < 6 ? 1 : 2;
  }

  for (let i = 0; i < n; i++) {
    semesters.unshift(`${year}-${half}`);
    if (half === 1) {
      half = 2;
      year -= 1;
    } else {
      half = 1;
    }
  }
  return semesters;
}

export const analiticaService = {
  /** Indicadores principales del semestre actual (o el filtrado) */
  async getIndicadoresActuales(
    scope: DashboardScope,
    semestre: string,
    semilleroId?: number,
  ): Promise<IndicadoresActuales> {
    const [dashRes, extrasRes, semilleroRes] = await Promise.allSettled([
      dashboardService.getStats(scope, semestre),
      analiticaService.getExtras(),
      semilleroId
        ? api.get("/core/dashboard/indicadores/", {
            params: { semillero: semilleroId },
          })
        : Promise.resolve(null),
    ]);

    const dash =
      dashRes.status === "fulfilled"
        ? dashRes.value
        : {
            proyectos_activos: 0,
            estudiantes_activos: 0,
            produccion_academica: 0,
            actividades_completadas: 0,
            cumplimiento_semestral: 0,
            evaluaciones_registradas: 0,
          };

    const extras =
      extrasRes.status === "fulfilled"
        ? extrasRes.value
        : { semilleros_activos: 0, eventos_cientificos: 0, convocatorias_activas: 0, proyectos_finalizados: 0 };

    let proyectos_finalizados = extras.proyectos_finalizados;
    if (semilleroRes.status === "fulfilled" && semilleroRes.value !== null) {
      const d = semilleroRes.value.data?.data ?? semilleroRes.value.data;
      proyectos_finalizados = d?.proyectos_finalizados ?? proyectos_finalizados;
    }

    return {
      proyectos_activos: dash.proyectos_activos,
      proyectos_finalizados,
      semilleros_activos: extras.semilleros_activos,
      produccion_academica: dash.produccion_academica,
      participacion_estudiantil: dash.estudiantes_activos,
      cumplimiento_semestral: dash.cumplimiento_semestral,
      evaluaciones_registradas: dash.evaluaciones_registradas,
      eventos_cientificos: extras.eventos_cientificos,
      convocatorias_activas: extras.convocatorias_activas,
      actividades_completadas: dash.actividades_completadas,
    };
  },

  /** Métricas auxiliares obtenidas de listas paginadas */
  async getExtras(): Promise<{
    semilleros_activos: number;
    eventos_cientificos: number;
    convocatorias_activas: number;
    proyectos_finalizados: number;
  }> {
    const [semillerosRes, eventosRes, convocRes, proyFinRes] =
      await Promise.allSettled([
        api.get("/core/semilleros/", { params: { is_active: "true", page_size: 1 } }),
        api.get("/core/eventos/", { params: { page_size: 1 } }),
        api.get("/core/convocatorias/", { params: { estado: "activa", page_size: 1 } }),
        api.get("/core/proyectos/", { params: { estado: "finalizado", page_size: 1 } }),
      ]);

    return {
      semilleros_activos:
        semillerosRes.status === "fulfilled"
          ? (semillerosRes.value.data?.count ?? 0)
          : 0,
      eventos_cientificos:
        eventosRes.status === "fulfilled"
          ? (eventosRes.value.data?.count ?? 0)
          : 0,
      convocatorias_activas:
        convocRes.status === "fulfilled"
          ? (convocRes.value.data?.count ?? 0)
          : 0,
      proyectos_finalizados:
        proyFinRes.status === "fulfilled"
          ? (proyFinRes.value.data?.count ?? 0)
          : 0,
    };
  },

  /** Historial de indicadores para los últimos N semestres */
  async getHistorial(scope: DashboardScope, semestres: string[]): Promise<SemestreStats[]> {
    const results = await Promise.allSettled(
      semestres.map((s) => dashboardService.getStats(scope, s)),
    );

    return results.map((r, i) => {
      if (r.status === "fulfilled") {
        return {
          semestre: semestres[i],
          proyectos_activos: r.value.proyectos_activos,
          produccion_academica: r.value.produccion_academica,
          estudiantes_activos: r.value.estudiantes_activos,
          actividades_completadas: r.value.actividades_completadas,
          cumplimiento_semestral: r.value.cumplimiento_semestral,
          evaluaciones_registradas: r.value.evaluaciones_registradas,
        };
      }
      return {
        semestre: semestres[i],
        proyectos_activos: 0,
        produccion_academica: 0,
        estudiantes_activos: 0,
        actividades_completadas: 0,
        cumplimiento_semestral: 0,
        evaluaciones_registradas: 0,
      };
    });
  },
};
