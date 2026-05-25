// src/hooks/usePlanAccion.ts
import { useState, useCallback, useEffect } from 'react';
import { planAccionService } from '@/services/planAccion.service';
import { PlanAccion, PlanAccionCreate, PlanAccionFilters } from '@/types/planAccion';
import { PaginatedResponse } from '@/types';
import { formatApiError } from '@/utils/apiError';

interface UsePlanAccionReturn {
  data:       PaginatedResponse<PlanAccion> | null;
  isLoading:  boolean;
  error:      string | null;
  filters:    PlanAccionFilters;
  setFilters: (f: Partial<PlanAccionFilters>) => void;
  refresh:    () => Promise<void>;
  create:     (payload: PlanAccionCreate) => Promise<PlanAccion>;
  update:     (id: number, payload: Partial<PlanAccionCreate>) => Promise<PlanAccion>;
  remove:     (id: number) => Promise<void>;
  aprobar:    (id: number) => Promise<PlanAccion>;
  rechazar:   (id: number) => Promise<PlanAccion>;
}

export function usePlanAccion(
  initialFilters: PlanAccionFilters = {},
): UsePlanAccionReturn {
  const [data, setData]           = useState<PaginatedResponse<PlanAccion> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PlanAccionFilters>(initialFilters);

  const setFilters = useCallback((partial: Partial<PlanAccionFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial, page: 1 }));
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await planAccionService.list(filters);
      setData(result);
    } catch (err: any) {
      setError(formatApiError(err, 'Error al cargar los planes de acción.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (payload: PlanAccionCreate) => {
    const created = await planAccionService.create(payload);
    await refresh();
    return created;
  }, [refresh]);

  const update = useCallback(async (id: number, payload: Partial<PlanAccionCreate>) => {
    const updated = await planAccionService.update(id, payload);
    await refresh();
    return updated;
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    await planAccionService.remove(id);
    await refresh();
  }, [refresh]);

  const aprobar = useCallback(async (id: number) => {
    const result = await planAccionService.aprobar(id);
    await refresh();
    return result;
  }, [refresh]);

  const rechazar = useCallback(async (id: number) => {
    const result = await planAccionService.rechazar(id);
    await refresh();
    return result;
  }, [refresh]);

  return { data, isLoading, error, filters, setFilters, refresh, create, update, aprobar, rechazar, remove };
}
