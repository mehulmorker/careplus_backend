import { AppointmentStatus, UserRole } from "@prisma/client";
import { IAppointmentRepository } from "../repositories/appointment.repository";
import { IUserRepository } from "../repositories/user.repository";
import { AppointmentStatistics } from "./appointment.service";
import { logger } from "../utils/logger";
import { ValidationError, AuthorizationError } from "../utils/errors";
import bcrypt from "bcrypt";
import { env } from "../config/environment";

/**
 * Admin Service Interface
 */
export interface IAdminService {
  getAppointmentStatistics(): Promise<AppointmentStatistics>;
  getAppointmentsByStatus(status?: AppointmentStatus): Promise<any[]>;
  createAdmin(input: CreateAdminInput): Promise<any>;
}

/**
 * Input for creating an admin user
 */
export interface CreateAdminInput {
  email: string;
  name: string;
  phone: string;
  password: string;
  secretKey: string;
}

/**
 * Admin Service Implementation
 *
 * Handles admin-specific operations:
 * - Appointment statistics
 * - Appointment management (scheduling, cancelling)
 * - Admin dashboard data
 * - Admin user creation
 *
 * Note: Most appointment operations are in AppointmentService.
 * This service focuses on admin-specific aggregations and views.
 */
export class AdminService implements IAdminService {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Get appointment statistics for admin dashboard
   *
   * @returns Appointment statistics (total, scheduled, pending, cancelled)
   */
  async getAppointmentStatistics(): Promise<AppointmentStatistics> {
    logger.debug("AdminService.getAppointmentStatistics");

    return this.appointmentRepository.getStatistics();
  }

  /**
   * Get appointments filtered by status
   *
   * @param status - Optional status filter
   * @returns Array of appointments
   */
  async getAppointmentsByStatus(status?: AppointmentStatus): Promise<any[]> {
    logger.debug("AdminService.getAppointmentsByStatus", { status });

    const filters = status ? { status } : undefined;
    return this.appointmentRepository.findAll(filters);
  }

  /**
   * Create a new admin user
   *
   * Business Rules:
   * 1. Secret key must match environment variable
   * 2. Email must be unique
   * 3. Phone must be unique
   * 4. Password must be hashed before storage
   * 5. User is created with ADMIN role
   *
   * @param input - Admin creation data (including secret key)
   * @returns Created admin user
   * @throws AuthorizationError if secret key doesn't match
   * @throws ValidationError if constraints violated
   */
  async createAdmin(input: CreateAdminInput): Promise<any> {
    logger.info("AdminService.createAdmin", { email: input.email });

    // Validate secret key first (security check)
    if (input.secretKey !== env.ADMIN_SECRET_KEY) {
      logger.warn("Invalid admin secret key provided", { email: input.email });
      throw new AuthorizationError("Invalid admin secret key");
    }

    // Validate unique constraints
    const existingByEmail = await this.userRepository.findByEmail(input.email);
    if (existingByEmail) {
      logger.warn("Email already exists", { email: input.email });
      throw new ValidationError("Email already registered");
    }

    const existingByPhone = await this.userRepository.findByPhone(input.phone);
    if (existingByPhone) {
      logger.warn("Phone already exists", { phone: input.phone });
      throw new ValidationError("Phone number already registered");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(input.password, saltRounds);

    // Create admin user
    const admin = await this.userRepository.create({
      email: input.email,
      name: input.name,
      phone: input.phone,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    logger.info("Admin user created successfully", { userId: admin.id });

    return admin;
  }
}

/**
 * Factory function for creating AdminService
 *
 * @param appointmentRepository - Appointment repository instance
 * @param userRepository - User repository instance
 * @returns AdminService instance
 */
export const createAdminService = (
  appointmentRepository: IAppointmentRepository,
  userRepository: IUserRepository
): AdminService => {
  return new AdminService(appointmentRepository, userRepository);
};
