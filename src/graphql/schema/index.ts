import { gql } from "graphql-tag";

// Base schema with common types
const baseSchema = gql`
  # Custom scalars
  scalar DateTime

  # Common error type
  type FieldError {
    field: String
    message: String!
    code: String
  }

  # Enums
  enum UserRole {
    PATIENT
    ADMIN
  }

  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  enum AppointmentStatus {
    PENDING
    SCHEDULED
    CANCELLED
  }
`;

// User schema
const userSchema = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    phone: String!
    role: UserRole!
    patient: Patient
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateUserInput {
    email: String!
    name: String!
    phone: String!
    password: String!
  }

  input CreateGuestUserInput {
    email: String!
    name: String!
    phone: String!
  }

  type GuestUserPayload {
    success: Boolean!
    user: User
    patient: Patient
    errors: [FieldError!]!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type AuthPayload {
    success: Boolean!
    token: String
    user: User
    errors: [FieldError!]!
  }
`;

// Patient schema
const patientSchema = gql`
  type Patient {
    id: ID!
    userId: ID!
    user: User!
    birthDate: DateTime!
    gender: Gender!
    address: String!
    occupation: String!
    emergencyContactName: String!
    emergencyContactNumber: String!
    primaryPhysician: String!
    insuranceProvider: String!
    insurancePolicyNumber: String!
    allergies: String
    currentMedication: String
    familyMedicalHistory: String
    pastMedicalHistory: String
    identificationType: String
    identificationNumber: String
    identificationDocumentId: String
    identificationDocumentUrl: String
    privacyConsent: Boolean!
    treatmentConsent: Boolean!
    disclosureConsent: Boolean!
    appointments: [Appointment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input RegisterPatientInput {
    userId: ID!
    birthDate: DateTime!
    gender: Gender!
    address: String!
    occupation: String!
    emergencyContactName: String!
    emergencyContactNumber: String!
    primaryPhysician: String!
    insuranceProvider: String!
    insurancePolicyNumber: String!
    allergies: String
    currentMedication: String
    familyMedicalHistory: String
    pastMedicalHistory: String
    identificationType: String
    identificationNumber: String
    identificationDocumentId: String
    identificationDocumentUrl: String
    privacyConsent: Boolean!
    treatmentConsent: Boolean!
    disclosureConsent: Boolean!
  }

  input UpdatePatientInput {
    birthDate: DateTime
    gender: Gender
    address: String
    occupation: String
    emergencyContactName: String
    emergencyContactNumber: String
    primaryPhysician: String
    insuranceProvider: String
    insurancePolicyNumber: String
    allergies: String
    currentMedication: String
    familyMedicalHistory: String
    pastMedicalHistory: String
    identificationType: String
    identificationNumber: String
    identificationDocumentId: String
    identificationDocumentUrl: String
  }

  type PatientPayload {
    success: Boolean!
    patient: Patient
    errors: [FieldError!]!
  }
`;

// Appointment schema
const appointmentSchema = gql`
  type Appointment {
    id: ID!
    patient: Patient!
    primaryPhysician: String!
    schedule: DateTime!
    status: AppointmentStatus!
    reason: String!
    note: String
    cancellationReason: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AppointmentCounts {
    total: Int!
    scheduled: Int!
    pending: Int!
    cancelled: Int!
  }

  input CreateAppointmentInput {
    patientId: ID!
    primaryPhysician: String!
    schedule: DateTime!
    reason: String!
    note: String
  }

  input UpdateAppointmentInput {
    primaryPhysician: String
    schedule: DateTime
    reason: String
    note: String
    status: AppointmentStatus
    cancellationReason: String
  }

  type AppointmentPayload {
    success: Boolean!
    appointment: Appointment
    errors: [FieldError!]!
  }

  type AppointmentsPayload {
    success: Boolean!
    appointments: [Appointment!]!
    counts: AppointmentCounts!
    errors: [FieldError!]!
  }
`;

// Doctor schema
const doctorSchema = gql`
  type Doctor {
    id: ID!
    name: String!
    image: String!
    specialty: String
  }
`;

// Cloudinary/File Upload schema
const fileUploadSchema = gql`
  scalar Upload

  input UploadImageInput {
    file: String! # Base64 encoded file
    folder: String
    publicId: String
    transformation: ImageTransformationInput
  }

  input ImageTransformationInput {
    width: Int
    height: Int
    crop: String
    quality: String
    format: String
  }

  type ImageUploadResult {
    publicId: String!
    url: String!
    secureUrl: String!
    width: Int
    height: Int
    format: String
    bytes: Int
  }

  type ImageUploadPayload {
    success: Boolean!
    image: ImageUploadResult
    errors: [FieldError!]!
  }
`;

// Query and Mutation types
const rootSchema = gql`
  type Query {
    # Auth
    me: User

    # Users
    user(id: ID!): User

    # Patients
    patient(id: ID!): Patient
    patientByUserId(userId: ID!): Patient

    # Appointments
    appointment(id: ID!): Appointment
    appointments(status: AppointmentStatus): AppointmentsPayload!
    patientAppointments(patientId: ID!): [Appointment!]!

    # Admin
    getAppointmentStats: AppointmentCounts!

    # Doctors
    doctors: [Doctor!]!
  }

  type Mutation {
    # Auth
    register(input: CreateUserInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!

    # Guest User (no password required)
    createGuestUser(input: CreateGuestUserInput!): GuestUserPayload!

    # Patient
    registerPatient(input: RegisterPatientInput!): PatientPayload!
    updatePatient(id: ID!, input: UpdatePatientInput!): PatientPayload!

    # Appointments
    createAppointment(input: CreateAppointmentInput!): AppointmentPayload!
    updateAppointment(
      id: ID!
      input: UpdateAppointmentInput!
    ): AppointmentPayload!
    cancelAppointment(id: ID!, reason: String!): AppointmentPayload!
    scheduleAppointment(id: ID!, schedule: DateTime!): AppointmentPayload!

    # File Upload
    uploadImage(input: UploadImageInput!): ImageUploadPayload!
    deleteImage(publicId: String!): Boolean!
  }
`;

export const typeDefs = [
  baseSchema,
  userSchema,
  patientSchema,
  appointmentSchema,
  doctorSchema,
  fileUploadSchema,
  rootSchema,
];
