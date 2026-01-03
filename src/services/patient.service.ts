import { Patient, Gender, Prisma } from "@prisma/client";
import { IPatientRepository } from "../repositories/patient.repository";
import { IUserRepository } from "../repositories/user.repository";
import { ValidationError, NotFoundError, ConflictError } from "../utils/errors";
import { logger } from "../utils/logger";

/**
 * Patient Service Interface
 */
export interface IPatientService {
  findById(id: string): Promise<Patient>;
  findByUserId(userId: string): Promise<Patient>;
  register(input: RegisterPatientInput): Promise<PatientResult>;
  update(id: string, input: UpdatePatientInput): Promise<PatientResult>;
  delete(id: string): Promise<Patient>;
}

/**
 * Input type for registering a patient
 */
export interface RegisterPatientInput {
  userId: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  identificationType?: string;
  identificationNumber?: string;
  identificationDocumentId?: string;
  identificationDocumentUrl?: string;
  privacyConsent: boolean;
  treatmentConsent: boolean;
  disclosureConsent: boolean;
}

/**
 * Input type for updating a patient
 */
export interface UpdatePatientInput {
  birthDate?: Date;
  gender?: Gender;
  address?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  primaryPhysician?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  identificationType?: string;
  identificationNumber?: string;
  identificationDocumentId?: string;
  identificationDocumentUrl?: string;
  privacyConsent?: boolean;
  treatmentConsent?: boolean;
  disclosureConsent?: boolean;
}

/**
 * Result type for patient operations
 */
export interface PatientResult {
  success: boolean;
  patient?: Patient;
  errors: FieldError[];
}

/**
 * Field error type
 */
export interface FieldError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Patient Service Implementation
 *
 * Handles all business logic related to patient registration and management.
 *
 * Key responsibilities:
 * - Validate patient registration data
 * - Ensure user exists before creating patient
 * - Prevent duplicate patient profiles
 * - Handle consent requirements
 */
export class PatientService implements IPatientService {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Find patient by ID
   *
   * @param id - Patient's unique identifier
   * @returns Patient entity
   * @throws NotFoundError if patient doesn't exist
   */
  async findById(id: string): Promise<Patient> {
    logger.debug("PatientService.findById", { id });

    const patient = await this.patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundError("Patient", id);
    }

