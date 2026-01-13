/**
 * Image generation tool implementation for SiliconFlow
 */

import { z } from "zod";
import { SiliconFlowService } from "../services/siliconflow.js";
import { GenerateImageInputSchema, ToolResponse } from "../types/index.js";
import { saveImageToFile, getTempDir } from "../utils/file.js";

export function createGenerateImageTool(service: SiliconFlowService) {
  return {
    name: "generate_image",
    description: "Generate images using SiliconFlow's AI models. Supports various aspect ratios, image sizes, negative prompts, and seeds for reproducible results. Images are saved to temporary files and paths are returned.",
    inputSchema: GenerateImageInputSchema,

    handler: async (input: unknown): Promise<ToolResponse> => {
      const parsed = GenerateImageInputSchema.safeParse(input);

      if (!parsed.success) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid input: ${parsed.error.errors.map(e => e.message).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      const { prompt, model, aspectRatio, imageSize, count, negativePrompt, seed } = parsed.data;

      try {
        const images = await service.generateImage(
          prompt,
          model || "black-forest-labs/FLUX.1-dev",
          aspectRatio,
          imageSize,
          count,
          negativePrompt,
          seed
        );

        if (images.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No images were generated. Please try a different prompt.",
              },
            ],
            isError: true,
          };
        }

        // Save images to files and return file paths
        const savedFiles: string[] = [];

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const filepath = await saveImageToFile(img.data, `generated_${i + 1}`, img.mimeType);
          savedFiles.push(filepath);
        }

        // Create response with file paths
        const tempDir = getTempDir();
        const response: ToolResponse = {
          content: [
            {
              type: "text",
              text: `Successfully generated ${images.length} image${images.length > 1 ? "s" : ""} for prompt: "${prompt}"\n` +
                    `Saved to:\n${savedFiles.map(f => `- ${f}`).join("\n")}\n\n` +
                    `Temporary directory: ${tempDir}\n` +
                    `Note: These are temporary files. Use the file paths to access the images.`,
            },
          ],
        };

        return response;
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Image generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}