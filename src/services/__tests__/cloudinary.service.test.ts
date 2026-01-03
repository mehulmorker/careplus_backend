import { describe, it, expect, vi, beforeEach } from "vitest";
import { CloudinaryService } from "../cloudinary.service";
import { ValidationError } from "../../utils/errors";

// Mock Cloudinary config
const mockCloudinary = {
  uploader: {
    upload_stream: vi.fn(),
    upload: vi.fn(),
    destroy: vi.fn(),
  },
  url: vi.fn(),
  config: vi.fn(),
};

vi.mock("../../config/cloudinary", () => ({
  getCloudinary: () => mockCloudinary,
  isCloudinaryConfigured: vi.fn(() => true),
}));

describe("CloudinaryService", () => {
  let service: CloudinaryService;

  beforeEach(() => {
    service = new CloudinaryService();
    vi.clearAllMocks();
  });

  describe("uploadFile", () => {
    const mockUploadResult = {
      public_id: "test/public-id",
      url: "http://res.cloudinary.com/test/image/upload/test/public-id",
      secure_url: "https://res.cloudinary.com/test/image/upload/test/public-id",
      width: 800,
      height: 600,
      format: "jpg",
      bytes: 12345,
    };

    it("should upload file from buffer successfully", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      const mockBuffer = Buffer.from("test image data");
      const mockStream = {
        end: vi.fn(),
      };

      mockCloudinary.uploader.upload_stream.mockReturnValue(mockStream);

      // Simulate successful upload
      setTimeout(() => {
        const callback = mockCloudinary.uploader.upload_stream.mock.calls[0][1];
        callback(undefined, mockUploadResult);
      }, 0);

      const result = await service.uploadFile(mockBuffer, {
        folder: "test-folder",
      });

      expect(result.publicId).toBe("test/public-id");
      expect(result.secureUrl).toBe(mockUploadResult.secure_url);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.format).toBe("jpg");
      expect(result.bytes).toBe(12345);
      expect(mockStream.end).toHaveBeenCalledWith(mockBuffer);
    });

    it("should upload file from base64 string successfully", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      const base64String = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
      mockCloudinary.uploader.upload.mockResolvedValue(mockUploadResult);

      const result = await service.uploadFile(base64String, {
        folder: "test-folder",
      });

      expect(result.publicId).toBe("test/public-id");
      expect(result.secureUrl).toBe(mockUploadResult.secure_url);
      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        base64String,
        expect.objectContaining({
          folder: "test-folder",
        })
      );
    });

    it("should use default folder if not provided", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      const base64String = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
      mockCloudinary.uploader.upload.mockResolvedValue(mockUploadResult);

      await service.uploadFile(base64String);

      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        base64String,
        expect.objectContaining({
          folder: "carepulse",
        })
      );
    });

    it("should apply transformations when provided", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      const base64String = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
      mockCloudinary.uploader.upload.mockResolvedValue(mockUploadResult);

      await service.uploadFile(base64String, {
        transformation: {
          width: 500,
          height: 500,
          crop: "fill",
          quality: "auto",
        },
      });

      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        base64String,
        expect.objectContaining({
          transformation: [
            expect.objectContaining({
              width: 500,
              height: 500,
              crop: "fill",
              quality: "auto",
            }),
          ],
        })
      );
    });

    it("should throw ValidationError if Cloudinary is not configured", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(false);

      const base64String = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

      await expect(service.uploadFile(base64String)).rejects.toThrow(
        ValidationError
      );
      await expect(service.uploadFile(base64String)).rejects.toThrow(
        "Cloudinary is not configured"
      );
    });

    it("should throw ValidationError if upload fails", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      const base64String = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
      const uploadError = new Error("Upload failed: Network error");
      mockCloudinary.uploader.upload.mockRejectedValue(uploadError);

      await expect(service.uploadFile(base64String)).rejects.toThrow(
        ValidationError
      );
      await expect(service.uploadFile(base64String)).rejects.toThrow(
        "Failed to upload file"
      );
    });

    it("should handle upload stream error", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      const mockBuffer = Buffer.from("test image data");
      const mockStream = {
        end: vi.fn(),
      };
      const streamError = new Error("Stream error");

      mockCloudinary.uploader.upload_stream.mockReturnValue(mockStream);

      setTimeout(() => {
        const callback = mockCloudinary.uploader.upload_stream.mock.calls[0][1];
        callback(streamError, undefined);
      }, 0);

      await expect(
        service.uploadFile(mockBuffer, { folder: "test-folder" })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });

      const result = await service.deleteFile("test/public-id");

      expect(result).toBe(true);
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(
        "test/public-id",
        { resource_type: "image" }
      );
    });

    it("should return false if deletion result is not 'ok'", async () => {
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "not found" });

      const result = await service.deleteFile("test/public-id");

      expect(result).toBe(false);
    });

    it("should return false if Cloudinary is not configured", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(false);

      const result = await service.deleteFile("test/public-id");

      expect(result).toBe(false);
      expect(mockCloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it("should return false if deletion fails", async () => {
      mockCloudinary.uploader.destroy.mockRejectedValue(
        new Error("Delete failed")
      );

      const result = await service.deleteFile("test/public-id");

      expect(result).toBe(false);
    });

    it("should handle different resource types", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });

      await service.deleteFile("test/public-id", "video");

      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(
        "test/public-id",
        { resource_type: "video" }
      );
    });
  });

  describe("getImageUrl", () => {
    it("should generate image URL with transformations", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      mockCloudinary.url.mockReturnValue(
        "https://res.cloudinary.com/test/image/upload/w_500,h_500,c_fill/test/public-id"
      );

      const url = service.getImageUrl("test/public-id", {
        width: 500,
        height: 500,
        crop: "fill",
      });

      expect(url).toContain("res.cloudinary.com");
      expect(mockCloudinary.url).toHaveBeenCalledWith(
        "test/public-id",
        expect.objectContaining({
          secure: true,
          transformation: [
            expect.objectContaining({
              width: 500,
              height: 500,
              crop: "fill",
            }),
          ],
        })
      );
    });

    it("should generate image URL without transformations", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(true);
      
      mockCloudinary.url.mockReturnValue(
        "https://res.cloudinary.com/test/image/upload/test/public-id"
      );

      const url = service.getImageUrl("test/public-id");

      expect(url).toContain("res.cloudinary.com");
      expect(mockCloudinary.url).toHaveBeenCalledWith("test/public-id", {
        secure: true,
      });
    });

    it("should return empty string if Cloudinary is not configured", async () => {
      const { isCloudinaryConfigured } = await import("../../config/cloudinary");
      vi.mocked(isCloudinaryConfigured).mockReturnValue(false);

      const url = service.getImageUrl("test/public-id");

      expect(url).toBe("");
    });
  });
});

