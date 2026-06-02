export interface IndicadoresActuales {
  proyectos_activos: number;
  proyectos_finalizados: number;
  semilleros_activos: number;
  produccion_academica: number;
  participacion_estudiantil: number;
  cumplimiento_semestral: number;
  evaluaciones_registradas: number;
  eventos_cientificos: number;
  convocatorias_activas: number;
  actividades_completadas: number;
}

export interface SemestreStats {
  semestre: string;
  proyectos_activos: number;
  produccion_academica: number;
  estudiantes_activos: number;
  actividades_completadas: number;
  cumplimiento_semestral: number;
  evaluaciones_registradas: number;
}

export interface AnaliticaFilters {
  semestre: string;
  semilleroId: number | '';
  grupoId: number | '';
  lineaId: number | '';
}
