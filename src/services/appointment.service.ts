import {
  Appointment,
  AppointmentStatus,
  Prisma,
} from "@prisma/client";
import { IAppointmentRepository } from "../repositories/appointment.repository";
import { IPatientRepository } from "../repositories/patient.repository";
import { IEmailService } from "./email.service";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Appointment Service Interface
 */
export interface IAppointmentService {
  findById(id: string): Promise<Appointment>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findAll(filters?: AppointmentFilters): Promise<Appointment[]>;
  create(input: CreateAppointmentInput): Promise<AppointmentResult>;
  update(id: string, input: UpdateAppointmentInput): Promise<AppointmentResult>;
  schedule(id: string, schedule: Date): Promise<AppointmentResult>;
  cancel(id: string, reason: string): Promise<AppointmentResult>;
  delete(id: string): Promise<Appointment>;
  getStatistics(): Promise<AppointmentStatistics>;
}

/**
 * Input type for creating an appointment
 */
export interface CreateAppointmentInput {
  patientId: string;
  primaryPhysician: string;
  schedule: Date;
  reason: string;
  note?: string;
}

/**
 * Input type for updating an appointment
 */
export interface UpdateAppointmentInput {
  primaryPhysician?: string;
  schedule?: Date;
  reason?: string;
  note?: string;
  status?: AppointmentStatus;
  cancellationReason?: string;
}

/**
 * Appointment filters
 */
export interface AppointmentFilters {
  patientId?: string;
  status?: AppointmentStatus;
  primaryPhysician?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Result type for appointment operations
 */
export interface AppointmentResult {
  success: boolean;
  appointment?: Appointment;
  errors: FieldError[];
}

/**
 * Field error type
 */
export interface FieldError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Appointment statistics
 */
export interface AppointmentStatistics {
  total: number;
  scheduled: number;
  pending: number;
  cancelled: number;
}

/**
 * Appointment Service Implementation
 *
 * Handles all business logic related to appointment management.
 *
 * Key responsibilities:
 * - Validate appointment creation
 * - Ensure patient exists
 * - Handle appointment scheduling
 * - Handle appointment cancellation
 * - Enforce business rules (e.g., can't cancel already cancelled appointments)
 */
export class AppointmentService implements IAppointmentService {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly emailService?: IEmailService
  ) {}

  /**
   * Find appointment by ID
   *
   * @param id - Appointment's unique identifier
   * @returns Appointment entity
   * @throws NotFoundError if appointment doesn't exist
   */
  async findById(id: string): Promise<Appointment> {
    logger.debug("AppointmentService.findById", { id });

    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundError("Appointment", id);
    }

