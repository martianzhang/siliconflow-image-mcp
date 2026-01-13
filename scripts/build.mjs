#!/usr/bin/env node

/**
 * Build script for SiliconFlow Image MCP
 * Uses esbuild for faster, memory-efficient compilation
 */

import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔨 Building SiliconFlow Image MCP...\n');

  // Check if dist directory exists
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  try {
    // Build with esbuild (much faster and memory efficient)
    // Output ES modules to match official MCP server pattern
    await build({
      entryPoints: ['src/index.ts'],
      outdir: 'dist',
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node18',
      sourcemap: true,
      minify: false,
      keepNames: true,
      external: [
        // These are handled by the MCP SDK and other dependencies
        '@modelcontextprotocol/sdk',
        'zod',
      ],
    });

    // Make dist/index.js executable
    const indexPath = path.join(distDir, 'index.js');
    fs.chmodSync(indexPath, 0o755);

    // Copy README and LICENSE
    const filesToCopy = ['README.md', 'LICENSE'];
    filesToCopy.forEach(file => {
      const src = path.join(process.cwd(), file);
      const dest = path.join(distDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    });

    console.log('✅ Build completed successfully!');
    console.log('📁 Output: dist/');
    console.log('📦 Ready for npm publish or local use');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Install esbuild if not present
async function ensureEsbuild() {
  try {
    await import('esbuild');
  } catch {
    console.log('📦 Installing esbuild...');
    execSync('npm install esbuild --no-save', { stdio: 'inherit' });
  }
}

await ensureEsbuild();
await main();
