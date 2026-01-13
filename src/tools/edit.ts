/**
 * Image editing tool implementation for SiliconFlow
 */

import { z } from "zod";
import { SiliconFlowService } from "../services/siliconflow.js";
import { EditImageInputSchema, ToolResponse } from "../types/index.js";
import { saveImageToFile, getTempDir } from "../utils/file.js";

export function createEditImageTool(service: SiliconFlowService) {
  return {
    name: "edit_image",
    description: "Edit existing images using SiliconFlow's AI models. Accepts base64 encoded image data, image URLs, or local file paths. Provide instructions for modifications. Uses Qwen/Qwen-Image-Edit-2509 by default. Images are saved to temporary files and paths are returned.",
    inputSchema: EditImageInputSchema,

    handler: async (input: unknown): Promise<ToolResponse> => {
      const parsed = EditImageInputSchema.safeParse(input);

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

      const { image, prompt, model } = parsed.data;

      try {
        const editedImage = await service.editImage(
          image,
          prompt,
          model || "Qwen/Qwen-Image-Edit-2509"
        );

        // Save edited image to file
        const filepath = await saveImageToFile(editedImage.data, "edited", editedImage.mimeType);

        // Create response with file path
        const tempDir = getTempDir();
        const response: ToolResponse = {
          content: [
            {
              type: "text",
              text: `Successfully edited image with prompt: "${prompt}"\n` +
                    `Saved to: ${filepath}\n\n` +
                    `Temporary directory: ${tempDir}\n` +
                    `Note: This is a temporary file. Use the file path to access the image.`,
            },
          ],
        };

        return response;
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Image editing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}