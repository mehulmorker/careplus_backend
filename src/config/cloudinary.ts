import { v2 as cloudinary } from "cloudinary";
import { env } from "./environment";
import { logger } from "../utils/logger";

/**
 * Initialize Cloudinary Configuration
 *
 * Configures Cloudinary SDK with credentials from environment variables.
 * Should be called once at application startup.
 */
export function initializeCloudinary(): void {
  try {
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      logger.warn(
        "Cloudinary credentials not found. Image upload functionality will be disabled."
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // Use HTTPS
    });

    logger.info("✅ Cloudinary configured successfully", {
      cloudName,
    });
  } catch (error) {
    logger.error("Failed to initialize Cloudinary", { error });
    throw error;
  }
}

/**
 * Get Cloudinary instance
 *
 * @returns Configured Cloudinary instance
 */
export function getCloudinary() {
  return cloudinary;
}

/**
 * Verify Cloudinary is configured
 *
 * @returns true if Cloudinary is properly configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
}
