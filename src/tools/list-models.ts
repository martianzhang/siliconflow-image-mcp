/**
 * List image models tool implementation for SiliconFlow
 */

import { SiliconFlowService } from "../services/siliconflow.js";
import { ListModelsInputSchema, ToolResponse } from "../types/index.js";

export function createListModelsTool(service: SiliconFlowService) {
  return {
    name: "list_image_models",
    description:
      "List all available image generation models from SiliconFlow. Shows model IDs and capabilities.",
    inputSchema: ListModelsInputSchema,

    handler: async (input: unknown): Promise<ToolResponse> => {
      const parsed = ListModelsInputSchema.safeParse(input);

      if (!parsed.success) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid input: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      try {
        const models = await service.listImageModels();

        if (models.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No image generation models found. This might be a temporary issue with the API.",
              },
            ],
            isError: true,
          };
        }

        // Format the response for readability
        const modelList = models
          .map((model, index) => {
            const parts = [
              `${index + 1}. **${model.name}** (\`${model.id}\`)`,
              model.description ? `   - ${model.description}` : null,
              model.output_modalities
                ? `   - Capabilities: ${model.output_modalities.join(", ")}`
                : null,
            ].filter(Boolean);

            return parts.join("\n");
          })
          .join("\n\n");

        // Add SiliconFlow-specific usage tips
        const usageTips = `\n\n---\n\n**Usage:** Use the \`generate_image\` tool with the model ID to generate images.\n\n**SiliconFlow Tips:**\n- Recommended models: \`black-forest-labs/FLUX.1-dev\` (generation), \`Qwen/Qwen-Image-Edit-2509\` (editing)\n- Supports advanced options: negative prompts, seeds, CFG values\n- Image sizes: Use aspect ratios like "1:1", "16:9", "9:16"\n- Optimized for China users with fast local network access`;

        return {
          content: [
            {
              type: "text",
              text: `## Available Image Generation Models (SiliconFlow)\n\nFound ${models.length} model${models.length > 1 ? "s" : ""} that support image generation:\n\n${modelList}${usageTips}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list models: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
