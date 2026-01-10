import { Request, Response } from "express";
import { User } from "@prisma/client";
import { AuthService } from "../services/auth.service";
import { IUserRepository } from "../repositories/user.repository";
import { AuthenticationError, AuthorizationError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Authentication Context for GraphQL
 *
 * Contains the authenticated user and helper methods
 */
export interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Extract access token from cookies
 *
 * @param cookies - Request cookies object
 * @returns Access token string or null
 */
export const extractTokenFromCookies = (cookies?: {
  accessToken?: string;
  refreshToken?: string;
}): { accessToken: string | null; refreshToken: string | null } => {
  if (!cookies) {
    return { accessToken: null, refreshToken: null };
  }

  return {
    accessToken: cookies.accessToken || null,
    refreshToken: cookies.refreshToken || null,
  };
};

/**
 * Create authentication context for GraphQL requests
 *
 * This is called for every GraphQL request to:
 * 1. Extract access token from cookies
 * 2. Validate access token
 * 3. If access token invalid/expired, try refresh token
 * 4. Fetch user from database
 * 5. Return auth context
 *
 * Note: Does NOT throw errors - returns null user for unauthenticated requests.
 * Individual resolvers decide if authentication is required.
 *
 * @param req - Express request object
 * @param res - Express response object (for setting new access token if refreshed)
 * @param authService - Auth service instance
 * @param userRepository - User repository instance
 * @returns AuthContext with user info
 */
export const createAuthContext = async (
  req: Request,
  res: Response,
  authService: AuthService,
  userRepository: IUserRepository
): Promise<AuthContext> => {
  const { accessToken, refreshToken } = extractTokenFromCookies(req.cookies);

  // Try to validate access token first
  if (accessToken) {
    try {
      const payload = await authService.validateToken(accessToken);
      const user = await userRepository.findById(payload.userId);

      if (user) {
        return {
          user,
          token: accessToken,
          isAuthenticated: true,
        };
      }
    } catch (error) {
      // Access token invalid/expired - try refresh token
      logger.debug("Access token validation failed, trying refresh token", {
        error,
      });
    }
  }

  // If access token missing or invalid, try refresh token
  if (refreshToken) {
    try {
      const payload = await authService.validateRefreshToken(refreshToken);
      const user = await userRepository.findById(payload.userId);

      if (user) {
        // Generate new access token and set cookie
        const newAccessToken = authService.generateAccessToken(user);
        
        // Set new access token cookie
        const { setAccessTokenCookie } = await import("../utils/cookies");
        setAccessTokenCookie(res, newAccessToken);

        logger.debug("Access token refreshed", { userId: user.id });

        return {
          user,
          token: newAccessToken,
          isAuthenticated: true,
        };
      }
    } catch (error) {
      // Refresh token also invalid
      logger.debug("Refresh token validation failed", { error });
    }
  }

  // No valid tokens
  return {
    user: null,
    token: null,
    isAuthenticated: false,
  };
};

/**
 * Authentication Guard for Resolvers
 *
 * Use this in resolvers that require authentication.
 *
 * @param context - GraphQL context with auth info
 * @throws AuthenticationError if user not authenticated
 */
export const requireAuth = (context: { auth: AuthContext }): User => {
  if (!context.auth.isAuthenticated || !context.auth.user) {
    throw new AuthenticationError("Authentication required");
  }
  return context.auth.user;
};

/**
 * Admin Authorization Guard for Resolvers
 *
 * Use this in resolvers that require admin role.
 *
 * @param context - GraphQL context with auth info
 * @throws AuthenticationError if not authenticated
 * @throws AuthorizationError if not admin
 */
export const requireAdmin = (context: { auth: AuthContext }): User => {
  const user = requireAuth(context);

  if (user.role !== "ADMIN") {
    throw new AuthorizationError("Admin access required");
  }

  return user;
};


