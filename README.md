# SiliconFlow Image MCP

A Model Context Protocol (MCP) server for image generation and editing using **SiliconFlow** - optimized for China users with fast, reliable access.

## ✨ Features

- 🇨🇳 **China Optimized** - Fast, reliable access from mainland China without VPN
- 🖼️ **Image Generation** - Generate stunning images from text prompts
- ✏️ **Image Editing** - Edit existing images with AI-powered modifications
- 🔍 **Model Discovery** - Browse available image generation models
- 📊 **Multiple Formats** - Support for various aspect ratios and resolutions
- 🚀 **Easy Integration** - Simple setup with Claude Desktop and other MCP clients
- ⚡ **Advanced Options** - Negative prompts, seeds, CFG values
- 🖥️ **Cross-Platform** - Native support for Linux, macOS, and Windows
- 📁 **Custom Storage** - Configure where images are saved via environment variable
- 🧪 **Mock Mode** - Test without making real API calls

## 📦 Installation

### Using NPX (Recommended)
```bash
# No installation needed - use directly via npx
npx siliconflow-image-mcp
```

### Global Install
```bash
npm install -g siliconflow-image-mcp
siliconflow-image-mcp
```

## ⚙️ Setup

### 1. Get SiliconFlow API Key
- Visit [SiliconFlow Console](https://siliconflow.cn)
- Create an account and get your API key
- The service is optimized for China network conditions

### 2. Configure Environment
```bash
export SILICONFLOW_API_KEY="your-siliconflow-api-key"

# Optional: Custom directory for saved images (default: system temp dir)
export SILICONFLOW_IMAGE_DIR="/path/to/your/images"

# Optional: Mock mode for testing (no real API calls)
export SILICONFLOW_MOCK="true"
```

### 3. Claude Desktop Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "siliconflow-image-mcp": {
      "command": "npx",
      "args": ["-y", "siliconflow-image-mcp"],
      "env": {
        "SILICONFLOW_API_KEY": "your-siliconflow-key",
        "SILICONFLOW_IMAGE_DIR": "/path/to/save/images",
        "SILICONFLOW_API_URL": "https://your-custom-endpoint.com/v1"
      }
    }
  }
}
```

**Restart Claude Desktop** after adding the configuration.

## 🛠️ Available Tools

### 1. `generate_image`
Generate images from text descriptions.

**Parameters:**
- `prompt` (required): Detailed description of the image to generate
- `model` (optional): Model ID (default: `black-forest-labs/FLUX.1-dev`)
- `aspectRatio` (optional): Aspect ratio - `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- `imageSize` (optional): Image size - `1K`, `2K`, `4K`
- `count` (optional): Number of images (1-4, default: 1)
- `negativePrompt` (optional): What to avoid in the image
- `seed` (optional): Seed for reproducible results

**Example:**
```
Generate a beautiful sunset over mountains with a lake in the foreground,
in 16:9 aspect ratio, 4K resolution
```

### 2. `edit_image`
Edit existing images with AI instructions.

**Parameters:**
- `image` (required): Base64 encoded image data or image URL
- `prompt` (required): Instructions for editing
- `model` (optional): Model ID (default: `Qwen/Qwen-Image-Edit-2509`)

**Example:**
```
Edit this image to make it brighter and increase the saturation
```

### 3. `list_image_models`
List all available image generation models.

**Parameters:** None

**Example:**
```
Show me available image generation models
```

## 💡 Usage Examples

### Basic Image Generation
```
Generate an image of a futuristic cityscape at night with neon lights
```

### Multiple Images
```
Generate 3 different variations of a cute cat wearing a hat
```

### Specific Aspect Ratio
```
Create a portrait of a wizard in 9:16 aspect ratio for mobile wallpaper
```

### High Resolution
```
Generate a detailed landscape in 4K resolution with 16:9 aspect ratio
```

### Image Editing
```
Edit this image to make it look like a vintage photograph from the 1950s
```

### Advanced Options
```
Generate a photorealistic portrait using black-forest-labs/FLUX.1-dev
with negative prompt "blurry, low quality" and seed 12345
```

## 🔧 Model Recommendations

### SiliconFlow Models
- `black-forest-labs/FLUX.1-dev` - High quality general purpose (default)
- `Qwen/Qwen-Image-Edit-2509` - Excellent for image editing (default)
- `Kwai-Kolors/Kolors` - Good for artistic styles
- `stabilityai/stable-diffusion-xl-base-1.0` - Classic stable diffusion

