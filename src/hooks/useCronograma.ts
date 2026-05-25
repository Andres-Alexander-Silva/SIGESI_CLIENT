// src/hooks/useCronograma.ts
import { useState, useCallback } from 'react';
import {
  CronogramaSemestral,
  CronogramaSemestralCreate,
  CronogramaFilters,
} from '@/types/planEstrategico';
import { cronogramaService } from '@/services/planEstrategico.service';
import { PaginatedResponse } from '@/types';

export function useCronograma() {
  const [data, setData]       = useState<PaginatedResponse<CronogramaSemestral> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchList = useCallback(async (filters: CronogramaFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cronogramaService.list(filters);
      setData(result);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Error al cargar cronogramas');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: CronogramaSemestralCreate): Promise<CronogramaSemestral> => {
    return cronogramaService.create(payload);
  }, []);

  const update = useCallback(
    async (id: number, payload: Partial<CronogramaSemestralCreate>): Promise<CronogramaSemestral> => {
      return cronogramaService.update(id, payload);
    },
    [],
  );

  const remove = useCallback(async (id: number): Promise<void> => {
    await cronogramaService.remove(id);
  }, []);

  return { data, loading, error, fetchList, create, update, remove };
}
