import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { IUserRepository } from "../repositories/user.repository";
import { UserService, CreateUserInput } from "./user.service";
import {
  AuthenticationError,
  ValidationError,
} from "../utils/errors";
import { logger } from "../utils/logger";
import { env } from "../config";

/**
 * Authentication Service Interface
 */
export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  validateToken(token: string): Promise<TokenPayload>;
  hashPassword(password: string): Promise<string>;
  comparePasswords(password: string, hashedPassword: string): Promise<boolean>;
}

/**
 * Registration input
 */
export interface RegisterInput {
  email: string;
  name: string;
  phone: string;
  password: string;
}

/**
 * Login input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  token?: string;
  user?: User;
  errors: FieldError[];
}

/**
 * Field error for form validation
 */
export interface FieldError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * JWT Token payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication Service Implementation
 *
 * Handles all authentication-related business logic:
 * - User registration with password hashing
 * - Login with credential validation
 * - JWT token generation and validation
 *
 * Security Features:
 * 1. Passwords hashed with bcrypt (10 salt rounds)
 * 2. JWT tokens with expiration
 * 3. Timing-safe password comparison
 *
 * Why Separate Auth Service?
 * - Single Responsibility: Authentication is a distinct concern
 * - Security: Centralizes security-sensitive code
 * - Testability: Auth logic can be tested in isolation
 */
export class AuthService implements IAuthService {
  /**
   * Salt rounds for bcrypt hashing
   * Higher = more secure but slower
   * 10 is a good balance for most applications
   */
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userService: UserService
  ) {}

  /**
   * Register a new user
   *
   * Flow:
   * 1. Validate input
   * 2. Check unique constraints (via UserService)
   * 3. Hash password
   * 4. Create user
   * 5. Generate JWT token
   * 6. Return auth result
   *
   * @param input - Registration data
   * @returns AuthResult with token and user
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    logger.info("AuthService.register", { email: input.email });

    try {
      // Validate password strength
      const passwordErrors = this.validatePassword(input.password);
      if (passwordErrors.length > 0) {
        return {
          success: false,
          errors: passwordErrors,
        };
      }

      // Hash password before storage
      const hashedPassword = await this.hashPassword(input.password);

      // Create user via UserService (handles unique validation)
      const createInput: CreateUserInput = {
        email: input.email,
        name: input.name,
        phone: input.phone,
        password: hashedPassword,
      };

      const user = await this.userService.create(createInput);

      // Generate JWT token
      const token = this.generateToken(user);

      logger.info("User registered successfully", { userId: user.id });

      return {
        success: true,
        token,
        user,
        errors: [],
      };
    } catch (error) {
      logger.error("Registration failed", { error, email: input.email });

      // Handle known errors
      if (error instanceof ValidationError) {
        return {
          success: false,
          errors: [{ field: "email", message: error.message }],
        };
      }

      // Re-throw unexpected errors
      throw error;
    }
  }

  /**
   * Login with email and password
   *
   * Security Flow:
   * 1. Find user by email
   * 2. Compare password with hash (timing-safe)
   * 3. Generate JWT token on success
   *
   * Note: Same error message for invalid email or password
   * to prevent user enumeration attacks.
   *
   * @param input - Login credentials
   * @returns AuthResult with token and user
   */
  async login(input: LoginInput): Promise<AuthResult> {
    logger.info("AuthService.login", { email: input.email });

    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);

    // Generic error message for security
    const invalidCredentialsError: FieldError = {
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
    };

    if (!user) {
      logger.warn("Login failed: user not found", { email: input.email });
      return {
        success: false,
        errors: [invalidCredentialsError],
      };
    }

    // Check if user has a password (guest users don't have passwords)
    if (!user.password) {
      logger.warn("Login failed: guest user cannot login", { userId: user.id });
      return {
        success: false,
        errors: [{ message: "This account does not have a password. Please contact support." }],
      };
    }

    // Compare passwords
    const isPasswordValid = await this.comparePasswords(
      input.password,
      user.password
    );

    if (!isPasswordValid) {
      logger.warn("Login failed: invalid password", { userId: user.id });
      return {
        success: false,
        errors: [invalidCredentialsError],
      };
    }

    // Generate JWT token
    const token = this.generateToken(user);

    logger.info("User logged in successfully", { userId: user.id });

    return {
      success: true,
      token,
      user,
      errors: [],
    };
  }

  /**
   * Validate JWT token
   *
   * @param token - JWT token string
   * @returns Decoded token payload
   * @throws AuthenticationError if token is invalid
   */
  async validateToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.warn("Token validation failed", { error });
      throw new AuthenticationError("Invalid or expired token");
    }
  }

  /**
   * Hash a password using bcrypt
   *
   * bcrypt automatically handles:
   * - Salt generation
   * - Multiple hashing rounds
   * - Secure comparison
   *
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare plain password with hashed password
   *
   * Uses bcrypt's timing-safe comparison to prevent
   * timing attacks.
   *
   * @param password - Plain text password
   * @param hashedPassword - Stored hashed password
   * @returns true if passwords match
   */
  async comparePasswords(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT token for a user
   *
   * Token contains:
   * - userId: For identifying the user
   * - email: For display/logging
   * - role: For authorization checks
   *
   * @param user - User entity
   * @returns JWT token string
   */
  private generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * Validate password strength
   *
   * Requirements:
   * - Minimum 8 characters
   *
   * @param password - Password to validate
   * @returns Array of validation errors (empty if valid)
   */
  private validatePassword(password: string): FieldError[] {
    const errors: FieldError[] = [];

    if (password.length < 8) {
      errors.push({
        field: "password",
        message: "Password must be at least 8 characters long",
        code: "PASSWORD_TOO_SHORT",
      });
    }

    return errors;
  }
}

/**
 * Factory function for creating AuthService
 *
 * @param userRepository - User repository instance
 * @param userService - User service instance
 * @returns AuthService instance
 */
export const createAuthService = (
  userRepository: IUserRepository,
  userService: UserService
): AuthService => {
  return new AuthService(userRepository, userService);
};