    return appointment;
  }

  /**
   * Find all appointments for a patient
   *
   * @param patientId - Patient's unique identifier
   * @returns Array of appointments
   */
  async findByPatientId(patientId: string): Promise<Appointment[]> {
    logger.debug("AppointmentService.findByPatientId", { patientId });
    return this.appointmentRepository.findByPatientId(patientId);
  }

  /**
   * Find all appointments with filters
   *
   * @param filters - Optional filters
   * @returns Array of appointments
   */
  async findAll(filters?: AppointmentFilters): Promise<Appointment[]> {
    logger.debug("AppointmentService.findAll", { filters });
    return this.appointmentRepository.findAll(filters);
  }

  /**
   * Create a new appointment
   *
   * Business Rules:
   * 1. Patient must exist
   * 2. Schedule must be in the future
   * 3. Primary physician must be provided
   * 4. Reason must be provided
   * 5. Default status is PENDING
   *
   * @param input - Appointment creation data
   * @returns AppointmentResult with created appointment
   */
  async create(input: CreateAppointmentInput): Promise<AppointmentResult> {
    logger.info("AppointmentService.create", { patientId: input.patientId });

    try {
      // Validate patient exists
      const patient = await this.patientRepository.findById(input.patientId);
      if (!patient) {
        return {
          success: false,
          errors: [{ field: "patientId", message: "Patient not found" }],
        };
      }

      // Validate schedule is in the future
      if (input.schedule <= new Date()) {
        return {
          success: false,
          errors: [
            {
              field: "schedule",
              message: "Appointment schedule must be in the future",
            },
          ],
        };
      }

      // Create appointment data
      const appointmentData: Prisma.AppointmentCreateInput = {
        patient: { connect: { id: input.patientId } },
        primaryPhysician: input.primaryPhysician,
        schedule: input.schedule,
        reason: input.reason,
        note: input.note,
        status: AppointmentStatus.PENDING, // Default status
      };

      const appointment = await this.appointmentRepository.create(appointmentData);

      logger.info("Appointment created successfully", {
        appointmentId: appointment.id,
      });

      // Send confirmation email (non-blocking)
      // Fetch appointment with relations to get patient email
      if (this.emailService) {
        try {
          const appointmentWithRelations = await this.appointmentRepository.findById(appointment.id);
          if (appointmentWithRelations && (appointmentWithRelations as any).patient?.user?.email) {
            const appointmentData = appointmentWithRelations as any;
            this.emailService
              .sendAppointmentConfirmation(
                appointmentData.patient.user.email,
                appointmentData.patient.user.name,
                appointmentData.schedule,
                appointmentData.primaryPhysician
              )
              .catch((error) => {
                logger.error("Failed to send appointment confirmation email", {
                  error,
                  appointmentId: appointment.id,
                });
              });
          }
        } catch (error) {
          logger.error("Failed to fetch appointment data for email", {
            error,
            appointmentId: appointment.id,
            patientId: input.patientId,
          });
        }
      }

      return {
        success: true,
        appointment,
        errors: [],
      };
    } catch (error) {
      logger.error("Appointment creation failed", { error, input });

      if (error instanceof ValidationError) {
        return {
          success: false,
          errors: [{ message: error.message }],
        };
      }

      throw error;
    }
  }

  /**
   * Update an existing appointment
   *
   * @param id - Appointment's unique identifier
   * @param input - Fields to update
   * @returns AppointmentResult with updated appointment
   */
  async update(
    id: string,
    input: UpdateAppointmentInput
  ): Promise<AppointmentResult> {
    logger.info("AppointmentService.update", { id, fields: Object.keys(input) });

    try {
      // Verify appointment exists
      await this.findById(id);

      // Validate schedule if provided
      if (input.schedule && input.schedule <= new Date()) {
        return {
          success: false,
          errors: [
            {
              field: "schedule",
              message: "Appointment schedule must be in the future",
            },
          ],
        };
      }

      const updateData: Prisma.AppointmentUpdateInput = {
        ...(input.primaryPhysician && { primaryPhysician: input.primaryPhysician }),
        ...(input.schedule && { schedule: input.schedule }),
        ...(input.reason && { reason: input.reason }),
        ...(input.note !== undefined && { note: input.note }),
        ...(input.status && { status: input.status }),
        ...(input.cancellationReason && {
          cancellationReason: input.cancellationReason,
        }),
      };

      const appointment = await this.appointmentRepository.update(id, updateData);

      logger.info("Appointment updated successfully", { appointmentId: id });

      // Send email if status changed to SCHEDULED (when admin schedules via updateAppointment)
      if (input.status === AppointmentStatus.SCHEDULED && this.emailService) {
        try {
          const appointmentWithRelations = await this.appointmentRepository.findById(id);
          if (appointmentWithRelations) {
            const appointmentData = appointmentWithRelations as any;
            const patientEmail = appointmentData.patient?.user?.email;
            const scheduleDate = input.schedule ? new Date(input.schedule) : appointmentData.schedule;
            
            if (patientEmail) {
              this.emailService
                .sendAppointmentScheduled(
                  patientEmail,
                  appointmentData.patient.user.name,
                  scheduleDate instanceof Date ? scheduleDate : new Date(scheduleDate),
                  appointmentData.primaryPhysician
                )
                .catch((error) => {
                  logger.error("Failed to send appointment scheduled email", {
                    error,
                    appointmentId: id,
                  });
                });
            }
          }
        } catch (error) {
          logger.error("Failed to send scheduled email after update", {
            error,
            appointmentId: id,
          });
        }
      }

      return {
        success: true,
        appointment,
        errors: [],
      };
    } catch (error) {
      logger.error("Appointment update failed", { error, appointmentId: id });

      if (error instanceof NotFoundError) {
        return {
          success: false,
          errors: [{ message: error.message }],
        };
      }

      throw error;
    }
  }

  /**
   * Schedule an appointment (change status to SCHEDULED)
   *
   * Business Rules:
   * 1. Appointment must exist
   * 2. Appointment must not be cancelled
   * 3. Schedule must be in the future
   *
   * @param id - Appointment's unique identifier
   * @param schedule - New schedule date/time
   * @returns AppointmentResult with scheduled appointment
   */
  async schedule(id: string, schedule: Date): Promise<AppointmentResult> {
    logger.info("AppointmentService.schedule", { id, schedule });

    try {
      const appointment = await this.findById(id);

      // Can't schedule cancelled appointments
      if (appointment.status === AppointmentStatus.CANCELLED) {
        return {
          success: false,
          errors: [
            {
              message: "Cannot schedule a cancelled appointment",
            },
          ],
        };
      }

      // Validate schedule is in the future
      if (schedule <= new Date()) {
        return {
          success: false,
          errors: [
            {
              field: "schedule",
              message: "Appointment schedule must be in the future",
            },
          ],
        };
      }

      const updated = await this.appointmentRepository.update(id, {
        schedule,
        status: AppointmentStatus.SCHEDULED,
      });

      logger.info("Appointment scheduled successfully", { appointmentId: id });

      // Send scheduled email (non-blocking)
      if (this.emailService) {
        try {
          const appointmentWithRelations = await this.appointmentRepository.findById(id);
          if (appointmentWithRelations) {
            const appointment = appointmentWithRelations as any;
            const patientEmail = appointment.patient?.user?.email;
            
            if (patientEmail) {
              const scheduleDate = schedule instanceof Date ? schedule : new Date(schedule);
              
              this.emailService
                .sendAppointmentScheduled(
                  patientEmail,
                  appointment.patient.user.name,
                  scheduleDate,
                  appointment.primaryPhysician
                )
                .catch((error) => {
                  logger.error("Failed to send appointment scheduled email", {
                    error,
                    appointmentId: id,
                  });
                });
            }
          }
        } catch (error) {
          logger.error("Failed to send appointment scheduled email", {
            error,
            appointmentId: id,
          });
        }
      }

      return {
        success: true,
        appointment: updated,
        errors: [],
      };
    } catch (error) {
      logger.error("Appointment scheduling failed", { error, appointmentId: id });

      if (error instanceof NotFoundError) {
        return {
          success: false,
          errors: [{ message: error.message }],
        };
      }

      throw error;
    }
  }

  /**
   * Cancel an appointment
   *
   * Business Rules:
   * 1. Appointment must exist
   * 2. Can't cancel already cancelled appointments
   * 3. Cancellation reason is required
   *
   * @param id - Appointment's unique identifier
   * @param reason - Reason for cancellation
   * @returns AppointmentResult with cancelled appointment
   */
  async cancel(id: string, reason: string): Promise<AppointmentResult> {
    logger.info("AppointmentService.cancel", { id, reason });

    try {
      const appointment = await this.findById(id);

      // Can't cancel already cancelled appointments
      if (appointment.status === AppointmentStatus.CANCELLED) {
        return {
          success: false,
          errors: [
            {
              message: "Appointment is already cancelled",
            },
          ],
        };
      }

      // Validate cancellation reason
      if (!reason || reason.trim().length === 0) {
        return {
          success: false,
          errors: [
            {
              field: "cancellationReason",
              message: "Cancellation reason is required",
            },
          ],
        };
      }

      const updated = await this.appointmentRepository.update(id, {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason,
      });

      logger.info("Appointment cancelled successfully", { appointmentId: id });

      // Send cancellation email (non-blocking)
      if (this.emailService) {
        try {
          const appointmentWithRelations = await this.appointmentRepository.findById(id);
          if (appointmentWithRelations) {
            const appointment = appointmentWithRelations as any;
            const patientEmail = appointment.patient?.user?.email;
            
            if (patientEmail) {
              this.emailService
                .sendAppointmentCancelled(
                  patientEmail,
                  appointment.patient.user.name,
                  appointment.schedule,
                  appointment.primaryPhysician,
                  reason
                )
                .catch((error) => {
                  logger.error("Failed to send appointment cancellation email", {
                    error,
                    appointmentId: id,
                  });
                });
            }
          }
        } catch (error) {
          logger.error("Failed to send appointment cancellation email", {
            error,
            appointmentId: id,
          });
        }
      }

      return {
        success: true,
        appointment: updated,
        errors: [],
      };
    } catch (error) {
      logger.error("Appointment cancellation failed", { error, appointmentId: id });

      if (error instanceof NotFoundError) {
        return {
          success: false,
          errors: [{ message: error.message }],
        };
      }

      throw error;
    }
  }

  /**
   * Delete an appointment
   *
   * @param id - Appointment's unique identifier
   * @returns Deleted appointment
   * @throws NotFoundError if appointment doesn't exist
   */
  async delete(id: string): Promise<Appointment> {
    logger.info("AppointmentService.delete", { id });

    // Verify appointment exists
    await this.findById(id);

    const appointment = await this.appointmentRepository.delete(id);

    logger.info("Appointment deleted successfully", { appointmentId: id });

    return appointment;
  }

  /**
   * Get appointment statistics
   *
   * @returns Statistics object with counts
   */
  async getStatistics(): Promise<AppointmentStatistics> {
    logger.debug("AppointmentService.getStatistics");

    return this.appointmentRepository.getStatistics();
  }
}

/**
 * Factory function for creating AppointmentService
 *
 * @param appointmentRepository - Appointment repository instance
 * @param patientRepository - Patient repository instance
 * @param emailService - Email service instance (optional)
 * @returns AppointmentService instance
 */
export const createAppointmentService = (
  appointmentRepository: IAppointmentRepository,
  patientRepository: IPatientRepository,
  emailService?: IEmailService
): AppointmentService => {
  return new AppointmentService(appointmentRepository, patientRepository, emailService);
};

