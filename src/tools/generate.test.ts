/**
 * Tests for generate image tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the file utility module BEFORE importing the tool
vi.mock("../utils/file.js", () => ({
  saveImageToFile: vi.fn((data, prefix, mimeType) => {
    const extension = mimeType === "image/jpeg" ? "jpg" : "png";
    return Promise.resolve(`/tmp/siliconflow-images/${prefix}_1234567890.${extension}`);
  }),
  getTempDir: vi.fn(() => "/tmp/siliconflow-images"),
}));

// Mock SiliconFlowService
vi.mock("../services/siliconflow.js", () => ({
  SiliconFlowService: vi.fn().mockImplementation(() => ({
    generateImage: vi.fn(),
  })),
}));

import { createGenerateImageTool } from "./generate.js";
import { saveImageToFile, getTempDir } from "../utils/file.js";

describe("generate_image tool", () => {
  let mockService: any;
  let tool: any;

  beforeEach(() => {
    mockService = {
      generateImage: vi.fn(),
    };
    tool = createGenerateImageTool(mockService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have correct name and description", () => {
    expect(tool.name).toBe("generate_image");
    expect(tool.description).toContain("Generate images");
    expect(tool.description).toContain("SiliconFlow");
    expect(tool.description).toContain("temporary files");
  });

  it("should validate input schema", async () => {
    // Test with invalid input
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid input");
  });

  it("should handle successful image generation and save to file", async () => {
    // Mock the service to return base64 image data
    mockService.generateImage.mockResolvedValue([
      {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // 1x1 transparent PNG
        mimeType: "image/png",
      },
    ]);

    const result = await tool.handler({
      prompt: "A beautiful sunset",
      model: "test-model",
    });

    // Verify file utility functions were called
    expect(saveImageToFile).toHaveBeenCalledWith(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "generated_1",
      "image/png",
    );
    expect(getTempDir).toHaveBeenCalled();

    // Verify response structure
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1); // Only text content now
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Successfully generated 1 image");
    expect(result.content[0].text).toContain("Saved to:");
    expect(result.content[0].text).toContain("/tmp/siliconflow-images/generated_1_1234567890.png");
  });

  it("should handle multiple images and save all to files", async () => {
    mockService.generateImage.mockResolvedValue([
      { data: "img1", mimeType: "image/png" },
      { data: "img2", mimeType: "image/jpeg" },
    ]);

    const result = await tool.handler({
      prompt: "Test prompt",
      count: 2,
    });

    expect(saveImageToFile).toHaveBeenCalledTimes(2);
    expect(saveImageToFile).toHaveBeenCalledWith("img1", "generated_1", "image/png");
    expect(saveImageToFile).toHaveBeenCalledWith("img2", "generated_2", "image/jpeg");
    expect(result.content[0].text).toContain("2 images");
    expect(result.content[0].text).toContain("generated_1_1234567890.png");
    expect(result.content[0].text).toContain("generated_2_1234567890.jpg");
  });

  it("should handle generation errors", async () => {
    mockService.generateImage.mockRejectedValue(new Error("API Error"));

    const result = await tool.handler({
      prompt: "Test prompt",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Image generation failed: API Error");
  });

  it("should validate aspect ratio", async () => {
    const result = await tool.handler({
      prompt: "Test",
      aspectRatio: "invalid",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid input");
  });

  it("should validate count range", async () => {
    const result = await tool.handler({
      prompt: "Test",
      count: 10,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid input");
  });

  it("should handle empty image array from service", async () => {
    mockService.generateImage.mockResolvedValue([]);

    const result = await tool.handler({
      prompt: "Test prompt",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("No images were generated");
  });

  it("should handle file system errors gracefully", async () => {
    mockService.generateImage.mockResolvedValue([{ data: "img1", mimeType: "image/png" }]);

    vi.mocked(saveImageToFile).mockRejectedValue(new Error("Permission denied"));

    const result = await tool.handler({
      prompt: "Test prompt",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Image generation failed");
  });
});
