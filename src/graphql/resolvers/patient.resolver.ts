import { Patient, Gender } from "@prisma/client";
import { Context } from "../context";
import { requireAuth } from "../../middleware/auth.middleware";
import { logger } from "../../utils/logger";

/**
 * Patient Registration Input Type
 */
export interface RegisterPatientInput {
  userId: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  identificationType?: string;
  identificationNumber?: string;
  identificationDocumentId?: string;
  identificationDocumentUrl?: string;
  privacyConsent: boolean;
  treatmentConsent: boolean;
  disclosureConsent: boolean;
}

/**
 * Patient Update Input Type
 */
export interface UpdatePatientInput {
  birthDate?: Date;
  gender?: Gender;
  address?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  primaryPhysician?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  identificationType?: string;
  identificationNumber?: string;
  identificationDocumentId?: string;
  identificationDocumentUrl?: string;
}

/**
 * Patient Resolvers
 *
 * Handles GraphQL operations for patient management:
 * - registerPatient: Create patient profile
 * - patient: Get patient by ID
 * - patientByUserId: Get patient by user ID
 * - updatePatient: Update patient profile
 */
export const patientResolvers = {
  Query: {
    /**
     * Get patient by ID
     *
     * @param id - Patient's unique identifier
     * @returns Patient or null
     */
    patient: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ): Promise<Patient | null> => {
      logger.debug("Resolver: patient", { id });

      try {
        return await context.services.patient.findById(id);
      } catch {
        return null;
      }
    },

    /**
     * Get patient by user ID
     *
     * @param userId - User's unique identifier
     * @returns Patient or null
     */
    patientByUserId: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: Context
    ): Promise<Patient | null> => {
      logger.debug("Resolver: patientByUserId", { userId });

      try {
        return await context.services.patient.findByUserId(userId);
      } catch {
        return null;
      }
    },
  },

  Mutation: {
    /**
     * Register a new patient profile
     *
     * Creates a complete patient profile linked to an existing user.
     * Allows unauthenticated access for guest user flow.
     * If authenticated, verifies user is registering their own profile.
     *
     * @param input - Patient registration data
     * @returns PatientPayload with patient and errors
     */
    registerPatient: async (
      _parent: unknown,
      { input }: { input: RegisterPatientInput },
      context: Context
    ) => {
      logger.info("Resolver: registerPatient", { userId: input.userId });

      // If authenticated, verify user is registering their own profile or is admin
      if (context.auth.isAuthenticated && context.auth.user) {
        const currentUser = context.auth.user;
        if (currentUser.id !== input.userId && currentUser.role !== "ADMIN") {
          return {
            success: false,
            patient: null,
            errors: [{ message: "You can only register your own patient profile" }],
          };
        }
      }
      // If not authenticated, allow registration (guest user flow)
      // The userId in the input must match an existing user
      // This is safe because user IDs are UUIDs/cuids (not easily guessable)

      // Delegate to service
      const result = await context.services.patient.register(input);

      return {
        success: result.success,
        patient: result.patient || null,
        errors: result.errors,
      };
    },

    /**
     * Update an existing patient profile
     *
     * @param id - Patient's unique identifier
     * @param input - Fields to update
     * @returns PatientPayload with updated patient
     */
    updatePatient: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdatePatientInput },
      context: Context
    ) => {
      logger.info("Resolver: updatePatient", { patientId: id });

      // Verify authentication
      requireAuth(context);

      // Delegate to service
      const result = await context.services.patient.update(id, input);

      return {
        success: result.success,
        patient: result.patient || null,
        errors: result.errors,
      };
    },
  },

  /**
   * Patient Type Resolvers
   */
  Patient: {
    /**
     * Resolve user relation
     */
    user: async (parent: Patient, _args: unknown, context: Context) => {
      return context.prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },

    /**
     * Resolve appointments relation
     */
    appointments: async (parent: Patient, _args: unknown, context: Context) => {
      return context.prisma.appointment.findMany({
        where: { patientId: parent.id },
        orderBy: { schedule: "desc" },
      });
    },
  },
};

