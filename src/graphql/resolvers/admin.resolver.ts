import { AppointmentStatus } from "@prisma/client";
import { Context } from "../context";
import { requireAdmin } from "../../middleware";
import { logger } from "../../utils/logger";
import { ValidationError, AuthorizationError } from "../../utils/errors";

/**
 * Admin Resolvers
 *
 * Handles admin-specific GraphQL operations:
 * - getAppointmentStats: Get appointment statistics for dashboard
 * - createAdmin: Create a new admin user (requires existing admin)
 * - All appointment mutations are already in appointment.resolver.ts
 *   but require admin role for scheduling/cancelling
 */
export const adminResolvers = {
  Query: {
    /**
     * Get appointment statistics for admin dashboard
     *
     * Requires: Admin authentication
     *
     * @returns AppointmentStatistics with counts
     */
    getAppointmentStats: async (
      _parent: unknown,
      _args: unknown,
      context: Context
    ) => {
      logger.debug("Resolver: getAppointmentStats");

      // Require admin authentication
      requireAdmin(context);

      return context.services.admin.getAppointmentStatistics();
    },
  },

  Mutation: {
    /**
     * Create a new admin user
     *
     * Public API - No authentication required
     * Requires: Valid admin secret key (must match ADMIN_SECRET_KEY env variable)
     *
     * @param input - Admin creation data (email, name, phone, password, secretKey)
     * @returns AuthPayload with user (no token - admin should login separately)
     */
    createAdmin: async (
      _parent: unknown,
      {
        input,
      }: {
        input: {
          email: string;
          name: string;
          phone: string;
          password: string;
          secretKey: string;
        };
      },
      context: Context
    ) => {
      logger.info("Resolver: createAdmin", { email: input.email });

      // No authentication required - public API
      // Secret key validation happens in service

      try {
        // Create admin user (secret key validation happens in service)
        const admin = await context.services.admin.createAdmin({
          email: input.email,
          name: input.name,
          phone: input.phone,
          password: input.password,
          secretKey: input.secretKey,
        });

        logger.info("Admin user created successfully", { userId: admin.id });

        return {
          success: true,
          token: null, // Don't return token - admin should login separately
          user: admin,
          errors: [],
        };
      } catch (error) {
        logger.error("Failed to create admin", { error, email: input.email });

        if (error instanceof ValidationError) {
          return {
            success: false,
            token: null,
            user: null,
            errors: [{ field: "email", message: error.message }],
          };
        }

        if (error instanceof AuthorizationError) {
          return {
            success: false,
            token: null,
            user: null,
            errors: [{ field: "secretKey", message: error.message }],
          };
        }

        // Re-throw unexpected errors
        throw error;
      }
    },
  },
};
