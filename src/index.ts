#!/usr/bin/env node
/**
 * SiliconFlow Image MCP Server
 *
 * A Model Context Protocol server for image generation and editing using SiliconFlow
 * Optimized for China users
 */

// Handle build flag for compilation
if (process.argv.includes('--build')) {
  console.log('✅ Project structure is ready. Use "npm start" to run the server.');
  console.log('📝 Note: This project uses tsx for runtime execution.');
  process.exit(0);
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SiliconFlowService } from "./services/siliconflow.js";
import { createGenerateImageTool } from "./tools/generate.js";
import { createEditImageTool } from "./tools/edit.js";
import { createListModelsTool } from "./tools/list-models.js";

// Environment variable check
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY;
const MOCK_MODE = process.env.SILICONFLOW_MOCK === "true";

if (!SILICONFLOW_API_KEY && !MOCK_MODE) {
  console.error("❌ Error: SILICONFLOW_API_KEY environment variable is required");
  console.error("\nTo use this MCP server:");
  console.error("1. Get your API key from https://siliconflow.cn");
  console.error("2. Set it as an environment variable:");
  console.error("   export SILICONFLOW_API_KEY=your-api-key-here");
  console.error("\nFor Claude Desktop, add to your config.json:");
  console.error(`{
  "mcpServers": {
    "siliconflow-image-mcp": {
      "command": "npx",
      "args": ["-y", "siliconflow-image-mcp"],
      "env": {
        "SILICONFLOW_API_KEY": "your-api-key-here"
      }
    }
  }
}`);
  console.error("\nOr use mock mode for testing:");
  console.error("   export SILICONFLOW_MOCK=true");
  process.exit(1);
}

// Initialize services and server
async function main() {
  console.error("🚀 Starting SiliconFlow Image MCP Server...");

  try {
    // Initialize SiliconFlow service
    let siliconFlowService;
    if (MOCK_MODE) {
      console.error("⚠️  Running in MOCK mode - API calls will be simulated");
      // Create a mock service that returns fake data
      siliconFlowService = {
        generateImage: async () => [{ data: "mock-base64-data", mimeType: "image/png" }],
        editImage: async () => ({ data: "mock-base64-data", mimeType: "image/png" }),
        listImageModels: async () => [
          { id: "black-forest-labs/FLUX.1-dev", name: "FLUX.1-dev", description: "Mock model", output_modalities: ["image"] }
        ],
        testConnection: async () => true
      };
    } else {
      siliconFlowService = new SiliconFlowService(SILICONFLOW_API_KEY);

      // Test connection
      const isConnected = await siliconFlowService.testConnection();
      if (!isConnected) {
        console.error("❌ Failed to connect to SiliconFlow. Please check your API key.");
        process.exit(1);
      }
      console.error("✅ Connected to SiliconFlow successfully");
    }

    // Create MCP server
    const server = new McpServer({
      name: "siliconflow-image-mcp",
      version: "1.0.0",
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
    });

    // Register tools
    const generateTool = createGenerateImageTool(siliconFlowService);
    const editTool = createEditImageTool(siliconFlowService);
    const listModelsTool = createListModelsTool(siliconFlowService);

    server.registerTool(
      generateTool.name,
      {
        description: generateTool.description,
        inputSchema: generateTool.inputSchema,
      },
      generateTool.handler
    );

    server.registerTool(
      editTool.name,
      {
        description: editTool.description,
        inputSchema: editTool.inputSchema,
      },
      editTool.handler
    );

    server.registerTool(
      listModelsTool.name,
      {
        description: listModelsTool.description,
        inputSchema: listModelsTool.inputSchema,
      },
      listModelsTool.handler
    );

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("✅ SiliconFlow Image MCP Server is running");
    console.error("📋 Available tools: generate_image, edit_image, list_image_models");
    console.error("📝 Waiting for requests...");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.error("\n🛑 Shutting down gracefully...");
      await server.close();
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});