    return patient;
  }

  /**
   * Find patient by user ID
   *
   * @param userId - User's unique identifier
   * @returns Patient entity
   * @throws NotFoundError if patient doesn't exist
   */
  async findByUserId(userId: string): Promise<Patient> {
    logger.debug("PatientService.findByUserId", { userId });

    const patient = await this.patientRepository.findByUserId(userId);

    if (!patient) {
      throw new NotFoundError("Patient profile for user", userId);
    }

    return patient;
  }

  /**
   * Register or update a patient profile
   *
   * Business Rules:
   * 1. User must exist
   * 2. If patient profile exists, update it (for guest user flow)
   * 3. If patient profile doesn't exist, create it
   * 4. Required consents must be provided
   * 5. All required fields must be valid
   *
   * @param input - Patient registration data
   * @returns PatientResult with created/updated patient
   */
  async register(input: RegisterPatientInput): Promise<PatientResult> {
    logger.info("PatientService.register", { userId: input.userId });

    try {
      // Validate user exists
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        return {
          success: false,
          errors: [{ field: "userId", message: "User not found" }],
        };
      }

      // Validate consents (required for both create and update)
      if (!input.privacyConsent) {
        return {
          success: false,
          errors: [{ field: "privacyConsent", message: "Privacy consent is required" }],
        };
      }

      if (!input.treatmentConsent) {
        return {
          success: false,
          errors: [{ field: "treatmentConsent", message: "Treatment consent is required" }],
        };
      }

      if (!input.disclosureConsent) {
        return {
          success: false,
          errors: [{ field: "disclosureConsent", message: "Disclosure consent is required" }],
        };
      }

      // Check for existing patient profile
      const existingPatient = await this.patientRepository.findByUserId(input.userId);
      if (existingPatient) {
        // Patient exists - update it instead of creating new one
        // This handles the guest user flow where a minimal patient was created
        logger.info("Patient profile exists, updating instead of creating", { 
          patientId: existingPatient.id,
          userId: input.userId 
        });
        
        return await this.update(existingPatient.id, {
          birthDate: input.birthDate,
          gender: input.gender,
          address: input.address,
          occupation: input.occupation,
          emergencyContactName: input.emergencyContactName,
          emergencyContactNumber: input.emergencyContactNumber,
          primaryPhysician: input.primaryPhysician,
          insuranceProvider: input.insuranceProvider,
          insurancePolicyNumber: input.insurancePolicyNumber,
          allergies: input.allergies,
          currentMedication: input.currentMedication,
          familyMedicalHistory: input.familyMedicalHistory,
          pastMedicalHistory: input.pastMedicalHistory,
          identificationType: input.identificationType,
          identificationNumber: input.identificationNumber,
          identificationDocumentId: input.identificationDocumentId,
          identificationDocumentUrl: input.identificationDocumentUrl,
          privacyConsent: input.privacyConsent,
          treatmentConsent: input.treatmentConsent,
          disclosureConsent: input.disclosureConsent,
        });
      }
      if (!input.privacyConsent) {
        return {
          success: false,
          errors: [{ field: "privacyConsent", message: "Privacy consent is required" }],
        };
      }

      if (!input.treatmentConsent) {
        return {
          success: false,
          errors: [{ field: "treatmentConsent", message: "Treatment consent is required" }],
        };
      }

      // Create patient data (only if patient doesn't exist)
      const patientData: Prisma.PatientCreateInput = {
        user: { connect: { id: input.userId } },
        birthDate: input.birthDate,
        gender: input.gender,
        address: input.address,
        occupation: input.occupation,
        emergencyContactName: input.emergencyContactName,
        emergencyContactNumber: input.emergencyContactNumber,
        primaryPhysician: input.primaryPhysician,
        insuranceProvider: input.insuranceProvider,
        insurancePolicyNumber: input.insurancePolicyNumber,
        allergies: input.allergies,
        currentMedication: input.currentMedication,
        familyMedicalHistory: input.familyMedicalHistory,
        pastMedicalHistory: input.pastMedicalHistory,
        identificationType: input.identificationType,
        identificationNumber: input.identificationNumber,
        identificationDocumentId: input.identificationDocumentId,
        identificationDocumentUrl: input.identificationDocumentUrl,
        privacyConsent: input.privacyConsent,
        treatmentConsent: input.treatmentConsent,
        disclosureConsent: input.disclosureConsent,
      };

      const patient = await this.patientRepository.create(patientData);

      logger.info("Patient registered successfully", { patientId: patient.id });

      return {
        success: true,
        patient,
        errors: [],
      };
    } catch (error) {
      logger.error("Patient registration failed", { error, userId: input.userId });

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
   * Update an existing patient profile
   *
   * @param id - Patient's unique identifier
   * @param input - Fields to update
   * @returns PatientResult with updated patient
   */
  async update(id: string, input: UpdatePatientInput): Promise<PatientResult> {
    logger.info("PatientService.update", { id, fields: Object.keys(input) });

    try {
      // Verify patient exists
      await this.findById(id);

      const updateData: Prisma.PatientUpdateInput = {
        ...(input.birthDate && { birthDate: input.birthDate }),
        ...(input.gender && { gender: input.gender }),
        ...(input.address && { address: input.address }),
        ...(input.occupation && { occupation: input.occupation }),
        ...(input.emergencyContactName && { emergencyContactName: input.emergencyContactName }),
        ...(input.emergencyContactNumber && { emergencyContactNumber: input.emergencyContactNumber }),
        ...(input.primaryPhysician && { primaryPhysician: input.primaryPhysician }),
        ...(input.insuranceProvider && { insuranceProvider: input.insuranceProvider }),
        ...(input.insurancePolicyNumber && { insurancePolicyNumber: input.insurancePolicyNumber }),
        ...(input.allergies !== undefined && { allergies: input.allergies }),
        ...(input.currentMedication !== undefined && { currentMedication: input.currentMedication }),
        ...(input.familyMedicalHistory !== undefined && { familyMedicalHistory: input.familyMedicalHistory }),
        ...(input.pastMedicalHistory !== undefined && { pastMedicalHistory: input.pastMedicalHistory }),
        ...(input.identificationType !== undefined && { identificationType: input.identificationType }),
        ...(input.identificationNumber !== undefined && { identificationNumber: input.identificationNumber }),
        ...(input.identificationDocumentId !== undefined && { identificationDocumentId: input.identificationDocumentId }),
        ...(input.identificationDocumentUrl !== undefined && { identificationDocumentUrl: input.identificationDocumentUrl }),
        ...(input.privacyConsent !== undefined && { privacyConsent: input.privacyConsent }),
        ...(input.treatmentConsent !== undefined && { treatmentConsent: input.treatmentConsent }),
        ...(input.disclosureConsent !== undefined && { disclosureConsent: input.disclosureConsent }),
      };

      const patient = await this.patientRepository.update(id, updateData);

      logger.info("Patient updated successfully", { patientId: id });

      return {
        success: true,
        patient,
        errors: [],
      };
    } catch (error) {
      logger.error("Patient update failed", { error, patientId: id });

      if (error instanceof NotFoundError) {
        return {
          success: false,
          errors: [{ message: error.message }],
        };
      }

      throw error;
    }
  }

  /**
   * Delete a patient profile
   *
   * @param id - Patient's unique identifier
   * @returns Deleted patient
   * @throws NotFoundError if patient doesn't exist
   */
  async delete(id: string): Promise<Patient> {
    logger.info("PatientService.delete", { id });

    // Verify patient exists
    await this.findById(id);

    const patient = await this.patientRepository.delete(id);

    logger.info("Patient deleted successfully", { patientId: id });

    return patient;
  }
}

/**
 * Factory function for creating PatientService
 *
 * @param patientRepository - Patient repository instance
 * @param userRepository - User repository instance
 * @returns PatientService instance
 */
export const createPatientService = (
  patientRepository: IPatientRepository,
  userRepository: IUserRepository
): PatientService => {
  return new PatientService(patientRepository, userRepository);
};

