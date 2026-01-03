import { User, Prisma, UserRole } from "@prisma/client";
import { IUserRepository } from "../repositories/user.repository";
import { ValidationError, NotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * User Service Interface
 *
 * Defines the contract for user-related business operations.
 * Following Interface Segregation Principle (ISP).
 */
export interface IUserService {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<User>;
  validateUniqueConstraints(email: string, phone: string, excludeId?: string): Promise<void>;
}

/**
 * Input type for creating a user
 */
export interface CreateUserInput {
  email: string;
  name: string;
  phone: string;
  password?: string; // Optional - guest users don't have passwords
}

/**
 * Input type for updating a user
 */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  phone?: string;
}

/**
 * User Service Implementation
 *
 * Handles all business logic related to users.
 * Following Single Responsibility Principle (SRP) - only handles user business logic.
 *
 * Why Service Layer?
 * 1. Separates business logic from data access (repository) and API (resolvers)
 * 2. Makes business rules testable in isolation
 * 3. Allows reusing business logic across different entry points
 * 4. Centralizes validation and business rules
 *
 * Architecture Flow:
 * GraphQL Resolver → Service → Repository → Database
 */
export class UserService implements IUserService {
  /**
   * Constructor with dependency injection
   *
   * Following Dependency Inversion Principle (DIP):
   * - Depends on abstraction (IUserRepository) not concretion
   * - Repository is injected, not created internally
   *
   * @param userRepository - Injected user repository
   */
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Find user by ID
   *
   * @param id - User's unique identifier
   * @returns User entity
   * @throws NotFoundError if user doesn't exist
   */
  async findById(id: string): Promise<User> {
    logger.debug("UserService.findById", { id });

    const user = await this.userRepository.findById(id);

    if (!user) {
      logger.warn("User not found", { id });
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   *
   * @param email - User's email address
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    logger.debug("UserService.findByEmail", { email });
    return this.userRepository.findByEmail(email);
  }

  /**
   * Create a new user
   *
   * Business Rules:
   * 1. Email must be unique (case-insensitive)
   * 2. Phone must be unique
   * 3. Password will be hashed by AuthService before calling this
   *
   * @param input - User creation data
   * @returns Created user
   * @throws ValidationError if constraints violated
   */
  async create(input: CreateUserInput): Promise<User> {
    logger.info("UserService.create", { email: input.email });

    // Validate unique constraints
    await this.validateUniqueConstraints(input.email, input.phone);

    // Create user with default role
    const userData: Prisma.UserCreateInput = {
      email: input.email,
      name: input.name,
      phone: input.phone,
      ...(input.password && { password: input.password }), // Only include if provided (already hashed by AuthService)
      role: UserRole.PATIENT, // Default role
    };

    const user = await this.userRepository.create(userData);

    logger.info("User created successfully", { userId: user.id });

    return user;
  }

  /**
   * Update an existing user
   *
   * @param id - User's unique identifier
   * @param input - Fields to update
   * @returns Updated user
   * @throws NotFoundError if user doesn't exist
   * @throws ValidationError if constraints violated
   */
  async update(id: string, input: UpdateUserInput): Promise<User> {
    logger.info("UserService.update", { id, fields: Object.keys(input) });

    // Verify user exists
    await this.findById(id);

    // Validate unique constraints if email or phone being updated
    if (input.email || input.phone) {
      const currentUser = await this.userRepository.findById(id);
      await this.validateUniqueConstraints(
        input.email || currentUser!.email,
        input.phone || currentUser!.phone,
        id // Exclude current user from duplicate check
      );
    }

    const updateData: Prisma.UserUpdateInput = {
      ...(input.email && { email: input.email }),
      ...(input.name && { name: input.name }),
      ...(input.phone && { phone: input.phone }),
    };

    const user = await this.userRepository.update(id, updateData);

    logger.info("User updated successfully", { userId: id });

    return user;
  }

  /**
   * Delete a user
   *
   * @param id - User's unique identifier
   * @returns Deleted user
   * @throws NotFoundError if user doesn't exist
   */
  async delete(id: string): Promise<User> {
    logger.info("UserService.delete", { id });

    // Verify user exists
    await this.findById(id);

    const user = await this.userRepository.delete(id);

    logger.info("User deleted successfully", { userId: id });

    return user;
  }

  /**
   * Validate unique constraints for email and phone
   *
   * Business Rule: Both email and phone must be unique across all users.
   *
   * @param email - Email to check
   * @param phone - Phone to check
   * @param excludeId - User ID to exclude (for updates)
   * @throws ValidationError if constraints violated
   */
  async validateUniqueConstraints(
    email: string,
    phone: string,
    excludeId?: string
  ): Promise<void> {
    // Check email uniqueness
    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail && existingByEmail.id !== excludeId) {
      logger.warn("Email already exists", { email });
      throw new ValidationError("Email already registered");
    }

    // Check phone uniqueness
    const existingByPhone = await this.userRepository.findByPhone(phone);
    if (existingByPhone && existingByPhone.id !== excludeId) {
      logger.warn("Phone already exists", { phone });
      throw new ValidationError("Phone number already registered");
    }
  }
}

/**
 * Factory function for creating UserService
 *
 * @param userRepository - User repository instance
 * @returns UserService instance
 */
export const createUserService = (userRepository: IUserRepository): UserService => {
  return new UserService(userRepository);
};

