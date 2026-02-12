import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/path", () => ({
  resolveResource: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("./docxGenerator", () => ({
  OpenAPIDocGenerator: vi.fn(),
}));

import { resolveResource } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";
import { DocumentService } from "./documentService";

describe("DocumentService OpenAPI parsing", () => {
  it("parses Swagger 2.0 YAML text", () => {
    const service = new DocumentService();
    const swaggerText = `
swagger: "2.0"
info:
  title: Swagger Petstore
  version: "1.0.0"
paths:
  /pets:
    get:
      summary: List pets
      responses:
        "200":
          description: ok
`;

    const spec = service.parseOpenApiFromText(swaggerText) as any;

    expect(spec.swagger).toBe("2.0");
    expect(spec.info.title).toBe("Swagger Petstore");
    expect(spec.paths["/pets"]).toBeDefined();
  });

  it("accepts Swagger 2.0 spec in validation", async () => {
    const service = new DocumentService();
    const swaggerSpec = {
      swagger: "2.0",
      info: {
        title: "Swagger Petstore",
        version: "1.0.0",
      },
      paths: {
        "/pets": {
          get: {
            responses: {
              "200": {
                description: "ok",
              },
            },
          },
        },
      },
    };

    const validation = await service.validateOpenApiSpec(swaggerSpec);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("resolves built-in API template path from bundled resources", async () => {
    const service = new DocumentService();
    const mockResolveResource = vi.mocked(resolveResource);
    const mockReadFile = vi.mocked(readFile);

    Object.defineProperty(window, "__TAURI__", {
      value: {},
      configurable: true,
    });

    mockResolveResource.mockResolvedValueOnce(
      "C:/Program Files/spec2doc/resources/接口文档模板.docx",
    );
    mockReadFile.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));

    const path = await service.getBuiltInApiTemplatePath();
    expect(path).toContain("接口文档模板.docx");
  });
});
