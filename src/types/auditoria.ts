/**
 * Registro de auditoría tal como lo devuelve el endpoint
 * `GET /config/auditoria/logs/` (serializer `RegistroAuditoriaSerializer`).
 *
 * Nota: el backend expone `usuario` (copia del correo, source=usuario_email) e
 * `ip` (no `usuario_email`/`ip_address`), y no envía `descripcion`/`detalles`:
 * en su lugar entrega los metadatos crudos de la petición (`metodo_http`,
 * `ruta`, `status_code`, `object_id`, `user_agent`).
 */
export interface RegistroAuditoria {
  id: number;
  accion: string;
  modulo: string;
  usuario: string;
  rol_activo: string;
  metodo_http: string;
  ruta: string;
  status_code: number;
  object_id: string;
  ip: string | null;
  user_agent: string;
  fecha: string;
}

/**
 * Filtros aceptados por el endpoint. Las claves coinciden con
 * `filterset_fields` del ViewSet (`accion`, `modulo`, `usuario_email`,
 * `rol_activo`); `search` es texto libre.
 */
export interface AuditoriaFilters {
  search: string;
  accion: string;
  modulo: string;
  usuario_email: string;
  rol_activo: string;
}
