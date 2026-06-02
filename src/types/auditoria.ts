export interface RegistroAuditoria {
  id: number;
  accion: string;
  modulo: string;
  usuario_email: string;
  rol_activo: string;
  ip_address: string;
  descripcion: string;
  fecha: string;
  detalles: Record<string, unknown> | null;
}

export interface AuditoriaFilters {
  search: string;
  accion: string;
  modulo: string;
  usuario_email: string;
  rol_activo: string;
}
