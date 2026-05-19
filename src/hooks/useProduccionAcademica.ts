import { useState, useCallback, useEffect } from 'react';
import { produccionAcademicaService } from '@/services/produccionAcademica.service';
import {
  ProduccionAcademica,
  ProduccionAcademicaCreate,
  ProduccionAcademicaFilters,
} from '@/types/produccionAcademica';
import { PaginatedResponse } from '@/types';
import { formatApiError } from '@/utils/apiError';

interface UseProduccionAcademicaReturn {
  data: PaginatedResponse<ProduccionAcademica> | null;
  isLoading: boolean;
  error: string | null;
  filters: ProduccionAcademicaFilters;
  setFilters: (f: Partial<ProduccionAcademicaFilters>) => void;
  refresh: () => Promise<void>;
  create: (payload: ProduccionAcademicaCreate) => Promise<ProduccionAcademica>;
  update: (id: number, payload: Partial<ProduccionAcademicaCreate>) => Promise<ProduccionAcademica>;
  remove: (id: number) => Promise<void>;
}

export function useProduccionAcademica(
  initialFilters: ProduccionAcademicaFilters = {},
): UseProduccionAcademicaReturn {
  const [data, setData] = useState<PaginatedResponse<ProduccionAcademica> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ProduccionAcademicaFilters>(initialFilters);

  const setFilters = useCallback((partial: Partial<ProduccionAcademicaFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial, page: 1 }));
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await produccionAcademicaService.list(filters);
      setData(result);
    } catch (err: any) {
      setError(formatApiError(err, 'Error al cargar la producción académica.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (payload: ProduccionAcademicaCreate) => {
    const created = await produccionAcademicaService.create(payload);
    await refresh();
    return created;
  }, [refresh]);

  const update = useCallback(async (id: number, payload: Partial<ProduccionAcademicaCreate>) => {
    const updated = await produccionAcademicaService.update(id, payload);
    await refresh();
    return updated;
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    await produccionAcademicaService.remove(id);
    await refresh();
  }, [refresh]);

  return { data, isLoading, error, filters, setFilters, refresh, create, update, remove };
}
