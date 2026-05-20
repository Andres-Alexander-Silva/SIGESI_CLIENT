// src/services/export.service.ts
// Servicio para los 6 endpoints de exportación xlsx: /reportes/exportar/*

import api from "./api";

/** Helper genérico para descargar un blob xlsx */
async function downloadXlsx(
  url: string,
  filename: string,
  params?: Record<string, string | number | undefined>,
): Promise<void> {
  const cleanParams: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) cleanParams[k] = String(v);
    });
  }

  const response = await api.get(url, {
    params: cleanParams,
    responseType: "blob",
  });

  const blob = new Blob([response.data]);
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export const exportService = {
  /** Exportar estudiantes — GET /reportes/exportar/estudiantes/ */
  estudiantes: (params?: { semillero?: number; proyecto?: number }) =>
    downloadXlsx("/reportes/exportar/estudiantes/", "estudiantes", params),

  /** Exportar proyectos — GET /reportes/exportar/proyectos/ */
  proyectos: (params?: {
    semillero?: number;
    linea_investigacion?: number;
    grupo_investigacion?: number;
  }) => downloadXlsx("/reportes/exportar/proyectos/", "proyectos", params),

  /** Exportar avances (evidencias) — GET /reportes/exportar/avances/ */
  avances: (params?: {
    semillero?: number;
    proyecto?: number;
    user?: number;
    actividad?: number;
  }) => downloadXlsx("/reportes/exportar/avances/", "avances", params),

  /** Exportar producciones académicas — GET /reportes/exportar/producciones-academicas/ */
  produccionesAcademicas: (params?: {
    proyecto?: number;
    semillero?: number;
    linea_investigacion?: number;
    grupo_investigacion?: number;
    user?: number;
  }) =>
    downloadXlsx(
      "/reportes/exportar/producciones-academicas/",
      "producciones_academicas",
      params,
    ),

  /** Exportar actividades — GET /reportes/exportar/actividades/ */
  actividades: (params?: {
    user?: number;
    proyecto?: number;
    semillero?: number;
  }) => downloadXlsx("/reportes/exportar/actividades/", "actividades", params),

  /** Exportar indicadores — GET /reportes/exportar/indicadores/ */
  indicadores: (params?: { semillero?: number }) =>
    downloadXlsx("/reportes/exportar/indicadores/", "indicadores", params),
};
