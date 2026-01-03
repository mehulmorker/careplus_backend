import { Context } from "../context";
import { logger } from "../../utils/logger";

/**
 * Guest User Resolvers
 *
 * Handles GraphQL operations for guest user creation:
 * - createGuestUser: Create user and patient without password
 *
 * Guest users are created when patients want to book appointments
 * without creating a full account with password.
 */
export const guestResolvers = {
  Mutation: {
    /**
     * Create a guest user and patient profile
     *
     * This mutation:
     * 1. Creates a User account without password (guest user)
     * 2. Creates a minimal Patient profile automatically
     * 3. Returns both user and patient for immediate appointment booking
     *
     * No authentication required - this is for new patients.
     *
     * @param input - Guest user data (name, email, phone)
     * @returns GuestUserPayload with user, patient, and errors
     */
    createGuestUser: async (
      _parent: unknown,
      { input }: { input: { name: string; email: string; phone: string } },
      context: Context
    ) => {
      logger.info("Resolver: createGuestUser", { email: input.email });

      // Delegate to guest service
      const result = await context.services.guest.createGuestUserAndPatient(input);

      return {
        success: result.success,
        user: result.user || null,
        patient: result.patient || null,
        errors: result.errors,
      };
    },
  },
};


