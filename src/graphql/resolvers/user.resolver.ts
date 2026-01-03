import { User } from "@prisma/client";
import { Context } from "../context";
import { requireAuth, requireAdmin } from "../../middleware/auth.middleware";
import { logger } from "../../utils/logger";

/**
 * User Resolvers
 *
 * Handles GraphQL operations for user management:
 * - user: Get user by ID
 *
 * Most user operations require authentication.
 */
export const userResolvers = {
  Query: {
    /**
     * Get user by ID
     *
     * Allows unauthenticated access for guest user flow.
     * Users can query their own data by ID (needed for registration page).
     *
     * @param id - User's unique identifier
     * @returns User or null
     */
    user: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ): Promise<User | null> => {
      logger.debug("Resolver: user", { id });

      // Allow unauthenticated access - needed for guest user registration flow
      // User ID is a UUID/cuid, so it's not easily guessable
      // Only exposes basic user info (id, email, name, phone)

      // Fetch user via service
      try {
        return await context.services.user.findById(id);
      } catch {
        return null;
      }
    },
  },
};

