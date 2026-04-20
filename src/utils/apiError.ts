// src/utils/apiError.ts

/**
 * Formatea errores de la API para mostrar mensajes legibles al usuario.
 * - Si es un objeto tipo { campo: ["mensaje"] }, concatena los mensajes.
 * - Si es string, lo muestra directo.
 * - Si no, muestra un mensaje por defecto.
 */
export function formatApiError(error: any, defaultMsg = 'Ocurrió un error.') {
  const data = error?.response?.data || error;
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([field, errors]) => Array.isArray(errors) ? errors.join(' ') : String(errors))
      .join(' ');
  } else if (typeof data === 'string') {
    return data;
  }
  return defaultMsg;
}
