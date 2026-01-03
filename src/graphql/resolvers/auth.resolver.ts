import { User } from "@prisma/client";
import { Context } from "../context";
import { requireAuth } from "../../middleware/auth.middleware";
import { logger } from "../../utils/logger";

/**
 * Auth Resolver Types
 */
export interface RegisterInput {
  email: string;
  name: string;
  phone: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Authentication Resolvers
 *
 * Handles GraphQL operations for authentication:
 * - register: Create new user account
 * - login: Authenticate existing user
 * - logout: End user session
 * - me: Get current authenticated user
 *
 * Resolver Pattern:
 * - Resolvers are THIN - they delegate to services
 * - Input validation happens in resolvers
 * - Business logic stays in services
 * - Error handling at resolver level
 */
export const authResolvers = {
  Query: {
    /**
     * Get current authenticated user
     *
     * Requires: Authentication
     *
     * @returns Current user or null if not authenticated
     */
    me: async (
      _parent: unknown,
      _args: unknown,
      context: Context
    ): Promise<User | null> => {
      logger.debug("Resolver: me");

      // Return authenticated user from context
      return context.auth.user;
    },
  },

  Mutation: {
    /**
     * Register a new user
     *
     * Creates a new user account with the provided information.
     * Returns authentication token on success.
     *
     * @param input - Registration data (email, name, phone, password)
     * @returns AuthPayload with token, user, and errors
     */
    register: async (
      _parent: unknown,
      { input }: { input: RegisterInput },
      context: Context
    ) => {
      logger.info("Resolver: register", { email: input.email });

      // Delegate to auth service
      const result = await context.services.auth.register(input);

      return {
        success: result.success,
        token: result.token || null,
        user: result.user || null,
        errors: result.errors,
      };
    },

    /**
     * Login with email and password
     *
     * Authenticates user and returns JWT token.
     *
     * @param input - Login credentials (email, password)
     * @returns AuthPayload with token, user, and errors
     */
    login: async (
      _parent: unknown,
      { input }: { input: LoginInput },
      context: Context
    ) => {
      logger.info("Resolver: login", { email: input.email });

      // Delegate to auth service
      const result = await context.services.auth.login(input);

      return {
        success: result.success,
        token: result.token || null,
        user: result.user || null,
        errors: result.errors,
      };
    },

    /**
     * Logout current user
     *
     * Note: With JWT, logout is client-side (delete token).
     * This endpoint is for consistency and potential future
     * token blacklisting implementation.
     *
     * @returns true on success
     */
    logout: async (
      _parent: unknown,
      _args: unknown,
      context: Context
    ): Promise<boolean> => {
      logger.info("Resolver: logout", { userId: context.auth.user?.id });

      // JWT logout is handled client-side by removing the token
      // In the future, we could implement token blacklisting here
      return true;
    },
  },

  /**
   * User Type Resolvers
   *
   * Resolve fields on the User type that need special handling.
   */
  User: {
    /**
     * Resolve patient relation
     */
    patient: async (parent: User, _args: unknown, context: Context) => {
      return context.prisma.patient.findUnique({
        where: { userId: parent.id },
      });
    },
  },
};

