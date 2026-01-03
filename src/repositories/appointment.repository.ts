import { PrismaClient, Appointment, AppointmentStatus, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository";

/**
 * Appointment Repository Interface
 *
 * Extends base repository with appointment-specific operations.
 */
export interface IAppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findAll(filters?: AppointmentFilters): Promise<Appointment[]>;
  create(data: Prisma.AppointmentCreateInput): Promise<Appointment>;
  update(id: string, data: Prisma.AppointmentUpdateInput): Promise<Appointment>;
  delete(id: string): Promise<Appointment>;
  count(filters?: AppointmentFilters): Promise<number>;
  countByStatus(status: AppointmentStatus): Promise<number>;
  getStatistics(): Promise<{
    total: number;
    scheduled: number;
    pending: number;
    cancelled: number;
  }>;
}

/**
 * Appointment filters for queries
 */
export interface AppointmentFilters {
  patientId?: string;
  status?: AppointmentStatus;
  primaryPhysician?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Appointment Repository Implementation
 *
 * Handles all data access operations for the Appointment entity.
 * Appointments link patients to scheduled medical visits.
 */
export class AppointmentRepository
  extends BaseRepository<Appointment, Prisma.AppointmentCreateInput, Prisma.AppointmentUpdateInput>
  implements IAppointmentRepository
{
  /**
   * Find appointment by unique ID
   *
   * @param id - Appointment's unique identifier
   * @returns Appointment if found, null otherwise
   */
  async findById(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });
  }

  /**
   * Find all appointments for a patient
   *
   * @param patientId - Patient's unique identifier
   * @returns Array of appointments for the patient
   */
  async findByPatientId(patientId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { schedule: "desc" },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });
  }

  /**
   * Find all appointments with optional filters
   *
   * @param filters - Optional filters (status, patientId, date range, etc.)
   * @returns Array of appointments
   */
  async findAll(filters?: AppointmentFilters): Promise<Appointment[]> {
    const where: Prisma.AppointmentWhereInput = {};

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.primaryPhysician) {
      where.primaryPhysician = filters.primaryPhysician;
    }

    if (filters?.startDate || filters?.endDate) {
      where.schedule = {};
      if (filters.startDate) {
        where.schedule.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.schedule.lte = filters.endDate;
      }
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { schedule: "desc" },
      include: {
        patient: {
          include: { user: true },
        },
      },
    });
  }

  /**
   * Create a new appointment
   *
   * @param data - Appointment creation data
   * @returns Created appointment
   */
  async create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
    return this.prisma.appointment.create({
      data,
      include: {
        patient: {
          include: { user: true },
        },
      },
    });
  }

  /**
   * Update an existing appointment
   *
   * @param id - Appointment's unique identifier
   * @param data - Fields to update
   * @returns Updated appointment
   */
  async update(id: string, data: Prisma.AppointmentUpdateInput): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: {
          include: { user: true },
        },
      },
    });
  }

  /**
   * Delete an appointment
   *
   * @param id - Appointment's unique identifier
   * @returns Deleted appointment
   */
  async delete(id: string): Promise<Appointment> {
    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  /**
   * Count appointments with optional filters
   *
   * @param filters - Optional filters
   * @returns Total count
   */
  async count(filters?: AppointmentFilters): Promise<number> {
    const where: Prisma.AppointmentWhereInput = {};

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.primaryPhysician) {
      where.primaryPhysician = filters.primaryPhysician;
    }

    return this.prisma.appointment.count({ where });
  }

  /**
   * Count appointments by status
   *
   * @param status - Appointment status
   * @returns Count for the status
   */
  async countByStatus(status: AppointmentStatus): Promise<number> {
    return this.prisma.appointment.count({
      where: { status },
    });
  }

  /**
   * Get appointment statistics
   *
   * @returns Object with counts for each status
   */
  async getStatistics(): Promise<{
    total: number;
    scheduled: number;
    pending: number;
    cancelled: number;
  }> {
    const [total, scheduled, pending, cancelled] = await Promise.all([
      this.count(),
      this.countByStatus(AppointmentStatus.SCHEDULED),
      this.countByStatus(AppointmentStatus.PENDING),
      this.countByStatus(AppointmentStatus.CANCELLED),
    ]);

    return { total, scheduled, pending, cancelled };
  }
}

/**
 * Factory function for creating AppointmentRepository
 *
 * @param prisma - Prisma client instance
 * @returns AppointmentRepository instance
 */
export const createAppointmentRepository = (
  prisma: PrismaClient
): AppointmentRepository => {
  return new AppointmentRepository(prisma);
};

