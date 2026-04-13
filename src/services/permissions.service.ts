import api from "./api";
import { Menu, Opcion, UserPermissionsResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convierte la lista plana de menús que devuelve la API en un árbol de
 * nodos que el Sidebar puede renderizar.
 *
 * Reglas:
 *  - Menú con 1 sola opción  → nodo hoja, url = opcion.url
 *  - Menú con N > 1 opciones → nodo padre expandible, children = opciones
 *  - Dashboard               → siempre hoja, url fija "/dashboard"
 */
function buildSidebarTree(rawMenus: any[]): Menu[] {
  return rawMenus.map((m, idx): Menu => {
    const opciones: Opcion[] = m.opciones ?? [];

    // Dashboard siempre es hoja fija
    if (m.nombre?.toLowerCase() === "dashboard") {
      return {
        id: m.id,
        nombre: m.nombre,
        icono: m.icono ?? "",
        url: "/dashboard",
        orden: idx,
        opciones,
        children: [],
      };
    }

    if (opciones.length <= 1) {
      // Hoja: navegar directo a la única opción
      return {
        id: m.id,
        nombre: m.nombre,
        icono: m.icono ?? "",
        url: opciones[0]?.url ?? "",
        orden: idx,
        opciones,
        children: [],
      };
    }

    // Padre expandible: cada opción se convierte en un hijo del menú
    const children: Menu[] = opciones.map((op, childIdx) => ({
      id: op.id * 1000 + childIdx, // id sintético para evitar colisiones
      nombre: op.nombre,
      icono: "",
      url: op.url,
      orden: childIdx,
      opciones: [op],
      children: [],
    }));

    return {
      id: m.id,
      nombre: m.nombre,
      icono: m.icono ?? "",
      url: "", // padre no navega, solo expande
      orden: idx,
      opciones,
      children,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicio
// ─────────────────────────────────────────────────────────────────────────────
export const permissionsService = {
  async getMyPermissions(): Promise<UserPermissionsResponse> {
    const { data } = await api.get("/config/users/mis-permisos/");

    const rol: string = data.rol ?? "";
    const rawMenus: any[] = data.menus ?? [];

    const menus = buildSidebarTree(rawMenus);

    return { rol, menus };
  },
};
