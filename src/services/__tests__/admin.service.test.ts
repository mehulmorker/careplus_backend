import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdminService } from "../admin.service";
import { IAppointmentRepository } from "../../repositories/appointment.repository";
import { AppointmentStatus } from "@prisma/client";

/**
 * Admin Service Unit Tests
 *
 * Tests admin-specific operations:
 * - Appointment statistics
 * - Appointment filtering by status
 */
describe("AdminService", () => {
  let adminService: AdminService;
  let mockAppointmentRepository: IAppointmentRepository;

  beforeEach(() => {
    // Create mock repository
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

    // Create service with mocked dependencies
    adminService = new AdminService(mockAppointmentRepository);
  });

  describe("getAppointmentStatistics", () => {
    it("should return appointment statistics", async () => {
      const stats = {
        total: 10,
        scheduled: 5,
        pending: 3,
        cancelled: 2,
      };

      vi.mocked(mockAppointmentRepository.getStatistics).mockResolvedValue(stats);

      const result = await adminService.getAppointmentStatistics();

      expect(result).toEqual(stats);
      expect(mockAppointmentRepository.getStatistics).toHaveBeenCalled();
    });

    it("should return zero counts when no appointments exist", async () => {
      const stats = {
        total: 0,
        scheduled: 0,
        pending: 0,
        cancelled: 0,
      };

      vi.mocked(mockAppointmentRepository.getStatistics).mockResolvedValue(stats);

      const result = await adminService.getAppointmentStatistics();

      expect(result).toEqual(stats);
    });
  });

  describe("getAppointmentsByStatus", () => {
    it("should return appointments filtered by status", async () => {
      const appointments = [
        {
          id: "appointment-1",
          status: AppointmentStatus.PENDING,
        },
        {
          id: "appointment-2",
          status: AppointmentStatus.PENDING,
        },
      ];

      vi.mocked(mockAppointmentRepository.findAll).mockResolvedValue(
        appointments as any
      );

      const result = await adminService.getAppointmentsByStatus(
        AppointmentStatus.PENDING
      );

      expect(result).toEqual(appointments);
      expect(mockAppointmentRepository.findAll).toHaveBeenCalledWith({
        status: AppointmentStatus.PENDING,
      });
    });

    it("should return all appointments when no status filter provided", async () => {
      const appointments = [
        {
          id: "appointment-1",
          status: AppointmentStatus.PENDING,
        },
        {
          id: "appointment-2",
          status: AppointmentStatus.SCHEDULED,
        },
      ];

      vi.mocked(mockAppointmentRepository.findAll).mockResolvedValue(
        appointments as any
      );

      const result = await adminService.getAppointmentsByStatus();

      expect(result).toEqual(appointments);
      expect(mockAppointmentRepository.findAll).toHaveBeenCalledWith(undefined);
    });
  });
});

