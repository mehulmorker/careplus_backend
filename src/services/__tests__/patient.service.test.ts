import { describe, it, expect, vi, beforeEach } from "vitest";
import { PatientService } from "../patient.service";
import { IPatientRepository } from "../../repositories/patient.repository";
import { IUserRepository } from "../../repositories/user.repository";
import { NotFoundError } from "../../utils/errors";
import { Patient, User, Gender, UserRole } from "@prisma/client";

// Mock patient data
const mockPatient: Patient = {
  id: "patient-1",
  userId: "user-1",
  birthDate: new Date("1990-01-15"),
  gender: Gender.MALE,
  address: "123 Test St",
  occupation: "Software Engineer",
  emergencyContactName: "Jane Doe",
  emergencyContactNumber: "+1234567890",
  primaryPhysician: "Dr. Smith",
  insuranceProvider: "BlueCross",
  insurancePolicyNumber: "ABC123",
  allergies: "Peanuts",
  currentMedication: "None",
  familyMedicalHistory: "None",
  pastMedicalHistory: "None",
  identificationType: "Passport",
  identificationNumber: "P123456",
  identificationDocumentId: null,
  identificationDocumentUrl: null,
  privacyConsent: true,
  treatmentConsent: true,
  disclosureConsent: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

// Mock patient repository
const createMockPatientRepository = () => ({
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  existsByUserId: vi.fn(),
});

// Mock user repository
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

describe("PatientService", () => {
  let service: PatientService;
  let mockPatientRepository: ReturnType<typeof createMockPatientRepository>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockPatientRepository = createMockPatientRepository();
    mockUserRepository = createMockUserRepository();
    service = new PatientService(
      mockPatientRepository as unknown as IPatientRepository,
      mockUserRepository as unknown as IUserRepository
    );
    vi.clearAllMocks();
  });

  describe("findById", () => {
    it("should return patient when found", async () => {
      mockPatientRepository.findById.mockResolvedValue(mockPatient);

      const result = await service.findById("patient-1");

      expect(result).toEqual(mockPatient);
      expect(mockPatientRepository.findById).toHaveBeenCalledWith("patient-1");
    });

    it("should throw NotFoundError when patient not found", async () => {
      mockPatientRepository.findById.mockResolvedValue(null);

      await expect(service.findById("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("findByUserId", () => {
    it("should return patient when found", async () => {
      mockPatientRepository.findByUserId.mockResolvedValue(mockPatient);

      const result = await service.findByUserId("user-1");

      expect(result).toEqual(mockPatient);
      expect(mockPatientRepository.findByUserId).toHaveBeenCalledWith("user-1");
    });

    it("should throw NotFoundError when patient not found", async () => {
      mockPatientRepository.findByUserId.mockResolvedValue(null);

      await expect(service.findByUserId("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("register", () => {
    const registerInput = {
      userId: "user-1",
      birthDate: new Date("1990-01-15"),
      gender: Gender.MALE,
      address: "123 Test St",
      occupation: "Software Engineer",
      emergencyContactName: "Jane Doe",
      emergencyContactNumber: "+1234567890",
      primaryPhysician: "Dr. Smith",
      insuranceProvider: "BlueCross",
      insurancePolicyNumber: "ABC123",
      privacyConsent: true,
      treatmentConsent: true,
      disclosureConsent: true,
    };

    it("should register patient successfully", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPatientRepository.existsByUserId.mockResolvedValue(false);
      mockPatientRepository.create.mockResolvedValue(mockPatient);

      const result = await service.register(registerInput);

      expect(result.success).toBe(true);
      expect(result.patient).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when user not found", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.register(registerInput);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe("User not found");
    });

    it("should update patient when patient already exists", async () => {
      const existingPatient = { ...mockPatient, id: "existing-patient-1" };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPatientRepository.existsByUserId.mockResolvedValue(true);
      mockPatientRepository.findByUserId.mockResolvedValue(existingPatient);
      // Mock findById for the update method
      mockPatientRepository.findById.mockResolvedValue(existingPatient);
      mockPatientRepository.update.mockResolvedValue({
        ...existingPatient,
        ...registerInput,
      });

      const result = await service.register(registerInput);

      // The service now updates existing patients instead of failing
      expect(result.success).toBe(true);
      expect(mockPatientRepository.update).toHaveBeenCalledWith(
        existingPatient.id,
        expect.objectContaining({
          birthDate: registerInput.birthDate,
          gender: registerInput.gender,
        })
      );
    });

    it("should fail when privacy consent not provided", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPatientRepository.existsByUserId.mockResolvedValue(false);

      const result = await service.register({
        ...registerInput,
        privacyConsent: false,
      });

      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe("privacyConsent");
    });

    it("should fail when treatment consent not provided", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPatientRepository.existsByUserId.mockResolvedValue(false);

      const result = await service.register({
        ...registerInput,
        treatmentConsent: false,
      });

      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe("treatmentConsent");
    });

    it("should fail when disclosure consent not provided", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockPatientRepository.existsByUserId.mockResolvedValue(false);

      const result = await service.register({
        ...registerInput,
        disclosureConsent: false,
      });

      expect(result.success).toBe(false);
      expect(result.errors[0].field).toBe("disclosureConsent");
    });
  });

  describe("update", () => {
    const updateInput = {
      address: "456 New St",
      occupation: "Product Manager",
    };

    it("should update patient successfully", async () => {
      mockPatientRepository.findById.mockResolvedValue(mockPatient);
      mockPatientRepository.update.mockResolvedValue({
        ...mockPatient,
        ...updateInput,
      });

      const result = await service.update("patient-1", updateInput);

      expect(result.success).toBe(true);
      expect(result.patient?.address).toBe("456 New St");
    });

    it("should fail when patient not found", async () => {
      mockPatientRepository.findById.mockResolvedValue(null);

      const result = await service.update("nonexistent", updateInput);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain("not found");
    });
  });

  describe("delete", () => {
    it("should delete patient successfully", async () => {
      mockPatientRepository.findById.mockResolvedValue(mockPatient);
      mockPatientRepository.delete.mockResolvedValue(mockPatient);

      const result = await service.delete("patient-1");

      expect(result).toEqual(mockPatient);
      expect(mockPatientRepository.delete).toHaveBeenCalledWith("patient-1");
    });

    it("should throw NotFoundError when patient not found", async () => {
      mockPatientRepository.findById.mockResolvedValue(null);

      await expect(service.delete("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });
});

