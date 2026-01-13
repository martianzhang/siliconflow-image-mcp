/**
 * Tests for list models tool
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createListModelsTool } from "./list-models.js";
import { SiliconFlowService } from "../services/siliconflow.js";

vi.mock("../services/siliconflow.js", () => ({
  SiliconFlowService: vi.fn().mockImplementation(() => ({
    listImageModels: vi.fn(),
  })),
}));

describe("list_image_models tool", () => {
  let mockService: any;
  let tool: any;

  beforeEach(() => {
    mockService = {
      listImageModels: vi.fn(),
    };
    tool = createListModelsTool(mockService);
  });

  it("should have correct name and description", () => {
    expect(tool.name).toBe("list_image_models");
    expect(tool.description).toContain("List all available image generation models");
    expect(tool.description).toContain("SiliconFlow");
  });

  it("should handle successful model listing", async () => {
    mockService.listImageModels.mockResolvedValue([
      {
        id: "black-forest-labs/FLUX.1-dev",
        name: "FLUX.1 Dev",
        description: "Black Forest Labs image generation model",
        output_modalities: ["image"],
        pricing: { image: 0.0002 },
        context_length: 1024000,
      },
      {
        id: "Qwen/Qwen-Image-Edit-2509",
        name: "Qwen Image Edit",
        description: "Alibaba's image editing model",
        output_modalities: ["image"],
        pricing: { image: 0.0003 },
        context_length: 1024000,
      },
    ]);

    const result = await tool.handler({});

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Available Image Generation Models");
    expect(result.content[0].text).toContain("Found 2 models");
    expect(result.content[0].text).toContain("FLUX.1 Dev");
    expect(result.content[0].text).toContain("Qwen Image Edit");
  });

  it("should handle empty model list", async () => {
    mockService.listImageModels.mockResolvedValue([]);

    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("No image generation models found");
  });

  it("should handle API errors", async () => {
    mockService.listImageModels.mockRejectedValue(new Error("API Error"));

    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to list models: API Error");
  });

  it("should format model information correctly", async () => {
    mockService.listImageModels.mockResolvedValue([
      {
        id: "test/model",
        name: "Test Model",
        description: "A test model",
        output_modalities: ["image", "text"],
        pricing: { image: 0.0001 },
        context_length: 500000,
      },
    ]);

    const result = await tool.handler({});

    const text = result.content[0].text;
    expect(text).toContain("test/model");
    expect(text).toContain("Test Model");
    expect(text).toContain("A test model");
    expect(text).toContain("image, text");
  });

  it("should handle models without optional fields", async () => {
    mockService.listImageModels.mockResolvedValue([
      {
        id: "minimal/model",
        name: "Minimal Model",
      },
    ]);

    const result = await tool.handler({});

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("minimal/model");
    expect(result.content[0].text).toContain("Minimal Model");
  });
});
