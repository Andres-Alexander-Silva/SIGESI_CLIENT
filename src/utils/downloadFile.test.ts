import { describe, it, expect, vi, beforeEach } from "vitest";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("@/services/api", () => ({
  default: { get: getMock },
}));

import { downloadFile } from "./downloadFile";

describe("downloadFile", () => {
  beforeEach(() => {
    getMock.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it('llama a la instancia "api" compartida (viaja el Bearer del interceptor)', async () => {
    getMock.mockResolvedValue({
      data: new Blob(["contenido"]),
      headers: {},
    });
    const anchor = document.createElement("a");
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(anchor, "click").mockImplementation(() => {});

    await downloadFile("/core/avances/1/archive/download/", "avance_1");

    expect(getMock).toHaveBeenCalledWith(
      "/core/avances/1/archive/download/",
      { responseType: "blob" },
    );
    vi.restoreAllMocks();
  });

  it("usa el filename de Content-Disposition cuando el header lo trae", async () => {
    getMock.mockResolvedValue({
      data: new Blob(["contenido"]),
      headers: {
        "content-disposition": 'attachment; filename="real.pdf"',
        "content-type": "application/pdf",
      },
    });

    const anchor = document.createElement("a");
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(anchor);
    const clickSpy = vi.spyOn(anchor, "click").mockImplementation(() => {});

    await downloadFile("/core/avances/1/archive/download/", "fallback.pdf");

    expect(anchor.download).toBe("real.pdf");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    createSpy.mockRestore();
  });

  it("recurre al filename dado cuando no hay Content-Disposition", async () => {
    getMock.mockResolvedValue({
      data: new Blob(["contenido"]),
      headers: {},
    });

    const anchor = document.createElement("a");
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(anchor, "click").mockImplementation(() => {});

    await downloadFile("/core/avances/1/archive/download/", "fallback.pdf");

    expect(anchor.download).toBe("fallback.pdf");
    vi.restoreAllMocks();
  });

  it("revoca el object URL tras el click (no filtra memoria)", async () => {
    getMock.mockResolvedValue({ data: new Blob(["x"]), headers: {} });
    const anchor = document.createElement("a");
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(anchor, "click").mockImplementation(() => {});

    await downloadFile("/reportes/1/archive/download/", "informe");

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    vi.restoreAllMocks();
  });
});
