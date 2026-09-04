import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { canMock } = vi.hoisted(() => ({ canMock: vi.fn() }));

vi.mock("@/context/PermissionsContext", () => ({
  usePermissions: () => ({ can: canMock }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));

vi.mock("@/services/formatos.service", () => ({
  formatosService: {
    list: vi.fn().mockResolvedValue([
      {
        id: 1,
        slug: "plan-accion-semillero",
        nombre: "Plan de Acción",
        descripcion: "",
        categoria: "planeacion",
        categoria_display: "Planeación",
        archivo: "/media/formatos/x.docx",
        tipo_vinculacion: null,
        tipo_vinculacion_display: null,
        version: "",
        estado: true,
        created_at: "",
        updated_at: "",
      },
    ]),
    archiveDownloadUrl: vi.fn(),
    bulkDownloadUrl: vi.fn(),
  },
}));

import FormatosPage from "./FormatosPage";

describe("FormatosPage — gating por permisos", () => {
  it('sin permiso de "crear" no muestra el botón de agregar ni editar/eliminar', async () => {
    canMock.mockReturnValue(false);
    render(<FormatosPage />);
    await screen.findByText("Plan de Acción");

    expect(
      screen.queryByRole("button", { name: /agregar formato/i }),
    ).not.toBeInTheDocument();
  });

  it('con permiso de "crear" muestra el botón de agregar', async () => {
    canMock.mockImplementation(
      (_url: string, accion: string) => accion === "crear",
    );
    render(<FormatosPage />);
    await screen.findByText("Plan de Acción");

    expect(
      screen.getByRole("button", { name: /agregar formato/i }),
    ).toBeInTheDocument();
  });
});
