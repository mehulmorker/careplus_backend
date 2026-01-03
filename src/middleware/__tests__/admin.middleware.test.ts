import { describe, it, expect, beforeEach, vi } from "vitest";
import { requireAdmin } from "../auth.middleware";
import { AuthorizationError, AuthenticationError } from "../../utils/errors";
import { UserRole } from "@prisma/client";

/**
 * Admin Middleware Tests
 *
 * Tests admin authentication middleware:
 * - requireAdmin throws error for non-admin users
 * - requireAdmin throws error for unauthenticated users
 * - requireAdmin returns user for admin users
 */
describe("Admin Middleware", () => {
  const mockContext = {
    auth: {
      isAuthenticated: true,
      user: {
        id: "user-1",
        email: "admin@example.com",
        name: "Admin User",
        phone: "1234567890",
        role: UserRole.ADMIN,
        password: "hashed",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: "mock-token",
    },
  } as any;

  describe("requireAdmin", () => {
    it("should return user when user is admin", () => {
      const user = requireAdmin(mockContext);

      expect(user).toEqual(mockContext.auth.user);
      expect(user.role).toBe(UserRole.ADMIN);
    });

    it("should throw AuthorizationError when user is not admin", () => {
      const nonAdminContext = {
        auth: {
          ...mockContext.auth,
          user: {
            ...mockContext.auth.user,
            role: UserRole.PATIENT,
          },
        },
      } as any;

      expect(() => requireAdmin(nonAdminContext)).toThrow(AuthorizationError);
      expect(() => requireAdmin(nonAdminContext)).toThrow("Admin access required");
    });

    it("should throw AuthenticationError when user is not authenticated", () => {
      const unauthenticatedContext = {
        auth: {
          isAuthenticated: false,
          user: null,
          token: null,
        },
      } as any;

      expect(() => requireAdmin(unauthenticatedContext)).toThrow(AuthenticationError);
    });
  });
});

