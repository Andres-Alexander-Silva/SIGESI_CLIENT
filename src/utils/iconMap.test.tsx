import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { getSidebarIcon } from "./iconMap";

function testId(icono: string | undefined, url: string | undefined) {
  const { container } = render(getSidebarIcon(icono, url));
  return container.querySelector("svg")?.getAttribute("data-testid");
}

describe("getSidebarIcon — rutas del módulo documental (HU-021)", () => {
  it('resuelve "/avances" a un icono específico, no al FolderOutlined por defecto', () => {
    expect(testId(undefined, "/avances")).not.toBe("FolderOutlinedIcon");
    expect(testId(undefined, "/avances")).toBeTruthy();
  });

  it('resuelve "/actividades" a un icono específico, no al FolderOutlined por defecto', () => {
    expect(testId(undefined, "/actividades")).not.toBe("FolderOutlinedIcon");
    expect(testId(undefined, "/actividades")).toBeTruthy();
  });

  it("una URL desconocida cae al icono por defecto FolderOutlined", () => {
    expect(testId(undefined, "/ruta-inexistente")).toBe("FolderOutlinedIcon");
  });
});
