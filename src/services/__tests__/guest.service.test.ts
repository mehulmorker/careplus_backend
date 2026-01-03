import { describe, it, expect, vi, beforeEach } from "vitest";
import { GuestService, CreateGuestUserInput } from "../guest.service";
import { IUserRepository } from "../../repositories/user.repository";
import { IPatientRepository } from "../../repositories/patient.repository";
import { UserService } from "../user.service";
import { User, Patient, Gender, UserRole } from "@prisma/client";
import { ConflictError, ValidationError } from "../../utils/errors";

// Mock user data
const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  phone: "+1234567890",
  password: null, // Guest user has no password
  role: UserRole.PATIENT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock patient data
const mockPatient: Patient = {
  id: "patient-1",
  userId: "user-1",
  birthDate: new Date("1990-01-01"),
  gender: Gender.OTHER,
  address: "Not provided",
  occupation: "Not provided",
  emergencyContactName: "Not provided",
  emergencyContactNumber: "Not provided",
  primaryPhysician: "Not assigned",
  insuranceProvider: "Not provided",
  insurancePolicyNumber: "Not provided",
  allergies: null,
  currentMedication: null,
  familyMedicalHistory: null,
  pastMedicalHistory: null,
  identificationType: null,
  identificationNumber: null,
  identificationDocumentId: null,
  identificationDocumentUrl: null,
  privacyConsent: true,
  treatmentConsent: true,
  disclosureConsent: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock repositories
const createMockUserRepository = () => ({
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

const createMockPatientRepository = () => ({
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  existsByUserId: vi.fn(),
});

const createMockUserService = () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe("GuestService", () => {
  let service: GuestService;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockPatientRepository: ReturnType<typeof createMockPatientRepository>;
  let mockUserService: ReturnType<typeof createMockUserService>;

  const guestInput: CreateGuestUserInput = {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
  };

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockPatientRepository = createMockPatientRepository();
    mockUserService = createMockUserService();
    service = new GuestService(
      mockUserRepository as unknown as IUserRepository,
      mockUserService as unknown as UserService,
      mockPatientRepository as unknown as IPatientRepository
    );
    vi.clearAllMocks();
  });

  describe("createGuestUserAndPatient", () => {
    it("should create new guest user and patient successfully", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByPhone.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockPatientRepository.create.mockResolvedValue(mockPatient);

      const result = await service.createGuestUserAndPatient(guestInput);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.patient).toEqual(mockPatient);
      expect(result.errors).toEqual([]);
      expect(mockUserService.create).toHaveBeenCalledWith({
        email: guestInput.email,
        name: guestInput.name,
        phone: guestInput.phone,
      });
      expect(mockPatientRepository.create).toHaveBeenCalled();
    });

    it("should return existing user and patient if both exist", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPatientRepository.findByUserId.mockResolvedValue(mockPatient);

      const result = await service.createGuestUserAndPatient(guestInput);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.patient).toEqual(mockPatient);
      expect(result.errors).toEqual([]);
      expect(mockUserService.create).not.toHaveBeenCalled();
      expect(mockPatientRepository.create).not.toHaveBeenCalled();
    });

    it("should create patient profile if user exists but no patient", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPatientRepository.findByUserId.mockResolvedValue(null);
      mockPatientRepository.create.mockResolvedValue(mockPatient);

      const result = await service.createGuestUserAndPatient(guestInput);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.patient).toEqual(mockPatient);
      expect(result.errors).toEqual([]);
      expect(mockPatientRepository.create).toHaveBeenCalled();
    });

    it("should return error if phone number already exists", async () => {
      const existingUserByPhone = {
        ...mockUser,
        id: "user-2",
        email: "other@example.com",
      };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByPhone.mockResolvedValue(existingUserByPhone);

      const result = await service.createGuestUserAndPatient(guestInput);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("phone");
      expect(result.errors[0].message).toContain(
        "Phone number already registered"
      );
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it("should handle ValidationError from user service", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByPhone.mockResolvedValue(null);
      mockUserService.create.mockRejectedValue(
        new ValidationError("Invalid email format")
      );

      const result = await service.createGuestUserAndPatient(guestInput);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Invalid email format");
    });

    it("should handle ConflictError from user service", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByPhone.mockResolvedValue(null);
      mockUserService.create.mockRejectedValue(
        new ConflictError("Email already exists")
      );

      const result = await service.createGuestUserAndPatient(guestInput);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Email already exists");
    });

    it("should throw unexpected errors", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByPhone.mockResolvedValue(null);
      mockUserService.create.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        service.createGuestUserAndPatient(guestInput)
      ).rejects.toThrow("Database connection failed");
    });

    it("should create minimal patient with correct default values", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByPhone.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockPatientRepository.create.mockResolvedValue(mockPatient);

      await service.createGuestUserAndPatient(guestInput);

      const createCall = mockPatientRepository.create.mock.calls[0][0];
      expect(createCall.user.connect.id).toBe(mockUser.id);
      expect(createCall.gender).toBe(Gender.OTHER);
      expect(createCall.address).toBe("Not provided");
      expect(createCall.privacyConsent).toBe(true);
      expect(createCall.treatmentConsent).toBe(true);
      expect(createCall.disclosureConsent).toBe(true);
    });
  });
});
