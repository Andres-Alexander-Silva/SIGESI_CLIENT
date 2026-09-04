import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/context/PermissionsContext", () => ({
  usePermissions: () => ({ can: () => true }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 }, activeRole: "administrador" }),
}));

vi.mock("@/services/actividades.service", () => ({
  avancesService: {
    list: vi.fn().mockResolvedValue([
      { id: 1, actividad: 1, tipo: "documento", titulo: "Acta 1", descripcion: "d", archivo: null, created_at: "2026-01-01T00:00:00Z" },
      { id: 2, actividad: 1, tipo: "acta", titulo: "Acta 2", descripcion: "d", archivo: null, created_at: "2026-01-02T00:00:00Z" },
    ]),
    archiveDownloadUrl: vi.fn(),
  },
  actividadesService: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/services/core.service", () => ({
  proyectosService: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/services/config.service", () => ({
  usersService: { list: vi.fn().mockResolvedValue([]) },
}));

import AvancesPage from "./AvancesPage";

describe("AvancesPage — contrato de Evidencia (sin flujo de aprobación)", () => {
  it("no renderiza controles de aprobación (Aprobar/Rechazar/Observaciones)", async () => {
    render(<AvancesPage />);
    await screen.findByText("Acta 1");

    expect(screen.queryByText(/aprobar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rechazar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/observaciones/i)).not.toBeInTheDocument();
  });

  it("agrupa las métricas por tipo en lugar de por estado", async () => {
    render(<AvancesPage />);
    await screen.findByText("Acta 1");

    expect(screen.getByText("Documentos")).toBeInTheDocument();
    expect(screen.getByText("Actas")).toBeInTheDocument();
    expect(screen.queryByText("Aprobados")).not.toBeInTheDocument();
    expect(screen.queryByText("Rechazados")).not.toBeInTheDocument();
  });

  it("el filtro ofrece tipos de evidencia, no estados de avance", async () => {
    render(<AvancesPage />);
    await screen.findByText("Acta 1");

    // Los <Select> de MUI en esta página no wirean `labelId`, así que
    // getByLabelText no los asocia (patrón preexistente en todo el archivo,
    // no introducido por este cambio); se ubica el combobox por contenedor.
    const user = userEvent.setup();
    // MUI duplica el texto del label (visible + leyenda del notch outlined).
    const filtroTipo = screen
      .getAllByText("Tipo")[0]
      .closest(".MuiFormControl-root");
    await user.click(within(filtroTipo as HTMLElement).getByRole("combobox"));

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("Documento")).toBeInTheDocument();
    expect(within(listbox).getByText("Fotografía")).toBeInTheDocument();
    expect(within(listbox).queryByText("Aprobado")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Rechazado")).not.toBeInTheDocument();
  });

  it('el formulario de creación exige "Título" y "Tipo"', async () => {
    render(<AvancesPage />);
    await screen.findByText("Acta 1");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /registrar avance/i }));

    expect(await screen.findByLabelText("Título *")).toBeInTheDocument();
    const tipoField = screen
      .getAllByText("Tipo *")[0]
      .closest(".MuiFormControl-root");
    expect(within(tipoField as HTMLElement).getByRole("combobox")).toBeInTheDocument();
  });
});
