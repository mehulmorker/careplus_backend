import { AppointmentStatus } from "@prisma/client";
import { Context } from "../context";
import { requireAdmin } from "../../middleware";
import { logger } from "../../utils/logger";

/**
 * Admin Resolvers
 *
 * Handles admin-specific GraphQL operations:
 * - getAppointmentStats: Get appointment statistics for dashboard
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
};

