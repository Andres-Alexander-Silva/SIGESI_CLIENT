// src/hooks/usePlanEstrategico.ts
import { useState, useCallback } from 'react';
import {
  PlanEstrategico,
  PlanEstrategicoCreate,
  PlanEstrategicoFilters,
} from '@/types/planEstrategico';
import { planEstrategicoService } from '@/services/planEstrategico.service';
import { PaginatedResponse } from '@/types';

export function usePlanEstrategico() {
  const [data, setData]       = useState<PaginatedResponse<PlanEstrategico> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchList = useCallback(async (filters: PlanEstrategicoFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await planEstrategicoService.list(filters);
      setData(result);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Error al cargar planes estratégicos');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: PlanEstrategicoCreate): Promise<PlanEstrategico> => {
    const item = await planEstrategicoService.create(payload);
    return item;
  }, []);

  const update = useCallback(
    async (id: number, payload: Partial<PlanEstrategicoCreate>): Promise<PlanEstrategico> => {
      return planEstrategicoService.update(id, payload);
    },
    [],
  );

  const remove = useCallback(async (id: number): Promise<void> => {
    await planEstrategicoService.remove(id);
  }, []);

  const aprobar = useCallback(async (id: number): Promise<PlanEstrategico> => {
    return planEstrategicoService.aprobar(id);
  }, []);

  const rechazar = useCallback(async (id: number): Promise<PlanEstrategico> => {
    return planEstrategicoService.rechazar(id);
  }, []);

  return { data, loading, error, fetchList, create, update, remove, aprobar, rechazar };
}
