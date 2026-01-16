/**
 * File utility functions for saving images
 */

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

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
 * Maximum size for saved image files (10 MB)
 * Prevents disk space exhaustion attacks
 */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validate base64 data format and size
 * @param base64Data - Base64 encoded image data to validate
 * @throws Error if validation fails
 */
function validateBase64Image(base64Data: string): void {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Invalid image data: expected string");
  }

  // Check for basic base64 format (alphanumeric, +, /, =)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Data)) {
    throw new Error("Invalid base64 format");
  }

  // Estimate decoded size (base64 is ~4/3 of original size)
  const estimatedSize = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedSize > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large: estimated ${estimatedSize} bytes exceeds maximum ${MAX_IMAGE_SIZE} bytes`);
  }
}

/**
 * Validate MIME type to prevent format confusion attacks
 * @param mimeType - MIME type to validate
 * @throws Error if MIME type is invalid
 */
function validateMimeType(mimeType: string): void {
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Invalid MIME type: ${mimeType}. Allowed types: ${allowedMimeTypes.join(", ")}`);
  }
}

/**
 * Save base64 image data to a temporary file
 * @param base64Data - Base64 encoded image data (from network/external source)
 * @param prefix - Prefix for the filename
 * @param mimeType - MIME type to determine file extension
 * @returns Path to the saved file
 * @throws Error if validation fails or file cannot be written
 */
export async function saveImageToFile(
  base64Data: string,
  prefix: string,
  mimeType: string,
): Promise<string> {
  // Validate untrusted data before writing to filesystem
  validateBase64Image(base64Data);
  validateMimeType(mimeType);

  const tempDir = getImageBaseDir();
  await fs.mkdir(tempDir, { recursive: true });

  const extension = mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpg" :
                    mimeType === "image/webp" ? "webp" : "png";
  // Use cryptographically secure random bytes to prevent race conditions and prediction attacks
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const filename = `${prefix}_${randomSuffix}.${extension}`;
  const filepath = path.join(tempDir, filename);

  // Decode and write buffer
  const buffer = Buffer.from(base64Data, "base64");

  // Additional size check after decoding (defense in depth)
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Decoded image too large: ${buffer.length} bytes exceeds maximum ${MAX_IMAGE_SIZE} bytes`);
  }

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
