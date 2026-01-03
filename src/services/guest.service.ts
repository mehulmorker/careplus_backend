import { User, Patient, Prisma, Gender } from "@prisma/client";
import { IUserRepository } from "../repositories/user.repository";
import { IPatientRepository } from "../repositories/patient.repository";
import { UserService, CreateUserInput } from "./user.service";
import { ValidationError, ConflictError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Guest User Service
 *
 * Handles creation of guest users (users without passwords)
 * and automatic patient profile creation for appointment booking.
 *
 * Guest users are created when patients want to book appointments
 * without creating a full account with password.
 */

export interface CreateGuestUserInput {
  name: string;
  email: string;
  phone: string;
}

export interface GuestUserResult {
  success: boolean;
  user?: User;
  patient?: Patient;
  errors: FieldError[];
}

export interface FieldError {
  field?: string;
  message: string;
  code?: string;
}

export class GuestService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userService: UserService,
    private readonly patientRepository: IPatientRepository
  ) {}

  /**
   * Create a guest user and minimal patient profile
   *
   * This creates:
   * 1. A User account without password (guest user)
   * 2. A minimal Patient profile with default values
   *
   * Business Rules:
   * - Email and phone must be unique
   * - If user already exists, return existing user and patient
   * - Patient profile is created with minimal required fields
   *
   * @param input - Guest user data (name, email, phone)
   * @returns GuestUserResult with user and patient
   */
  async createGuestUserAndPatient(
    input: CreateGuestUserInput
  ): Promise<GuestUserResult> {
    logger.info("GuestService.createGuestUserAndPatient", { email: input.email });

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(input.email);
      
      if (existingUser) {
        // User exists - check if they have a patient profile
        const existingPatient = await this.patientRepository.findByUserId(existingUser.id);
        
        if (existingPatient) {
          // Both user and patient exist - return them
          logger.info("User and patient already exist", { 
            userId: existingUser.id,
            patientId: existingPatient.id 
          });
          
          return {
            success: true,
            user: existingUser,
            patient: existingPatient,
            errors: [],
          };
        } else {
          // User exists but no patient - create patient profile
          const patient = await this.createMinimalPatient(existingUser.id);
          
          return {
            success: true,
            user: existingUser,
            patient,
            errors: [],
          };
        }
      }

      // Check phone uniqueness
      const existingByPhone = await this.userRepository.findByPhone(input.phone);
      if (existingByPhone) {
        return {
          success: false,
          errors: [{ field: "phone", message: "Phone number already registered" }],
        };
      }

      // Create guest user (no password)
      const createUserInput: CreateUserInput = {
        email: input.email,
        name: input.name,
        phone: input.phone,
        // No password - guest user
      };

      const user = await this.userService.create(createUserInput);

      // Create minimal patient profile
      const patient = await this.createMinimalPatient(user.id);

      logger.info("Guest user and patient created successfully", {
        userId: user.id,
        patientId: patient.id,
      });

      return {
        success: true,
        user,
        patient,
        errors: [],
      };
    } catch (error) {
      logger.error("Guest user creation failed", { error, input });

      if (error instanceof ValidationError || error instanceof ConflictError) {
        return {
          success: false,
          errors: [{ message: error.message }],
        };
      }

      throw error;
    }
  }

  /**
   * Create a minimal patient profile with default values
   *
   * This creates a patient profile with minimal required fields
   * so appointments can be booked immediately.
   *
   * @param userId - User ID to link patient to
   * @returns Created patient
   */
  private async createMinimalPatient(userId: string): Promise<Patient> {
    logger.debug("GuestService.createMinimalPatient", { userId });

    // Default values for minimal patient profile
    const patientData: Prisma.PatientCreateInput = {
      user: { connect: { id: userId } },
      birthDate: new Date("1990-01-01"), // Default date - can be updated later
      gender: Gender.OTHER, // Default gender
      address: "Not provided", // Default address
      occupation: "Not provided", // Default occupation
      emergencyContactName: "Not provided", // Default emergency contact
      emergencyContactNumber: "Not provided", // Default emergency contact number
      primaryPhysician: "Not assigned", // Default physician
      insuranceProvider: "Not provided", // Default insurance
      insurancePolicyNumber: "Not provided", // Default policy number
      privacyConsent: true, // Required for appointment booking
      treatmentConsent: true, // Required for appointment booking
      disclosureConsent: true, // Required for appointment booking
    };

    const patient = await this.patientRepository.create(patientData);

    logger.info("Minimal patient profile created", { patientId: patient.id });

    return patient;
  }
}

/**
 * Factory function for creating GuestService
 *
 * @param userRepository - User repository instance
 * @param userService - User service instance
 * @param patientRepository - Patient repository instance
 * @returns GuestService instance
 */
export const createGuestService = (
  userRepository: IUserRepository,
  userService: UserService,
  patientRepository: IPatientRepository
): GuestService => {
  return new GuestService(userRepository, userService, patientRepository);
};


