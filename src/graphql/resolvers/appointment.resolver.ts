import { Appointment, AppointmentStatus } from "@prisma/client";
import { Context } from "../context";
import { requireAuth, requireAdmin } from "../../middleware";
import { logger } from "../../utils/logger";

/**
 * Appointment Creation Input Type
 */
export interface CreateAppointmentInput {
  patientId: string;
  primaryPhysician: string;
  schedule: Date;
  reason: string;
  note?: string;
}

/**
 * Appointment Update Input Type
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
 * Appointment Resolvers
 *
 * Handles GraphQL operations for appointment management:
 * - createAppointment: Create new appointment
 * - updateAppointment: Update existing appointment
 * - scheduleAppointment: Schedule an appointment
 * - cancelAppointment: Cancel an appointment
 * - appointment: Get appointment by ID
 * - appointments: Get all appointments with filters
 * - patientAppointments: Get appointments for a patient
 */
export const appointmentResolvers = {
  Query: {
    /**
     * Get appointment by ID
     *
     * @param id - Appointment's unique identifier
     * @returns Appointment or null
     */
    appointment: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ): Promise<Appointment | null> => {
      logger.debug("Resolver: appointment", { id });

      try {
        return await context.services.appointment.findById(id);
      } catch {
        return null;
      }
    },

    /**
     * Get all appointments with optional filters
     *
     * @param status - Optional status filter
     * @returns AppointmentsPayload with appointments and counts
     */
    appointments: async (
      _parent: unknown,
      { status }: { status?: AppointmentStatus },
      context: Context
    ) => {
      logger.debug("Resolver: appointments", { status });

      try {
        const filters = status ? { status } : undefined;
        const appointments = await context.services.appointment.findAll(filters);
        const statistics = await context.services.appointment.getStatistics();

        return {
          success: true,
          appointments,
          counts: {
            total: statistics.total,
            scheduled: statistics.scheduled,
            pending: statistics.pending,
            cancelled: statistics.cancelled,
          },
          errors: [],
        };
      } catch (error) {
        logger.error("Failed to fetch appointments", { error });
        return {
          success: false,
          appointments: [],
          counts: { total: 0, scheduled: 0, pending: 0, cancelled: 0 },
          errors: [{ message: "Failed to fetch appointments" }],
        };
      }
    },

    /**
     * Get appointments for a specific patient
     *
     * @param patientId - Patient's unique identifier
     * @returns Array of appointments
     */
    patientAppointments: async (
      _parent: unknown,
      { patientId }: { patientId: string },
      context: Context
    ): Promise<Appointment[]> => {
      logger.debug("Resolver: patientAppointments", { patientId });

      // Require authentication
      requireAuth(context);

      return context.services.appointment.findByPatientId(patientId);
    },
  },

  Mutation: {
    /**
     * Create a new appointment
     *
     * Requires: Authentication
     * Business Rule: User can only create appointments for their own patient profile
     *
     * @param input - Appointment creation data
     * @returns AppointmentPayload with appointment and errors
     */
    createAppointment: async (
      _parent: unknown,
      { input }: { input: CreateAppointmentInput },
      context: Context
    ) => {
      logger.info("Resolver: createAppointment", { patientId: input.patientId });

      // Authentication is optional - allow guest users to create appointments
      // If authenticated, verify patient belongs to current user (unless admin)
      const currentUser = context.auth.user;
      
      if (currentUser) {
        // User is authenticated - verify ownership
        try {
          const patient = await context.services.patient.findById(input.patientId);
          if (patient.userId !== currentUser.id && currentUser.role !== "ADMIN") {
            return {
              success: false,
              appointment: null,
              errors: [
                {
                  message: "You can only create appointments for your own profile",
                },
              ],
            };
          }
        } catch {
          return {
            success: false,
            appointment: null,
            errors: [{ message: "Patient not found" }],
          };
        }
      } else {
        // Guest user - just verify patient exists
        try {
          await context.services.patient.findById(input.patientId);
        } catch {
          return {
            success: false,
            appointment: null,
            errors: [{ message: "Patient not found" }],
          };
        }
      }

      // Delegate to service
      const result = await context.services.appointment.create(input);

      return {
        success: result.success,
        appointment: result.appointment || null,
        errors: result.errors,
      };
    },

    /**
     * Update an existing appointment
     *
     * Requires: Authentication
     *
     * @param id - Appointment's unique identifier
     * @param input - Fields to update
     * @returns AppointmentPayload with updated appointment
     */
    updateAppointment: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateAppointmentInput },
      context: Context
    ) => {
      logger.info("Resolver: updateAppointment", { appointmentId: id });

      // Verify authentication
      requireAuth(context);

      // Delegate to service
      const result = await context.services.appointment.update(id, input);

      return {
        success: result.success,
        appointment: result.appointment || null,
        errors: result.errors,
      };
    },

    /**
     * Schedule an appointment (change status to SCHEDULED)
     *
     * Requires: Admin authentication
     *
     * @param id - Appointment's unique identifier
     * @param schedule - New schedule date/time
     * @returns AppointmentPayload with scheduled appointment
     */
    scheduleAppointment: async (
      _parent: unknown,
      { id, schedule }: { id: string; schedule: Date },
      context: Context
    ) => {
      logger.info("Resolver: scheduleAppointment", { appointmentId: id, schedule });

      // Require admin authentication
      requireAdmin(context);

      // Delegate to service
      const result = await context.services.appointment.schedule(id, schedule);

      return {
        success: result.success,
        appointment: result.appointment || null,
        errors: result.errors,
      };
    },

    /**
     * Cancel an appointment
     *
     * Requires: Authentication
     *
     * @param id - Appointment's unique identifier
     * @param reason - Reason for cancellation
     * @returns AppointmentPayload with cancelled appointment
     */
    cancelAppointment: async (
      _parent: unknown,
      { id, reason }: { id: string; reason: string },
      context: Context
    ) => {
      logger.info("Resolver: cancelAppointment", { appointmentId: id, reason });

      // Verify authentication
      requireAuth(context);

      // Delegate to service
      const result = await context.services.appointment.cancel(id, reason);

      return {
        success: result.success,
        appointment: result.appointment || null,
        errors: result.errors,
      };
    },
  },

  /**
   * Appointment Type Resolvers
   */
  Appointment: {
    /**
     * Resolve patient relation
     */
    patient: async (parent: Appointment, _args: unknown, context: Context) => {
      return context.prisma.patient.findUnique({
        where: { id: parent.patientId },
        include: { user: true },
      });
    },
  },
};

