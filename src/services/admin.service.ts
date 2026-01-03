import { AppointmentStatus } from "@prisma/client";
import { IAppointmentRepository } from "../repositories/appointment.repository";
import { AppointmentStatistics } from "./appointment.service";
import { logger } from "../utils/logger";

/**
 * Admin Service Interface
 */
export interface IAdminService {
  getAppointmentStatistics(): Promise<AppointmentStatistics>;
  getAppointmentsByStatus(status?: AppointmentStatus): Promise<any[]>;
}

/**
 * Admin Service Implementation
 *
 * Handles admin-specific operations:
 * - Appointment statistics
 * - Appointment management (scheduling, cancelling)
 * - Admin dashboard data
 *
 * Note: Most appointment operations are in AppointmentService.
 * This service focuses on admin-specific aggregations and views.
 */
export class AdminService implements IAdminService {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  /**
   * Get appointment statistics for admin dashboard
   *
   * @returns Appointment statistics (total, scheduled, pending, cancelled)
   */
  async getAppointmentStatistics(): Promise<AppointmentStatistics> {
    logger.debug("AdminService.getAppointmentStatistics");

    return this.appointmentRepository.getStatistics();
  }

  /**
   * Get appointments filtered by status
   *
   * @param status - Optional status filter
   * @returns Array of appointments
   */
  async getAppointmentsByStatus(status?: AppointmentStatus): Promise<any[]> {
    logger.debug("AdminService.getAppointmentsByStatus", { status });

    const filters = status ? { status } : undefined;
    return this.appointmentRepository.findAll(filters);
  }
}

/**
 * Factory function for creating AdminService
 *
 * @param appointmentRepository - Appointment repository instance
 * @returns AdminService instance
 */
export const createAdminService = (
  appointmentRepository: IAppointmentRepository
): AdminService => {
  return new AdminService(appointmentRepository);
};

