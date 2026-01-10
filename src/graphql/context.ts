// Use 'any' for Express types to avoid Apollo Server type conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Request = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Response = any;
import { PrismaClient } from "@prisma/client";
import { prisma } from "../config/database";
import {
  UserRepository,
  createUserRepository,
  PatientRepository,
  createPatientRepository,
  AppointmentRepository,
  createAppointmentRepository,
} from "../repositories";
import {
  UserService,
  AuthService,
  PatientService,
  AppointmentService,
  AdminService,
  EmailService,
  GuestService,
  CloudinaryService,
  TokenBlacklistService,
  createUserService,
  createAuthService,
  createPatientService,
  createAppointmentService,
  createAdminService,
  createEmailService,
  createGuestService,
  createCloudinaryService,
  createTokenBlacklistService,
} from "../services";
import { AuthContext, createAuthContext } from "../middleware/auth.middleware";

/**
 * GraphQL Context Interface
 *
 * Contains all dependencies needed by resolvers.
 * Follows Dependency Injection pattern - resolvers receive dependencies via context.
 *
 * Why Context?
 * 1. Provides access to authenticated user
 * 2. Provides access to services (business logic)
 * 3. Provides access to repositories (data access)
 * 4. Each request gets fresh context
 * 5. Enables testing by mocking context
 */
export interface Context {
  /**
   * Original Express request
   */
  req: Request;

  /**
   * Original Express response
   */
  res: Response;

  /**
   * Prisma client for database access
   */
  prisma: PrismaClient;

  /**
   * Authentication context
   * Contains authenticated user, token, and auth status
   */
  auth: AuthContext;

  /**
   * Repository instances
   */
  repositories: {
    user: UserRepository;
    patient: PatientRepository;
    appointment: AppointmentRepository;
  };

  /**
   * Service instances
   */
  services: {
    user: UserService;
    auth: AuthService;
    patient: PatientService;
    appointment: AppointmentService;
    admin: AdminService;
    email: EmailService;
    guest: GuestService;
    cloudinary: CloudinaryService;
    tokenBlacklist: TokenBlacklistService;
  };
}

/**
 * Express middleware context type
 */
interface ExpressContext {
  req: Request;
  res: Response;
}

/**
 * Create GraphQL context for each request
 *
 * This function is called for EVERY GraphQL request.
 * It sets up:
 * 1. Database connection (shared Prisma instance)
 * 2. Repositories
 * 3. Services
 * 4. Authentication context
 *
 * Architecture Pattern: Composition Root
 * - All dependencies are created/wired here
 * - Resolvers receive fully configured context
 *
 * @param expressContext - Express request/response
 * @returns GraphQL context
 */
export const createContext = async ({
  req,
  res,
}: ExpressContext): Promise<Context> => {
  // Create repositories
  const userRepository = createUserRepository(prisma);
  const patientRepository = createPatientRepository(prisma);
  const appointmentRepository = createAppointmentRepository(prisma);

  // Create token blacklist service (singleton)
  const tokenBlacklist = createTokenBlacklistService();

  // Create services (with dependency injection)
  const userService = createUserService(userRepository);
  const authService = createAuthService(userRepository, userService, tokenBlacklist);
  const patientService = createPatientService(
    patientRepository,
    userRepository
  );
  const guestService = createGuestService(
    userRepository,
    userService,
    patientRepository
  );
  const emailService = createEmailService();
  const cloudinaryService = createCloudinaryService();
  const appointmentService = createAppointmentService(
    appointmentRepository,
    patientRepository,
    emailService
  );
  const adminService = createAdminService(appointmentRepository, userRepository);

  // Create authentication context (reads from cookies)
  const auth = await createAuthContext(req, res, authService, userRepository);

  return {
    req,
    res,
    prisma,
    auth,
    repositories: {
      user: userRepository,
      patient: patientRepository,
      appointment: appointmentRepository,
    },
    services: {
      user: userService,
      auth: authService,
      patient: patientService,
      appointment: appointmentService,
      admin: adminService,
      email: emailService,
      guest: guestService,
      cloudinary: cloudinaryService,
      tokenBlacklist,
    },
  };
};

/**
 * Context type for resolvers
 *
 * Use this type in resolver function signatures.
 */
export type ResolverContext = Context;
