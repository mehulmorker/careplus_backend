import { User } from "@prisma/client";
import { Context } from "../context";
import { requireAuth } from "../../middleware/auth.middleware";
import { logger } from "../../utils/logger";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from "../../utils/cookies";
import { TokenBlacklistService } from "../../services/token-blacklist.service";

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
     * Sets HTTP-only cookies with access and refresh tokens on success.
     *
     * @param input - Registration data (email, name, phone, password)
     * @returns AuthPayload with user and errors (no token - set in cookies)
     */
    register: async (
      _parent: unknown,
      { input }: { input: RegisterInput },
      context: Context
    ) => {
      logger.info("Resolver: register", { email: input.email });

      // Delegate to auth service
      const result = await context.services.auth.register(input);

      // If registration successful, set authentication cookies
      if (result.success && result.user) {
        const accessToken = context.services.auth.generateAccessToken(result.user);
        const refreshToken = context.services.auth.generateRefreshToken(result.user);

        setAccessTokenCookie(context.res, accessToken);
        setRefreshTokenCookie(context.res, refreshToken);

        logger.info("User registered and authenticated", {
          userId: result.user.id,
        });
      }

      return {
        success: result.success,
        user: result.user || null,
        errors: result.errors,
      };
    },

    /**
     * Login with email and password
     *
     * Authenticates user and sets HTTP-only cookies with access and refresh tokens.
     *
     * @param input - Login credentials (email, password)
     * @returns AuthPayload with user and errors (no token - set in cookies)
     */
    login: async (
      _parent: unknown,
      { input }: { input: LoginInput },
      context: Context
    ) => {
      logger.info("Resolver: login", { email: input.email });

      // Delegate to auth service
      const result = await context.services.auth.login(input);

      // If login successful, set authentication cookies
      if (result.success && result.user) {
        const accessToken = context.services.auth.generateAccessToken(result.user);
        const refreshToken = context.services.auth.generateRefreshToken(result.user);

        setAccessTokenCookie(context.res, accessToken);
        setRefreshTokenCookie(context.res, refreshToken);

        logger.info("User logged in and authenticated", {
          userId: result.user.id,
        });
      }

      return {
        success: result.success,
        user: result.user || null,
        errors: result.errors,
      };
    },

    /**
     * Logout current user
     *
     * Clears authentication cookies and blacklists tokens for proper logout.
     *
     * @returns true on success
     */
    logout: async (
      _parent: unknown,
      _args: unknown,
      context: Context
    ): Promise<boolean> => {
      const userId = context.auth.user?.id;
      logger.info("Resolver: logout", { userId });

      // Get tokens from cookies to blacklist them
      const accessToken = context.req.cookies?.accessToken;
      const refreshToken = context.req.cookies?.refreshToken;

      // Blacklist tokens if they exist
      if (accessToken || refreshToken) {
        const tokenBlacklist = context.services.tokenBlacklist;

        if (accessToken) {
          const accessTokenId = TokenBlacklistService.getTokenId(accessToken);
          // Get expiration from token (15 minutes from now)
          const expiresAt = Date.now() + 15 * 60 * 1000;
          tokenBlacklist.blacklistToken(accessTokenId, expiresAt);
        }

        if (refreshToken) {
          const refreshTokenId = TokenBlacklistService.getTokenId(refreshToken);
          // Get expiration from token (7 days from now)
          const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
          tokenBlacklist.blacklistToken(refreshTokenId, expiresAt);
        }
      }

      // Clear authentication cookies
      clearAuthCookies(context.res);

      logger.info("User logged out", { userId });
      return true;
    },

    /**
     * Refresh access token
     *
     * Uses refresh token from cookie to generate a new access token.
     * Sets new access token cookie on success.
     *
     * @returns AuthPayload with user and errors
     */
    refreshToken: async (
      _parent: unknown,
      _args: unknown,
      context: Context
    ) => {
      logger.debug("Resolver: refreshToken");

      const refreshToken = context.req.cookies?.refreshToken;

      if (!refreshToken) {
        return {
          success: false,
          user: null,
          errors: [
            {
              message: "Refresh token not found",
              code: "REFRESH_TOKEN_MISSING",
            },
          ],
        };
      }

      try {
        // Validate refresh token
        const payload = await context.services.auth.validateRefreshToken(
          refreshToken
        );

        // Fetch user from database
        const user = await context.repositories.user.findById(payload.userId);

        if (!user) {
          return {
            success: false,
            user: null,
            errors: [
              {
                message: "User not found",
                code: "USER_NOT_FOUND",
              },
            ],
          };
        }

        // Generate new access token
        const newAccessToken = context.services.auth.generateAccessToken(user);

        // Set new access token cookie
        setAccessTokenCookie(context.res, newAccessToken);

        logger.debug("Access token refreshed", { userId: user.id });

        return {
          success: true,
          user,
          errors: [],
        };
      } catch (error) {
        logger.warn("Refresh token validation failed", { error });
        return {
          success: false,
          user: null,
          errors: [
            {
              message: "Invalid or expired refresh token",
              code: "INVALID_REFRESH_TOKEN",
            },
          ],
        };
      }
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

