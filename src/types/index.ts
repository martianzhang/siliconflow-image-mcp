/**
 * Type definitions for SiliconFlow Image MCP
 */

import { z } from "zod";

// Image generation input schema
export const GenerateImageInputSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(2000, "Prompt must be 2000 characters or less")
    .describe("Detailed description of the image to generate"),

  model: z
    .string()
    .optional()
    .describe("Model to use for generation (defaults to black-forest-labs/FLUX.1-dev)"),

  aspectRatio: z
    .enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"])
    .optional()
    .describe("Aspect ratio for generated images"),

  imageSize: z.enum(["1K", "2K", "4K"]).optional().describe("Image size (higher resolution)"),

  count: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .default(1)
    .describe("Number of images to generate (1-4)"),

  negativePrompt: z.string().optional().describe("Negative prompt - what to avoid in the image"),

  seed: z
    .number()
    .int()
    .min(0)
    .max(9999999999)
    .optional()
    .describe("Seed for reproducible results"),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// Image editing input schema
export const EditImageInputSchema = z.object({
  image: z
    .string()
    .min(1, "Image data is required")
    .describe("Base64 encoded image data, image URL, or local file path to edit"),

  prompt: z
    .string()
    .min(1, "Edit prompt is required")
    .max(2000, "Edit prompt must be 2000 characters or less")
    .describe("Instructions for editing the image"),

  model: z
    .string()
    .optional()
    .describe("Model to use for editing (defaults to Qwen/Qwen-Image-Edit-2509)"),
});

export type EditImageInput = z.infer<typeof EditImageInputSchema>;

// List models input schema (empty)
export const ListModelsInputSchema = z.object({});

export type ListModelsInput = z.infer<typeof ListModelsInputSchema>;

// Image result type
export interface ImageResult {
  data: string; // Base64 encoded image data
  mimeType: string; // e.g., "image/png"
  size?: number; // File size in bytes
  width?: number; // Image width in pixels
  height?: number; // Image height in pixels
}

// Model information type
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  output_modalities?: string[];
  pricing?: {
    prompt?: number;
    completion?: number;
    image?: number;
  };
  context_length?: number;
}

// Tool response type
export interface ToolResponse {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
    name?: string;
  }>;
  isError?: boolean;
}
