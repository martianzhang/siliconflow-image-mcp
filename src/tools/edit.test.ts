/**
 * Tests for edit image tool
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
    editImage: vi.fn(),
  })),
}));

import { createEditImageTool } from "./edit.js";
import { saveImageToFile, getTempDir } from "../utils/file.js";

describe("edit_image tool", () => {
  let mockService: any;
  let tool: any;

  beforeEach(() => {
    mockService = {
      editImage: vi.fn(),
    };
    tool = createEditImageTool(mockService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have correct name and description", () => {
    expect(tool.name).toBe("edit_image");
    expect(tool.description).toContain("Edit existing images");
    expect(tool.description).toContain("SiliconFlow");
    expect(tool.description).toContain("temporary files");
  });

  it("should validate input schema", async () => {
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid input");
  });

  it("should handle successful image editing and save to file", async () => {
    mockService.editImage.mockResolvedValue({
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
    });

    const result = await tool.handler({
      image: "base64-original-image",
      prompt: "Make it brighter",
    });

    // Verify file utility functions were called
    expect(saveImageToFile).toHaveBeenCalledWith(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "edited",
      "image/png",
    );
    expect(getTempDir).toHaveBeenCalled();

    // Verify response structure
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1); // Only text content now
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Successfully edited image");
    expect(result.content[0].text).toContain("Saved to:");
    expect(result.content[0].text).toContain("/tmp/siliconflow-images/edited_1234567890.png");
  });

  it("should handle JPEG images correctly", async () => {
    mockService.editImage.mockResolvedValue({
      data: "fake-jpeg-data",
      mimeType: "image/jpeg",
    });

    const result = await tool.handler({
      image: "base64-data",
      prompt: "Test edit",
    });

    expect(saveImageToFile).toHaveBeenCalledWith("fake-jpeg-data", "edited", "image/jpeg");
    expect(result.content[0].text).toContain(".jpg");
  });

  it("should handle editing errors", async () => {
    mockService.editImage.mockRejectedValue(new Error("Edit failed"));

    const result = await tool.handler({
      image: "base64-data",
      prompt: "Test edit",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Image editing failed: Edit failed");
  });

  it("should validate prompt length", async () => {
    const longPrompt = "a".repeat(2001);
    const result = await tool.handler({
      image: "base64-data",
      prompt: longPrompt,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid input");
  });

  it("should validate image data presence", async () => {
    const result = await tool.handler({
      prompt: "Test edit",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid input");
  });

  it("should handle file system errors gracefully", async () => {
    mockService.editImage.mockResolvedValue({
      data: "edited-data",
      mimeType: "image/png",
    });

    vi.mocked(saveImageToFile).mockRejectedValue(new Error("Permission denied"));

    const result = await tool.handler({
      image: "base64-data",
      prompt: "Test edit",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Image editing failed");
  });
});
