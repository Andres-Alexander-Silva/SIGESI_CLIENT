/** RNF-07: límite físico de carga de archivos (debe coincidir con el backend, ver
 * apps/sigesi/utils/download.py::MAX_UPLOAD_SIZE_MB en SIGESI_API). */
export const MAX_UPLOAD_SIZE_MB = 20;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

/** Whitelist general (debe coincidir con ALLOWED_UPLOAD_EXTENSIONS en
 * apps/sigesi/utils/download.py). Úsala salvo que el endpoint restrinja a un
 * subconjunto — p. ej. el aval institucional solo acepta EXTENSIONES_AVAL. */
export const EXTENSIONES_GENERALES = [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx"];
/** El aval institucional del semillero (archivo_aval) solo acepta PDF — ver
 * SemilleroAvalSerializer.validate_archivo_aval en el backend. */
export const EXTENSIONES_AVAL = [".pdf"];
/** Campos de imagen de perfil (foto de usuario, logo de semillero). */
export const EXTENSIONES_IMAGEN = [".jpg", ".jpeg", ".png"];

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

/**
 * Valida la extensión de un archivo contra una whitelist (por defecto,
 * EXTENSIONES_GENERALES). Devuelve un mensaje de error o `null` si es válida.
 */
export function validateFileExtension(
  file: File,
  extensiones: string[] = EXTENSIONES_GENERALES,
): string | null {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!extensiones.includes(ext)) {
    return `Tipo de archivo no permitido. Válidos: ${extensiones.join(", ")}.`;
  }
  return null;
}

/**
 * Combina la validación de extensión y tamaño; devuelve el primer error
 * encontrado, o `null` si el archivo es válido.
 */
export function validateFile(
  file: File,
  opciones?: { extensiones?: string[] },
): string | null {
  return (
    validateFileExtension(file, opciones?.extensiones) ?? validateFileSize(file)
  );
}
