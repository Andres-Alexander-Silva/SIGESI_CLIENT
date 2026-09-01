/** RNF-07: límite físico de carga de archivos (debe coincidir con el backend, ver
 * apps/sigesi/utils/download.py::MAX_UPLOAD_SIZE_MB en SIGESI_API). */
export const MAX_UPLOAD_SIZE_MB = 20;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

/**
 * Valida el tamaño de un archivo antes de subirlo.
 * Devuelve un mensaje de error si excede el límite, o `null` si es válido.
 */
export function validateFileSize(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `El archivo no puede superar los ${MAX_UPLOAD_SIZE_MB}MB.`;
  }
  return null;
}
