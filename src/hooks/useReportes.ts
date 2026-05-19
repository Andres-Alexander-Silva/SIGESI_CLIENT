import { useState, useEffect, useCallback, useRef } from "react";
import reportesService, {
  DashboardIndicadores,
  FiltrosReportes,
  Informe,
  InformeCreateInput,
  PaginatedResponse,
  ReporteProyecto,
  ReporteSemillero,
} from "@/services/reportes.service";

// ─── Hook genérico de fetch ───────────────────────────────────────────────────

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[]
): FetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchFn()
      .then((data) => {
        if (!cancelled && mountedRef.current) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled && mountedRef.current)
          setState((s) => ({ ...s, loading: false, error: err.message }));
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refetch };
}

// ─── Hook: Dashboard ──────────────────────────────────────────────────────────

interface UseDashboardOptions {
  token: string;
  semestre?: string;
  scope?: "administrador" | "grupo" | "semillero";
}

export function useDashboard({ token, semestre, scope }: UseDashboardOptions) {
  return useFetch<DashboardIndicadores>(
    () => reportesService.getDashboard(token, { semestre, scope }),
    [token, semestre, scope]
  );
}

// ─── Hook: Reporte de proyectos ───────────────────────────────────────────────

interface UseReporteProyectosOptions {
  token: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export function useReporteProyectos({
  token,
  search,
  ordering,
  page = 1,
}: UseReporteProyectosOptions) {
  return useFetch<PaginatedResponse<ReporteProyecto>>(
    () => reportesService.getReporteProyectos(token, { search, ordering, page }),
    [token, search, ordering, page]
  );
}

// ─── Hook: Reporte de semilleros ──────────────────────────────────────────────

interface UseReporteSemillerosOptions {
  token: string;
  search?: string;
  page?: number;
}

export function useReporteSemilleros({
  token,
  search,
  page = 1,
}: UseReporteSemillerosOptions) {
  return useFetch<PaginatedResponse<ReporteSemillero>>(
    () => reportesService.getReporteSemilleros(token, { search, page }),
    [token, search, page]
  );
}

// ─── Hook: Informes ───────────────────────────────────────────────────────────

interface UseInformesOptions extends FiltrosReportes {
  token: string;
}

export function useInformes({ token, ...filtros }: UseInformesOptions) {
  return useFetch<PaginatedResponse<Informe>>(
    () => reportesService.getInformes(token, filtros),
    [token, filtros.semillero, filtros.tipo, filtros.semestre, filtros.estado, filtros.search, filtros.page]
  );
}

// ─── Hook: Crear / Generar informe ────────────────────────────────────────────

interface UseInformeMutationResult {
  loading: boolean;
  error: string | null;
  success: boolean;
  crearInforme: (data: InformeCreateInput) => Promise<Informe | null>;
  generarInforme: (data: InformeCreateInput) => Promise<Informe | null>;
  reset: () => void;
}

export function useInformeMutation(token: string): UseInformeMutationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const run = useCallback(
    async (fn: () => Promise<Informe>): Promise<Informe | null> => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const result = await fn();
        setSuccess(true);
        return result;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error desconocido");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const crearInforme = useCallback(
    (data: InformeCreateInput) => run(() => reportesService.createInforme(token, data)),
    [token, run]
  );

  const generarInforme = useCallback(
    (data: InformeCreateInput) => run(() => reportesService.generarInforme(token, data)),
    [token, run]
  );

  return { loading, error, success, crearInforme, generarInforme, reset };
}

// ─── Hook: Exportar Excel ─────────────────────────────────────────────────────

export function useExportarExcel(token: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportar = useCallback(
    async (filtros?: FiltrosReportes) => {
      setLoading(true);
      setError(null);
      try {
        await reportesService.exportarExcel(token, filtros);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al exportar");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { exportar, loading, error };
}