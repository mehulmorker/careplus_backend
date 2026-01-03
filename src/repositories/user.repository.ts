import { PrismaClient, User, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository";

/**
 * User Repository Interface
 *
 * Extends base repository with user-specific operations.
 * Following Interface Segregation Principle (ISP).
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  delete(id: string): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
}

/**
 * User Repository Implementation
 *
 * Handles all data access operations for the User entity.
 * Following Single Responsibility Principle (SRP) - only handles User data access.
 *
 * Why Repository Pattern?
 * 1. Abstracts data access logic from business logic
 * 2. Makes testing easier (can mock repository)
 * 3. Centralizes query logic
 * 4. Allows changing data source without affecting services
 */
export class UserRepository
  extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput>
  implements IUserRepository
{
  /**
   * Find user by unique ID
   *
   * @param id - User's unique identifier
   * @returns User if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email address
   *
   * Used for:
   * - Login validation
   * - Duplicate email check during registration
   *
   * @param email - User's email address
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Find user by phone number
   *
   * @param phone - User's phone number
   * @returns User if found, null otherwise
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Find all users
   *
   * Note: In production, consider pagination for large datasets
   *
   * @returns Array of all users
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new user
   *
   * @param data - User creation data
   * @returns Created user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(), // Normalize email
      },
    });
  }

  /**
   * Update an existing user
   *
   * @param id - User's unique identifier
   * @param data - Fields to update
   * @returns Updated user
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        // Normalize email if being updated
        email:
          typeof data.email === "string" ? data.email.toLowerCase() : undefined,
      },
    });
  }

  /**
   * Delete a user
   *
   * @param id - User's unique identifier
   * @returns Deleted user
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Check if email already exists
   *
   * More efficient than findByEmail for existence checks
   *
   * @param email - Email to check
   * @returns true if email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  /**
   * Check if phone already exists
   *
   * @param phone - Phone number to check
   * @returns true if phone exists
   */
  async existsByPhone(phone: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { phone },
    });
    return count > 0;
  }

  /**
   * Find user with their patient profile
   *
   * @param id - User's unique identifier
   * @returns User with patient relation
   */
  async findByIdWithPatient(id: string): Promise<User & { patient: any } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { patient: true },
    });
  }
}

/**
 * Factory function for creating UserRepository
 *
 * Used for dependency injection in the application context.
 *
 * @param prisma - Prisma client instance
 * @returns UserRepository instance
 */
export const createUserRepository = (prisma: PrismaClient): UserRepository => {
  return new UserRepository(prisma);
};

