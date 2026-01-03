/**
 * Repository Layer Exports
 *
 * Centralizes all repository exports for clean imports.
 * Following the Facade Pattern for simplified access.
 */

// Base Repository
export { BaseRepository, IBaseRepository, RepositoryFactory } from "./base.repository";

// User Repository
export {
  UserRepository,
  IUserRepository,
  createUserRepository,
} from "./user.repository";

// Patient Repository
export {
  PatientRepository,
  IPatientRepository,
  createPatientRepository,
} from "./patient.repository";

// Appointment Repository
export {
  AppointmentRepository,
  IAppointmentRepository,
  AppointmentFilters,
  createAppointmentRepository,
} from "./appointment.repository";

