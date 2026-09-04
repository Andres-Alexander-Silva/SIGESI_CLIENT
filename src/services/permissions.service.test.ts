import { describe, it, expect } from "vitest";
import { buildSidebarTree } from "./permissions.service";

describe("buildSidebarTree", () => {
  it("un menú con una sola opción se convierte en hoja navegable", () => {
    const [menu] = buildSidebarTree([
      { id: 1, nombre: "Semilleros", icono: "fa-flask", opciones: [{ id: 1, url: "/semilleros" }] },
    ]);
    expect(menu.url).toBe("/semilleros");
    expect(menu.children).toHaveLength(0);
  });

  it("un menú con varias opciones se convierte en padre expandible sin url propia", () => {
    const [menu] = buildSidebarTree([
      {
        id: 1,
        nombre: "Producción y Evidencias",
        icono: "fa-folder-open",
        opciones: [
          { id: 1, url: "/avances" },
          { id: 2, url: "/produccion" },
        ],
      },
    ]);
    expect(menu.url).toBe("");
    expect(menu.children).toHaveLength(2);
    expect(menu.children?.map((c) => c.url)).toEqual(["/avances", "/produccion"]);
  });

  it("Dashboard es siempre hoja con url fija, sin importar el número de opciones", () => {
    const [menu] = buildSidebarTree([
      {
        id: 1,
        nombre: "Dashboard",
        icono: "fa-gauge",
        opciones: [{ id: 1, url: "/dashboard" }, { id: 2, url: "/dashboard/otro" }],
      },
    ]);
    expect(menu.url).toBe("/dashboard");
    expect(menu.children).toHaveLength(0);
  });
});
