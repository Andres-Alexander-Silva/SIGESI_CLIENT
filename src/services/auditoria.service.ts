import api from "./api";
import { PaginatedResponse } from "@/types";
import { RegistroAuditoria, AuditoriaFilters } from "@/types/auditoria";

export const auditoriaService = {
  list: (params?: Partial<AuditoriaFilters> & { page?: number; page_size?: number }) =>
    api
      .get<PaginatedResponse<RegistroAuditoria>>("/config/auditoria/logs/", { params })
      .then((r) => r.data),

  get: (id: number) =>
    api
      .get<{ success: boolean; data: RegistroAuditoria }>(`/config/auditoria/logs/${id}/`)
      .then((r) => r.data?.data ?? (r.data as unknown as RegistroAuditoria)),
};
