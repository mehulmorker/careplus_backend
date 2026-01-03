import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import { AuthService, TokenPayload } from "../services/auth.service";
import { IUserRepository } from "../repositories/user.repository";
import { AuthenticationError, AuthorizationError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

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
 * Extract JWT token from Authorization header
 *
 * Expected format: "Bearer <token>"
 *
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
};

/**
 * Create authentication context for GraphQL requests
 *
 * This is called for every GraphQL request to:
 * 1. Extract token from headers
 * 2. Validate token
 * 3. Fetch user from database
 * 4. Return auth context
 *
 * Note: Does NOT throw errors - returns null user for unauthenticated requests.
 * Individual resolvers decide if authentication is required.
 *
 * @param req - Express request object
 * @param authService - Auth service instance
 * @param userRepository - User repository instance
 * @returns AuthContext with user info
 */
export const createAuthContext = async (
  req: Request,
  authService: AuthService,
  userRepository: IUserRepository
): Promise<AuthContext> => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }

  try {
    // Validate token and get payload
    const payload = await authService.validateToken(token);

    // Fetch user from database
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      logger.warn("Token valid but user not found", { userId: payload.userId });
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    }

    return {
      user,
      token,
      isAuthenticated: true,
    };
  } catch (error) {
    // Token validation failed - return unauthenticated context
    logger.debug("Token validation failed", { error });
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }
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

/**
 * Express Middleware for Authentication
 *
 * Use for REST endpoints (if any).
 * For GraphQL, use createAuthContext instead.
 */
export const authMiddleware = (
  authService: AuthService,
  userRepository: IUserRepository
) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const authHeader = (req as Request).headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    try {
      const payload = await authService.validateToken(token);
      const user = await userRepository.findById(payload.userId);

      if (user) {
        req.user = user;
        req.token = token;
      }

      next();
    } catch (error) {
      // Continue without authentication - let route handlers decide
      next();
    }
  };
};

