import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../user.service";
import { IUserRepository } from "../../repositories/user.repository";
import { ValidationError, NotFoundError } from "../../utils/errors";
import { User, UserRole } from "@prisma/client";

// Mock user data
const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  phone: "+1234567890",
  password: "hashedpassword",
  role: UserRole.PATIENT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock repository
const createMockRepository = () => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByPhone: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  existsByEmail: vi.fn(),
  existsByPhone: vi.fn(),
});

describe("UserService", () => {
  let service: UserService;
  let mockRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new UserService(mockRepository);
    vi.clearAllMocks();
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById("user-1");

      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith("user-1");
    });

    it("should throw NotFoundError when user not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("findByEmail", () => {
    it("should return user when found", async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
    });

    it("should return null when user not found", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail("notfound@example.com");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    const createInput = {
      email: "new@example.com",
      name: "New User",
      phone: "+9876543210",
      password: "hashedpassword123",
    };

    it("should create user with valid input", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByPhone.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        ...mockUser,
        ...createInput,
        id: "new-user-id",
      });

      const result = await service.create(createInput);

      expect(result.email).toBe(createInput.email);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it("should throw ValidationError for duplicate email", async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createInput)).rejects.toThrow(ValidationError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError for duplicate phone", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByPhone.mockResolvedValue(mockUser);

      await expect(service.create(createInput)).rejects.toThrow(ValidationError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const updateInput = {
      name: "Updated Name",
    };

    it("should update user with valid input", async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({
        ...mockUser,
        name: "Updated Name",
      });

      const result = await service.update("user-1", updateInput);

      expect(result.name).toBe("Updated Name");
      expect(mockRepository.update).toHaveBeenCalledWith("user-1", {
        name: "Updated Name",
      });
    });

    it("should throw NotFoundError for nonexistent user", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update("nonexistent", updateInput)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("delete", () => {
    it("should delete user", async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.delete.mockResolvedValue(mockUser);

      const result = await service.delete("user-1");

      expect(result).toEqual(mockUser);
      expect(mockRepository.delete).toHaveBeenCalledWith("user-1");
    });

    it("should throw NotFoundError for nonexistent user", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("validateUniqueConstraints", () => {
    it("should pass for unique email and phone", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findByPhone.mockResolvedValue(null);

      await expect(
        service.validateUniqueConstraints("unique@example.com", "+1111111111")
      ).resolves.not.toThrow();
    });

    it("should throw for duplicate email", async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);
      mockRepository.findByPhone.mockResolvedValue(null);

      await expect(
        service.validateUniqueConstraints("test@example.com", "+1111111111")
      ).rejects.toThrow(ValidationError);
    });

    it("should allow same user's email when excludeId provided", async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);
      mockRepository.findByPhone.mockResolvedValue(null);

      await expect(
        service.validateUniqueConstraints(
          "test@example.com",
          "+1111111111",
          "user-1" // Same as mockUser.id
        )
      ).resolves.not.toThrow();
    });
  });
});

