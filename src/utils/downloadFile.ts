/**
 * Descarga un archivo desde una URL autenticada (con el Bearer token en el header).
 * El backend devuelve el archivo como blob; lo servimos al navegador creando un
 * <a> temporal y haciendo click() sobre él.
 *
 * @param url      URL completa del endpoint de descarga
 * @param filename Nombre sugerido para el archivo descargado (ej: "aval_semillero_5.pdf")
 */
import api from "@/services/api";

export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await api.get(url, { responseType: "blob" });

  // Intentar extraer el nombre del archivo desde el header Content-Disposition
  const disposition: string = response.headers["content-disposition"] ?? "";
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const resolvedName = match?.[1]?.replace(/['"]/g, "") ?? filename;

  const blob = new Blob([response.data], {
    type: response.headers["content-type"] ?? "application/octet-stream",
  });

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = resolvedName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}
