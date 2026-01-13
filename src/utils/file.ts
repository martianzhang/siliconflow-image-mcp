/**
 * File utility functions for saving images
 */

import { promises as fs } from "fs";
import path from "path";
import os from "os";

/**
 * Get the base directory for storing images
 * Uses SILICONFLOW_IMAGE_DIR env var if set, otherwise defaults to system temp dir
 */
function getImageBaseDir(): string {
  const customDir = process.env.SILICONFLOW_IMAGE_DIR;
  if (customDir) {
    return customDir;
  }
  return path.join(os.tmpdir(), "siliconflow-images");
}

/**
 * Save base64 image data to a temporary file
 * @param base64Data - Base64 encoded image data
 * @param prefix - Prefix for the filename
 * @param mimeType - MIME type to determine file extension
 * @returns Path to the saved file
 */
export async function saveImageToFile(
  base64Data: string,
  prefix: string,
  mimeType: string,
): Promise<string> {
  const tempDir = getImageBaseDir();
  await fs.mkdir(tempDir, { recursive: true });

  const extension = mimeType === "image/jpeg" ? "jpg" : "png";
  const timestamp = Date.now();
  const filename = `${prefix}_${timestamp}.${extension}`;
  const filepath = path.join(tempDir, filename);

  const buffer = Buffer.from(base64Data, "base64");
  await fs.writeFile(filepath, buffer);

  return filepath;
}

/**
 * Get the temporary directory path for siliconflow images
 * Uses SILICONFLOW_IMAGE_DIR env var if set, otherwise defaults to system temp dir
 * @returns The temporary directory path
 */
export function getTempDir(): string {
  return getImageBaseDir();
}
