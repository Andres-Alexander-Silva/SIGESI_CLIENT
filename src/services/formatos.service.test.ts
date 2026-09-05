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

import { formatosService } from "./formatos.service";

describe("formatosService.create", () => {
  beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue({ data: { id: 1 } });
  });

  it("envía slug, nombre, categoria y archivo como multipart", async () => {
    const file = new File(["contenido"], "formato.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    await formatosService.create({
      slug: "nuevo-formato",
      nombre: "Nuevo Formato",
      categoria: "gestion",
      archivo: file,
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    const [url, formData, config] = postMock.mock.calls[0];
    expect(url).toBe("/informes/formatos-institucionales/");
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("slug")).toBe("nuevo-formato");
    expect((formData as FormData).get("categoria")).toBe("gestion");
    expect((formData as FormData).get("archivo")).toBe(file);
    expect(config?.headers?.["Content-Type"]).toBe("multipart/form-data");
  });
});

describe("formatosService — helpers de descarga", () => {
  it("archiveDownloadUrl apunta al slug indicado", () => {
    expect(formatosService.archiveDownloadUrl("plan-accion-semillero")).toBe(
      "/informes/formatos-institucionales/plan-accion-semillero/archive/download/",
    );
  });

  it("bulkDownloadUrl incluye el id del usuario", () => {
    expect(formatosService.bulkDownloadUrl(42)).toBe(
      "/informes/formularios-docente/?user=42",
    );
  });
});
