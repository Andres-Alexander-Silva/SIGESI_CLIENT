import api from "./api";
import { PaginatedResponse } from "@/types";
import { RegistroAuditoria, AuditoriaFilters } from "@/types/auditoria";

export const auditoriaService = {
  // El endpoint envuelve la paginación en el sobre `{ success, data }`,
  // así que desempaquetamos `data` para devolver el `PaginatedResponse` plano.
  list: (params?: Partial<AuditoriaFilters> & { page?: number; page_size?: number }) =>
    api
      .get<{ success: boolean; data: PaginatedResponse<RegistroAuditoria> }>(
        "/config/auditoria/logs/",
        { params },
      )
      .then((r) => r.data.data),

  get: (id: number) =>
    api
      .get<{ success: boolean; data: RegistroAuditoria }>(`/config/auditoria/logs/${id}/`)
      .then((r) => r.data?.data ?? (r.data as unknown as RegistroAuditoria)),
};
