import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    activeRole: "director_semillero",
    user: { id: 1 },
  }),
}));

vi.mock("@/hooks/usePermissionsWebSocket", () => ({
  usePermissionsWebSocket: () => {},
}));

vi.mock("@/services/permissions.service", () => ({
  permissionsService: {
    getMyPermissions: vi.fn().mockResolvedValue({
      rol: "director_semillero",
      menus: [
        {
          id: 1,
          nombre: "Producción y Evidencias",
          icono: "fa-folder-open",
          opciones: [
            {
              id: 10,
              nombre: "Avances",
              url: "/avances",
              puede_consultar: true,
              puede_crear: true,
              puede_actualizar: true,
              puede_eliminar: false,
            },
          ],
        },
      ],
    }),
  },
  buildSidebarTree: (rawMenus: any[]) =>
    rawMenus.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      icono: m.icono ?? "",
      url: m.opciones?.[0]?.url ?? "",
      orden: 0,
      opciones: m.opciones ?? [],
      children: [],
    })),
}));

import { PermissionsProvider, usePermissions } from "./PermissionsContext";

function Probe() {
  const { can, isLoading } = usePermissions();
  if (isLoading) return <div>cargando</div>;
  return (
    <div>
      <span data-testid="ver">{String(can("/avances", "ver"))}</span>
      <span data-testid="crear">{String(can("/avances", "crear"))}</span>
      <span data-testid="eliminar">{String(can("/avances", "eliminar"))}</span>
      <span data-testid="aprobar">{String(can("/avances", "aprobar"))}</span>
      <span data-testid="exportar">{String(can("/avances", "exportar"))}</span>
      <span data-testid="desconocida">
        {String(can("/no-existe", "ver"))}
      </span>
      {/* con o sin barras iniciales/finales y mayúsculas: misma clave normalizada */}
      <span data-testid="normalizada">
        {String(can("AVANCES/", "ver"))}
      </span>
    </div>
  );
}

describe("PermissionsContext.can()", () => {
  it("resuelve las acciones desde el índice de permisos cargado", async () => {
    render(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>,
    );

    expect(await screen.findByTestId("ver")).toHaveTextContent("true");
    expect(screen.getByTestId("crear")).toHaveTextContent("true");
    expect(screen.getByTestId("eliminar")).toHaveTextContent("false");
  });

  it('deriva "aprobar" de puede_actualizar y "exportar" de puede_consultar', async () => {
    render(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>,
    );

    // puede_actualizar=true -> aprobar=true; puede_consultar=true -> exportar=true
    expect(await screen.findByTestId("aprobar")).toHaveTextContent("true");
    expect(screen.getByTestId("exportar")).toHaveTextContent("true");
  });

  it("una URL no sembrada en el índice falla en cerrado (false), no lanza", async () => {
    render(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>,
    );

    expect(await screen.findByTestId("desconocida")).toHaveTextContent(
      "false",
    );
  });

  it("normaliza mayúsculas y barras al resolver la clave", async () => {
    render(
      <PermissionsProvider>
        <Probe />
      </PermissionsProvider>,
    );

    expect(await screen.findByTestId("normalizada")).toHaveTextContent(
      "true",
    );
  });
});
