import { Context } from "../context";
import { logger } from "../../utils/logger";

/**
 * Doctor Type
 */
export interface Doctor {
  id: string;
  name: string;
  image: string;
  specialty: string | null;
}

/**
 * Doctor Resolvers
 *
 * Handles GraphQL operations for doctors (read-only).
 * Doctors are seeded data used for appointment scheduling.
 */
export const doctorResolvers = {
  Query: {
    /**
     * Get all doctors
     *
     * Public endpoint - no authentication required.
     * Returns list of available doctors for appointment booking.
     *
     * @returns Array of doctors
     */
    doctors: async (
      _parent: unknown,
      _args: unknown,
      context: Context
    ): Promise<Doctor[]> => {
      logger.debug("Resolver: doctors");

      const doctors = await context.prisma.doctor.findMany({
        orderBy: { name: "asc" },
      });

      return doctors;
    },
  },
};

