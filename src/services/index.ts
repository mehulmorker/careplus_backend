/**
 * Service Layer Exports
 *
 * Centralizes all service exports for clean imports.
 */

// User Service
export {
  UserService,
  IUserService,
  CreateUserInput,
  UpdateUserInput,
  createUserService,
} from "./user.service";

// Auth Service
export {
  AuthService,
  IAuthService,
  RegisterInput,
  LoginInput,
  AuthResult,
  FieldError,
  TokenPayload,
  createAuthService,
} from "./auth.service";

// Patient Service
export {
  PatientService,
  IPatientService,
  RegisterPatientInput,
  UpdatePatientInput,
  PatientResult,
  createPatientService,
} from "./patient.service";

// Appointment Service
export {
  AppointmentService,
  IAppointmentService,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentFilters,
  AppointmentResult,
  AppointmentStatistics,
  createAppointmentService,
} from "./appointment.service";

// Admin Service
export {
  AdminService,
  IAdminService,
  createAdminService,
} from "./admin.service";

// Email Service
export {
  EmailService,
  IEmailService,
  createEmailService,
} from "./email.service";

// Guest Service
export {
  GuestService,
  CreateGuestUserInput,
  GuestUserResult,
  createGuestService,
} from "./guest.service";

// Cloudinary Service
export {
  CloudinaryService,
  CloudinaryUploadOptions,
  CloudinaryUploadResult,
  createCloudinaryService,
} from "./cloudinary.service";

// Token Blacklist Service
export {
  TokenBlacklistService,
  createTokenBlacklistService,
} from "./token-blacklist.service";
