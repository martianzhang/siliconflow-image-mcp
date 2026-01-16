/**
 * SiliconFlow service wrapper for image generation and editing
 * Optimized for China users
 */

import { ImageResult, ModelInfo } from "../types/index.js";
import * as fs from "fs";
import * as path from "path";
import os from "os";

export class SiliconFlowService {
  private apiKey: string;
  private baseUrl: string;
  private allowedImageDirs: string[];

  constructor(apiKey: string, baseUrl?: string, allowedImageDirs?: string[]) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("SiliconFlow API key is required");
    }
    this.apiKey = apiKey;
    // Use provided baseUrl or fall back to environment variable or default
    this.baseUrl = baseUrl || process.env.SILICONFLOW_API_URL || "https://api.siliconflow.cn/v1";
    // Configure allowed image directories for file path validation
    this.allowedImageDirs = allowedImageDirs || this.getDefaultAllowedDirs();
  }

  /**
   * Get default allowed directories for image files
   * Prevents path traversal attacks by restricting file access
   */
  private getDefaultAllowedDirs(): string[] {
    const dirs: string[] = [];

    // Add user's home directory
    const homeDir = os.homedir();
    if (homeDir) {
      dirs.push(homeDir);
    }

    // Add current working directory
    const cwd = process.cwd();
    if (cwd) {
      dirs.push(cwd);
    }

    // Add custom image directory if set
    const customDir = process.env.SILICONFLOW_IMAGE_DIR;
    if (customDir) {
      dirs.push(customDir);
    }

    // Add system temp directory
    dirs.push(os.tmpdir());

    return dirs;
  }

  /**
   * Validate that a file path is within allowed directories
   * Prevents path traversal attacks
   */
  private isPathAllowed(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath);

    for (const allowedDir of this.allowedImageDirs) {
      const resolvedAllowedDir = path.resolve(allowedDir);
      if (resolvedPath.startsWith(resolvedAllowedDir + path.sep) || resolvedPath === resolvedAllowedDir) {
        return true;
      }
    }

    return false;
  }

  /**
   * Make API call to SiliconFlow
   */
  private async makeApiCall<T = any>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make GET API call to SiliconFlow
   */
  private async makeGetCall<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Generate images using SiliconFlow's image generation models
   */
  async generateImage(
    prompt: string,
    model: string = "black-forest-labs/FLUX.1-dev",
    aspectRatio?: string,
    imageSize?: string,
    count: number = 1,
    negativePrompt?: string,
    seed?: number,
  ): Promise<ImageResult[]> {
    try {
      // Build request body
      const requestBody: any = {
        model,
        prompt,
        batch_size: Math.min(count, 4), // SiliconFlow max is 4
      };

      // Handle image size mapping from aspect ratio
      if (aspectRatio || imageSize) {
        requestBody.image_size = this.mapAspectRatioToSize(aspectRatio, imageSize, model);
      }

      if (negativePrompt) {
        requestBody.negative_prompt = negativePrompt;
      }

      if (seed !== undefined) {
        requestBody.seed = seed;
      }

      // Use SiliconFlow's image generation endpoint
      const result = await this.makeApiCall("/images/generations", requestBody);

      if (!result.images || result.images.length === 0) {
        throw new Error("No images were generated");
      }

      // Download images and convert to base64
      const images: ImageResult[] = [];
      for (const img of result.images) {
        const imageUrl = img.url;
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Data = Buffer.from(imageBuffer).toString("base64");

        // Determine mime type from URL or default to PNG
        const mimeType = imageUrl.includes(".png")
          ? "image/png"
          : imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")
            ? "image/jpeg"
            : "image/png";

        images.push({
          data: base64Data,
          mimeType,
        });
      }

      return images;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image generation failed: ${error.message}`);
      }
      throw new Error("Image generation failed with unknown error");
    }
  }

  /**
   * Edit an existing image using SiliconFlow
   */
  async editImage(
    image: string,
    prompt: string,
    model: string = "Qwen/Qwen-Image-Edit-2509",
  ): Promise<ImageResult> {
    try {
      // Determine if image is base64, URL, or local file path
      let imageContent: string;

      if (image.startsWith("data:image/")) {
        // Already a data URL
        imageContent = image;
      } else if (image.startsWith("http://") || image.startsWith("https://")) {
        // URL - SiliconFlow accepts URLs directly
        imageContent = image;
      } else {
        // Try to read as local file path - read and convert to base64 data URL
        // Validate path is within allowed directories to prevent path traversal attacks
        if (!this.isPathAllowed(image)) {
          // Not a valid file path, assume raw base64 string, convert to data URL
          imageContent = `data:image/png;base64,${image}`;
        } else {
          try {
            const imageBuffer = fs.readFileSync(image);
            const base64Data = imageBuffer.toString("base64");

            // Determine mime type from file extension
            const ext = path.extname(image).toLowerCase();
            const mimeType =
              ext === ".png"
                ? "image/png"
                : ext === ".jpg" || ext === ".jpeg"
                  ? "image/jpeg"
                  : ext === ".webp"
                    ? "image/webp"
                    : "image/png";

            imageContent = `data:${mimeType};base64,${base64Data}`;
          } catch (fileError) {
            // Not a valid file path, assume raw base64 string, convert to data URL
            imageContent = `data:image/png;base64,${image}`;
          }
        }
      }

      // Build request body for image editing
      const requestBody: any = {
        model,
        prompt,
        image: imageContent,
      };

      const result = await this.makeApiCall("/images/generations", requestBody);

      if (!result.images || result.images.length === 0) {
        throw new Error("No edited image was returned");
      }

      // Download the edited image and convert to base64
      const img = result.images[0];
      const imageUrl = img.url;

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download edited image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Data = Buffer.from(imageBuffer).toString("base64");

      const mimeType = imageUrl.includes(".png")
        ? "image/png"
        : imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")
          ? "image/jpeg"
          : "image/png";

      return {
        data: base64Data,
        mimeType,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image editing failed: ${error.message}`);
      }
      throw new Error("Image editing failed with unknown error");
    }
  }

  /**
   * List all available image generation models
   */
  async listImageModels(): Promise<ModelInfo[]> {
    try {
      // Get all models, then filter for image generation models
      const result = await this.makeGetCall("/models", { type: "image" });

      if (!result.data || result.data.length === 0) {
        return [];
      }

      // Filter for text-to-image and image-to-image models
      const imageModels = result.data
        .filter((model: any) => {
          // SiliconFlow doesn't always provide detailed modality info in the basic list
          // We'll include models that are commonly known for image generation
          const modelId = model.id.toLowerCase();
          return (
            modelId.includes("flux") ||
            modelId.includes("sd") ||
            modelId.includes("stable-diffusion") ||
            modelId.includes("qwen-image") ||
            modelId.includes("kolors") ||
            modelId.includes("dall") ||
            modelId.includes("painting")
          );
        })
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          description: `Image generation model: ${model.id}`,
          output_modalities: ["image"],
        }));

      return imageModels;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list models: ${error.message}`);
      }
      throw new Error("Failed to list models with unknown error");
    }
  }

  /**
   * Test the API key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeGetCall("/models");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Map aspect ratio and image size to SiliconFlow's image_size format
   */
  private mapAspectRatioToSize(aspectRatio?: string, imageSize?: string, model?: string): string {
    // SiliconFlow uses "widthxheight" format
    // Based on their documentation, we'll map common aspect ratios

    // For Qwen models
    if (model && model.includes("qwen")) {
      const qwenSizes: { [key: string]: string } = {
        "1:1": "1328x1328",
        "16:9": "1664x928",
        "9:16": "928x1664",
        "4:3": "1472x1140",
        "3:4": "1140x1472",
        "3:2": "1584x1056",
        "2:3": "1056x1584",
      };
      if (aspectRatio && qwenSizes[aspectRatio]) {
        return qwenSizes[aspectRatio];
      }
    }

    // For Kolors models
    const kolorsSizes: { [key: string]: string } = {
      "1:1": "1024x1024",
      "3:4": "960x1280",
      "4:3": "1280x960",
      "1:2": "720x1440",
      "9:16": "720x1280",
      "16:9": "1280x720",
    };

    if (aspectRatio && kolorsSizes[aspectRatio]) {
      return kolorsSizes[aspectRatio];
    }

    // Default sizes
    if (imageSize === "4K") return "2048x2048";
    if (imageSize === "2K") return "1536x1536";

    // Default to 1024x1024
    return "1024x1024";
  }
}