## 🌏 China-Specific Benefits

### SiliconFlow Advantages:
- ✅ **Fast access** from mainland China
- ✅ **Stable connection** without VPN
- ✅ **Chinese language support**
- ✅ **Local payment methods**
- ✅ **Optimized infrastructure**

### Network Performance:
- Average response time: < 2 seconds from China
- 99.9% uptime from Chinese networks
- No Great Firewall interference

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SILICONFLOW_API_KEY` | **Yes** | - | Your SiliconFlow API key from [siliconflow.cn](https://siliconflow.cn) |
| `SILICONFLOW_API_URL` | No | `https://api.siliconflow.cn/v1` | Custom API base URL for third-party endpoints |
| `SILICONFLOW_IMAGE_DIR` | No | System temp dir | Custom directory to save generated/edited images |
| `SILICONFLOW_MOCK` | No | `false` | Enable mock mode for testing (no real API calls) |

### Examples

**Linux/macOS:**
```bash
export SILICONFLOW_API_KEY="sk-xxxxx"
export SILICONFLOW_IMAGE_DIR="/home/user/siliconflow-images"

# Use custom API endpoint (e.g., for third-party compatible services)
export SILICONFLOW_API_URL="https://your-custom-endpoint.com/v1"
```

**Windows CMD:**
```cmd
set SILICONFLOW_API_KEY=sk-xxxxx
set SILICONFLOW_IMAGE_DIR=C:\Users\MyUser\Images
set SILICONFLOW_API_URL=https://your-custom-endpoint.com/v1
```

**Windows PowerShell:**
```powershell
$env:SILICONFLOW_API_KEY="sk-xxxxx"
$env:SILICONFLOW_IMAGE_DIR="C:\Users\MyUser\Images"
$env:SILICONFLOW_API_URL="https://your-custom-endpoint.com/v1"
```

## 🔒 Security

- **API Key**: Your API keys are stored securely in environment variables
- **Input Validation**: All inputs are validated using Zod schemas
- **Rate Limiting**: Respect service provider limits
- **Content Filtering**: Consider implementing content policies for your use case
- **File Storage**: Images are saved to your specified directory or system temp

## 🐛 Troubleshooting

### "No API key provided"
Make sure you've set the environment variable:
```bash
export SILICONFLOW_API_KEY="your-key"
```

### "Failed to connect to SiliconFlow"
- Check your API key is valid
- Verify network connectivity to `api.siliconflow.cn`
- Check SiliconFlow service status

### "No images were generated"
- Try a more descriptive prompt
- Check if the model supports image generation
- Verify your API key has access to the model

### Images not appearing in Claude
- Restart Claude Desktop after configuration changes
- Check the MCP server logs for errors
- Verify the server is running with `npm start`

### Images saved to wrong location
- Set `SILICONFLOW_IMAGE_DIR` to your desired path
- Ensure the directory exists and is writable
- Default location: system temp directory (`/tmp/siliconflow-images/` on Linux/macOS)

### Running on Windows
- Use the `.cmd` wrapper automatically provided by npm
- Or use Git Bash/WSL for Unix-style commands
- For native CMD/PowerShell, the `.cmd` file handles execution

## 💰 Pricing

### SiliconFlow:
- **FLUX.1-dev**: ~¥0.02-0.05 per image
- **Qwen-Image**: ~¥0.01-0.03 per image
- **Kolors**: ~¥0.01-0.02 per image
- **Free tier**: Available for new users

*Check [SiliconFlow pricing](https://siliconflow.cn/pricing) for current rates.*

## 🚀 Development

### Local Development
```bash
# Clone the repository
git clone https://github.com/martianzhang/siliconflow-image-mcp.git
cd siliconflow-image-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start the server
npm start
```

### Project Structure
```
src/
├── index.ts              # Main server entry
├── tools/
│   ├── generate.ts       # Image generation tool
│   ├── edit.ts           # Image editing tool
│   └── list-models.ts    # Model discovery tool
├── services/
│   └── siliconflow.ts    # SiliconFlow service wrapper
└── types/
    └── index.ts          # Type definitions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [SiliconFlow Documentation](https://docs.siliconflow.cn)
- [SiliconFlow API Reference](https://docs.siliconflow.cn/cn/api-reference/images/images-generations)
- [MCP Specification](https://modelcontextprotocol.io)
- [Report Issues](https://github.com/martianzhang/siliconflow-image-mcp/issues)

---

**Made with ❤️ for the AI community - With special support for China users**
