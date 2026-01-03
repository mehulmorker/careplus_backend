import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../auth.service";
import { UserService } from "../user.service";
import { IUserRepository } from "../../repositories/user.repository";
import { User, UserRole } from "@prisma/client";

// Mock bcrypt
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashedpassword123"),
    compare: vi.fn().mockImplementation((password: string, hash: string) => {
      return Promise.resolve(password === "correctpassword");
    }),
  },
}));

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  sign: vi.fn().mockReturnValue("mock-jwt-token"),
  verify: vi.fn().mockReturnValue({
    userId: "user-1",
    email: "test@example.com",
    role: "PATIENT",
  }),
}));

// Mock user data
const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  phone: "+1234567890",
  password: "hashedpassword123",
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

// Mock user service
const createMockUserService = () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  validateUniqueConstraints: vi.fn(),
});

describe("AuthService", () => {
  let service: AuthService;
  let mockRepository: ReturnType<typeof createMockRepository>;
  let mockUserService: ReturnType<typeof createMockUserService>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockUserService = createMockUserService();
    service = new AuthService(
      mockRepository,
      mockUserService as unknown as UserService
    );
    vi.clearAllMocks();
  });

  describe("register", () => {
    const registerInput = {
      email: "new@example.com",
      name: "New User",
      phone: "+9876543210",
      password: "password123",
    };

    it("should register user successfully", async () => {
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerInput);

      expect(result.success).toBe(true);
      expect(result.token).toBe("mock-jwt-token");
      expect(result.user).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should return error for short password", async () => {
      const result = await service.register({
        ...registerInput,
        password: "short",
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("password");
    });

    it("should handle duplicate email error", async () => {
      const { ValidationError } = await import("../../utils/errors");
      mockUserService.create.mockRejectedValue(
        new ValidationError("Email already registered")
      );

      const result = await service.register(registerInput);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe("Email already registered");
    });
  });

  describe("login", () => {
    const loginInput = {
      email: "test@example.com",
      password: "correctpassword",
    };

    it("should login successfully with correct credentials", async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.login(loginInput);

      expect(result.success).toBe(true);
      expect(result.token).toBe("mock-jwt-token");
      expect(result.user).toBeDefined();
    });

    it("should return error for nonexistent user", async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.login(loginInput);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe("Invalid email or password");
    });

    it("should return error for wrong password", async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.login({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe("Invalid email or password");
    });
  });

  describe("validateToken", () => {
    it("should validate valid token", async () => {
      const result = await service.validateToken("valid-token");

      expect(result.userId).toBe("user-1");
      expect(result.email).toBe("test@example.com");
    });

    it("should throw error for invalid token", async () => {
      const jwt = await import("jsonwebtoken");
      (jwt.verify as any).mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });

      await expect(service.validateToken("invalid-token")).rejects.toThrow();
    });
  });

  describe("hashPassword", () => {
    it("should hash password", async () => {
      const result = await service.hashPassword("mypassword");

      expect(result).toBe("hashedpassword123");
    });
  });

  describe("comparePasswords", () => {
    it("should return true for matching passwords", async () => {
      const result = await service.comparePasswords(
        "correctpassword",
        "hashedhash"
      );

      expect(result).toBe(true);
    });

    it("should return false for non-matching passwords", async () => {
      const result = await service.comparePasswords(
        "wrongpassword",
        "hashedhash"
      );

      expect(result).toBe(false);
    });
  });
});

