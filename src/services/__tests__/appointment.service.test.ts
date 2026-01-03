import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppointmentService } from "../appointment.service";
import { AppointmentRepository, IAppointmentRepository } from "../../repositories/appointment.repository";
import { PatientRepository, IPatientRepository } from "../../repositories/patient.repository";
import { Appointment, AppointmentStatus, Prisma } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";

/**
 * Appointment Service Unit Tests
 *
 * Tests all business logic in AppointmentService:
 * - Appointment creation
 * - Appointment updates
 * - Appointment scheduling
 * - Appointment cancellation
 * - Validation rules
 * - Error handling
 */
describe("AppointmentService", () => {
  let appointmentService: AppointmentService;
  let mockAppointmentRepository: IAppointmentRepository;
  let mockPatientRepository: IPatientRepository;

  const mockPatient = {
    id: "patient-1",
    userId: "user-1",
    birthDate: new Date("1990-01-01"),
    gender: "MALE" as const,
    address: "123 Main St",
    occupation: "Engineer",
    emergencyContactName: "John Doe",
    emergencyContactNumber: "1234567890",
    primaryPhysician: "Dr. Smith",
    insuranceProvider: "Insurance Co",
    insurancePolicyNumber: "POL123",
    allergies: null,
    currentMedication: null,
    familyMedicalHistory: null,
    pastMedicalHistory: null,
    identificationType: "PASSPORT",
    identificationNumber: "ID123",
    identificationDocumentId: null,
    identificationDocumentUrl: null,
    privacyConsent: true,
    treatmentConsent: true,
    disclosureConsent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create a future date for appointments
  const getFutureDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Tomorrow
    return date;
  };

  const mockAppointment: Appointment = {
    id: "appointment-1",
    patientId: "patient-1",
    primaryPhysician: "Dr. Smith",
    schedule: getFutureDate(),
    status: AppointmentStatus.PENDING,
    reason: "Annual checkup",
    note: "Prefer morning",
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Create mock repositories
    mockAppointmentRepository = {
      findById: vi.fn(),
      findByPatientId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      countByStatus: vi.fn(),
      getStatistics: vi.fn(),
    } as unknown as IAppointmentRepository;

    mockPatientRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IPatientRepository;

    // Create service with mocked dependencies
    appointmentService = new AppointmentService(
      mockAppointmentRepository,
      mockPatientRepository
    );
  });

  describe("findById", () => {
    it("should return appointment when found", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(mockAppointment);

      const result = await appointmentService.findById("appointment-1");

      expect(result).toEqual(mockAppointment);
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith("appointment-1");
    });

    it("should throw NotFoundError when appointment not found", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(null);

      await expect(appointmentService.findById("non-existent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("findByPatientId", () => {
    it("should return appointments for patient", async () => {
      const appointments = [mockAppointment];
      vi.mocked(mockAppointmentRepository.findByPatientId).mockResolvedValue(appointments);

      const result = await appointmentService.findByPatientId("patient-1");

      expect(result).toEqual(appointments);
      expect(mockAppointmentRepository.findByPatientId).toHaveBeenCalledWith("patient-1");
    });
  });

  describe("create", () => {
    const getCreateInput = () => ({
      patientId: "patient-1",
      primaryPhysician: "Dr. Smith",
      schedule: getFutureDate(),
      reason: "Annual checkup",
      note: "Prefer morning",
    });

    it("should create appointment successfully", async () => {
      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);
      vi.mocked(mockAppointmentRepository.create).mockResolvedValue(mockAppointment);

      const result = await appointmentService.create(getCreateInput());

      expect(result.success).toBe(true);
      expect(result.appointment).toEqual(mockAppointment);
      expect(result.errors).toHaveLength(0);
      expect(mockAppointmentRepository.create).toHaveBeenCalled();
    });

    it("should fail when patient does not exist", async () => {
      vi.mocked(mockPatientRepository.findById).mockResolvedValue(null);

      const result = await appointmentService.create(getCreateInput());

      expect(result.success).toBe(false);
      expect(result.appointment).toBeUndefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("patientId");
    });

    it("should fail when schedule is in the past", async () => {
      vi.mocked(mockPatientRepository.findById).mockResolvedValue(mockPatient);

      const pastDate = new Date("2020-01-01");
      const result = await appointmentService.create({
        ...getCreateInput(),
        schedule: pastDate,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("schedule");
    });
  });

  describe("update", () => {
    it("should update appointment successfully", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(mockAppointment);
      const updatedAppointment = { ...mockAppointment, reason: "Updated reason" };
      vi.mocked(mockAppointmentRepository.update).mockResolvedValue(updatedAppointment);

      const result = await appointmentService.update("appointment-1", {
        reason: "Updated reason",
      });

      expect(result.success).toBe(true);
      expect(result.appointment).toEqual(updatedAppointment);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when appointment does not exist", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(null);

      const result = await appointmentService.update("non-existent", {
        reason: "Updated reason",
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it("should fail when schedule is in the past", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(mockAppointment);

      const pastDate = new Date("2020-01-01");
      const result = await appointmentService.update("appointment-1", {
        schedule: pastDate,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("schedule");
    });
  });

  describe("schedule", () => {
    it("should schedule appointment successfully", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(mockAppointment);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      const scheduledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.SCHEDULED,
        schedule: futureDate,
      };
      vi.mocked(mockAppointmentRepository.update).mockResolvedValue(scheduledAppointment);

      const result = await appointmentService.schedule("appointment-1", futureDate);

      expect(result.success).toBe(true);
      expect(result.appointment?.status).toBe(AppointmentStatus.SCHEDULED);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when appointment is already cancelled", async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      };
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(cancelledAppointment);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      const result = await appointmentService.schedule("appointment-1", futureDate);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("cancelled");
    });

    it("should fail when schedule is in the past", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(mockAppointment);

      const pastDate = new Date("2020-01-01");
      const result = await appointmentService.schedule("appointment-1", pastDate);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("schedule");
    });
  });

  describe("cancel", () => {
    it("should cancel appointment successfully", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(mockAppointment);
      const cancelledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        cancellationReason: "Urgent meeting",
      };
      vi.mocked(mockAppointmentRepository.update).mockResolvedValue(cancelledAppointment);

      const result = await appointmentService.cancel("appointment-1", "Urgent meeting");

      expect(result.success).toBe(true);
      expect(result.appointment?.status).toBe(AppointmentStatus.CANCELLED);
      expect(result.appointment?.cancellationReason).toBe("Urgent meeting");
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when appointment is already cancelled", async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      };
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(cancelledAppointment);

      const result = await appointmentService.cancel("appointment-1", "Reason");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("already cancelled");
    });

    it("should fail when cancellation reason is empty", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(mockAppointment);

      const result = await appointmentService.cancel("appointment-1", "");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("cancellationReason");
    });
  });

  describe("delete", () => {
    it("should delete appointment successfully", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(mockAppointment);
      vi.mocked(mockAppointmentRepository.delete).mockResolvedValue(mockAppointment);

      const result = await appointmentService.delete("appointment-1");

      expect(result).toEqual(mockAppointment);
      expect(mockAppointmentRepository.delete).toHaveBeenCalledWith("appointment-1");
    });

    it("should throw NotFoundError when appointment does not exist", async () => {
      vi.mocked(mockAppointmentRepository.findById).mockResolvedValue(null);

      await expect(appointmentService.delete("non-existent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("getStatistics", () => {
    it("should return appointment statistics", async () => {
      const stats = {
        total: 10,
        scheduled: 5,
        pending: 3,
        cancelled: 2,
      };
      vi.mocked(mockAppointmentRepository.getStatistics).mockResolvedValue(stats);

      const result = await appointmentService.getStatistics();

      expect(result).toEqual(stats);
      expect(mockAppointmentRepository.getStatistics).toHaveBeenCalled();
    });
  });
});

