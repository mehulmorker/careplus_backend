import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { getCloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { logger } from "../utils/logger";
import { ValidationError } from "../utils/errors";

/**
 * Cloudinary Upload Options
 */
export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
  overwrite?: boolean;
  resourceType?: "image" | "video" | "raw" | "auto";
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  };
}

/**
 * Cloudinary Upload Result
 */
export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * Cloudinary Service
 *
 * Handles image and file uploads to Cloudinary.
 * Provides methods for uploading, deleting, and transforming images.
 */
export class CloudinaryService {
  /**
   * Upload a file to Cloudinary
   *
   * @param file - File buffer or base64 string
   * @param options - Upload options (folder, transformations, etc.)
   * @returns Upload result with URL and metadata
   * @throws ValidationError if Cloudinary is not configured or upload fails
   */
  async uploadFile(
    file: Buffer | string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!isCloudinaryConfigured()) {
      throw new ValidationError(
        "Cloudinary is not configured. Please check your environment variables."
      );
    }

    try {
      const cloudinary = getCloudinary();

      // Default options
      const uploadOptions = {
        folder: options.folder || "carepulse",
        overwrite: options.overwrite ?? false,
        resource_type: options.resourceType || "auto",
        ...(options.publicId && { public_id: options.publicId }),
        ...(options.transformation && {
          transformation: [
            {
              ...(options.transformation.width && {
                width: options.transformation.width,
              }),
              ...(options.transformation.height && {
                height: options.transformation.height,
              }),
              ...(options.transformation.crop && {
                crop: options.transformation.crop,
              }),
              ...(options.transformation.quality && {
                quality: options.transformation.quality,
              }),
              ...(options.transformation.format && {
                format: options.transformation.format,
              }),
            },
          ],
        }),
      };

      let uploadResult: UploadApiResponse;

      if (Buffer.isBuffer(file)) {
        // Upload from buffer
        uploadResult = await new Promise<UploadApiResponse>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              uploadOptions,
              (
                error: UploadApiErrorResponse | undefined,
                result: UploadApiResponse | undefined
              ) => {
                if (error) {
                  reject(error);
                } else if (result) {
                  resolve(result);
                } else {
                  reject(new Error("Upload failed: No result returned"));
                }
              }
            );
            uploadStream.end(file);
          }
        );
      } else {
        // Upload from base64 string
        uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
      }

      logger.info("File uploaded to Cloudinary", {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
      });

      return {
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      };
    } catch (error: any) {
      logger.error("Failed to upload file to Cloudinary", {
        error: error.message,
        options,
      });
      throw new ValidationError(
        `Failed to upload file: ${error.message || "Unknown error"}`
      );
    }
  }

  /**
   * Delete a file from Cloudinary
   *
   * @param publicId - Cloudinary public ID of the file to delete
   * @param resourceType - Type of resource (image, video, raw)
   * @returns true if deletion was successful
   */
  async deleteFile(
    publicId: string,
    resourceType: "image" | "video" | "raw" = "image"
  ): Promise<boolean> {
    if (!isCloudinaryConfigured()) {
      logger.warn("Cloudinary not configured, skipping file deletion", {
        publicId,
      });
      return false;
    }

    try {
      const cloudinary = getCloudinary();
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result === "ok") {
        logger.info("File deleted from Cloudinary", { publicId });
        return true;
      } else {
        logger.warn("File deletion returned unexpected result", {
          publicId,
          result: result.result,
        });
        return false;
      }
    } catch (error: any) {
      logger.error("Failed to delete file from Cloudinary", {
        error: error.message,
        publicId,
      });
      return false;
    }
  }

  /**
   * Generate a Cloudinary URL with transformations
   *
   * @param publicId - Cloudinary public ID
   * @param transformations - Transformation options
   * @returns Transformed image URL
   */
  getImageUrl(
    publicId: string,
    transformations?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
    }
  ): string {
    if (!isCloudinaryConfigured()) {
      return "";
    }

    const cloudinary = getCloudinary();
    return cloudinary.url(publicId, {
      ...(transformations && {
        transformation: [
          {
            ...(transformations.width && { width: transformations.width }),
            ...(transformations.height && { height: transformations.height }),
            ...(transformations.crop && { crop: transformations.crop }),
            ...(transformations.quality && {
              quality: transformations.quality,
            }),
            ...(transformations.format && { format: transformations.format }),
          },
        ],
      }),
      secure: true,
    });
  }
}

/**
 * Create Cloudinary Service instance
 */
export function createCloudinaryService(): CloudinaryService {
  return new CloudinaryService();
}
