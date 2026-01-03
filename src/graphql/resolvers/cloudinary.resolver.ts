import { Context } from "../context";
import { logger } from "../../utils/logger";

/**
 * Cloudinary Resolvers
 *
 * Handles GraphQL operations for image/file uploads:
 * - uploadImage: Upload image to Cloudinary
 * - deleteImage: Delete image from Cloudinary
 */
export const cloudinaryResolvers = {
  Mutation: {
    /**
     * Upload an image to Cloudinary
     *
     * Accepts base64 encoded image and uploads to Cloudinary.
     * Returns the uploaded image URL and metadata.
     *
     * @param input - Upload input (base64 file, folder, transformations)
     * @returns ImageUploadPayload with image URL and metadata
     */
    uploadImage: async (
      _parent: unknown,
      {
        input,
      }: {
        input: {
          file: string;
          folder?: string;
          publicId?: string;
          transformation?: any;
        };
      },
      context: Context
    ) => {
      logger.info("Resolver: uploadImage", { folder: input.folder });

      try {
        // Convert base64 to buffer
        const base64Data = input.file.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Upload to Cloudinary
        const result = await context.services.cloudinary.uploadFile(buffer, {
          folder: input.folder || "carepulse",
          publicId: input.publicId,
          transformation: input.transformation,
        });

        return {
          success: true,
          image: result,
          errors: [],
        };
      } catch (error: any) {
        logger.error("Failed to upload image", { error: error.message });
        return {
          success: false,
          image: null,
          errors: [
            {
              message: error.message || "Failed to upload image",
              field: "file",
            },
          ],
        };
      }
    },

    /**
     * Delete an image from Cloudinary
     *
     * @param publicId - Cloudinary public ID of the image to delete
     * @returns true if deletion was successful
     */
    deleteImage: async (
      _parent: unknown,
      { publicId }: { publicId: string },
      context: Context
    ): Promise<boolean> => {
      logger.info("Resolver: deleteImage", { publicId });

      try {
        const success = await context.services.cloudinary.deleteFile(publicId);
        return success;
      } catch (error: any) {
        logger.error("Failed to delete image", {
          error: error.message,
          publicId,
        });
        return false;
      }
    },
  },
};
