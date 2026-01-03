import { PrismaClient, Patient, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository";

/**
 * Patient Repository Interface
 *
 * Extends base repository with patient-specific operations.
 */
export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByUserId(userId: string): Promise<Patient | null>;
  findAll(): Promise<Patient[]>;
  create(data: Prisma.PatientCreateInput): Promise<Patient>;
  update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient>;
  delete(id: string): Promise<Patient>;
  existsByUserId(userId: string): Promise<boolean>;
}

/**
 * Patient Repository Implementation
 *
 * Handles all data access operations for the Patient entity.
 * Patients are the complete medical profiles linked to users.
 */
export class PatientRepository
  extends BaseRepository<Patient, Prisma.PatientCreateInput, Prisma.PatientUpdateInput>
  implements IPatientRepository
{
  /**
   * Find patient by unique ID
   *
   * @param id - Patient's unique identifier
   * @returns Patient if found, null otherwise
   */
  async findById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({
      where: { id },
    });
  }

  /**
   * Find patient by user ID
   *
   * Each user can have only one patient profile.
   *
   * @param userId - User's unique identifier
   * @returns Patient if found, null otherwise
   */
  async findByUserId(userId: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({
      where: { userId },
    });
  }

  /**
   * Find patient with user relation
   *
   * @param id - Patient's unique identifier
   * @returns Patient with user data
   */
  async findByIdWithUser(id: string): Promise<Patient & { user: any } | null> {
    return this.prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  /**
   * Find patient by user ID with user relation
   *
   * @param userId - User's unique identifier
   * @returns Patient with user data
   */
  async findByUserIdWithUser(userId: string): Promise<Patient & { user: any } | null> {
    return this.prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  /**
   * Find all patients
   *
   * @returns Array of all patients
   */
  async findAll(): Promise<Patient[]> {
    return this.prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  }

  /**
   * Create a new patient
   *
   * @param data - Patient creation data
   * @returns Created patient
   */
  async create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return this.prisma.patient.create({
      data,
      include: { user: true },
    });
  }

  /**
   * Update an existing patient
   *
   * @param id - Patient's unique identifier
   * @param data - Fields to update
   * @returns Updated patient
   */
  async update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient> {
    return this.prisma.patient.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  /**
   * Delete a patient
   *
   * @param id - Patient's unique identifier
   * @returns Deleted patient
   */
  async delete(id: string): Promise<Patient> {
    return this.prisma.patient.delete({
      where: { id },
    });
  }

  /**
   * Check if user already has a patient profile
   *
   * @param userId - User's unique identifier
   * @returns true if patient exists for user
   */
  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.patient.count({
      where: { userId },
    });
    return count > 0;
  }
}

/**
 * Factory function for creating PatientRepository
 *
 * @param prisma - Prisma client instance
 * @returns PatientRepository instance
 */
export const createPatientRepository = (prisma: PrismaClient): PatientRepository => {
  return new PatientRepository(prisma);
};

