import { describe, it, expect, beforeEach, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("./api", () => ({
  default: {
    post: postMock,
    patch: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import { avancesService } from "./actividades.service";

describe("avancesService.create", () => {
  beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue({ data: { id: 1 } });
  });

  it('envía titulo, tipo y la clave "archivo" (no "evidencia") en el FormData', async () => {
    const file = new File(["contenido"], "evidencia.pdf", {
      type: "application/pdf",
    });

    await avancesService.create({
      actividad: 5,
      tipo: "documento",
      titulo: "Acta de reunión",
      descripcion: "Descripción del avance.",
      archivo: file,
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    const [url, formData, config] = postMock.mock.calls[0];

    expect(url).toBe("/core/avances/");
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("actividad")).toBe("5");
    expect((formData as FormData).get("tipo")).toBe("documento");
    expect((formData as FormData).get("titulo")).toBe("Acta de reunión");
    expect((formData as FormData).get("descripcion")).toBe(
      "Descripción del avance.",
    );
    expect((formData as FormData).get("archivo")).toBe(file);
    expect((formData as FormData).has("evidencia")).toBe(false);
    expect(config?.headers?.["Content-Type"]).toBe("multipart/form-data");
  });
});

describe("avancesService — sin flujo de aprobación", () => {
  it("no expone aprobar ni rechazar (Evidencia no tiene estado de aprobación)", () => {
    const service = avancesService as unknown as Record<string, unknown>;
    expect(service.aprobar).toBeUndefined();
    expect(service.rechazar).toBeUndefined();
  });
});
