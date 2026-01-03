import { GraphQLScalarType, Kind } from "graphql";
import { Context } from "../context";
import { authResolvers } from "./auth.resolver";
import { userResolvers } from "./user.resolver";
import { doctorResolvers } from "./doctor.resolver";
import { patientResolvers } from "./patient.resolver";
import { appointmentResolvers } from "./appointment.resolver";
import { adminResolvers } from "./admin.resolver";
import { guestResolvers } from "./guest.resolver";
import { cloudinaryResolvers } from "./cloudinary.resolver";

/**
 * DateTime Scalar Type
 *
 * Custom GraphQL scalar for handling DateTime values.
 * Serializes to/from ISO 8601 strings.
 */
const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "DateTime custom scalar type",
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error("DateTime must be a Date object");
  },
  parseValue(value: unknown): Date {
    if (typeof value === "string" || typeof value === "number") {
      return new Date(value);
    }
    throw new Error("DateTime must be a string or number");
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(
        ast.kind === Kind.STRING ? ast.value : parseInt(ast.value, 10)
      );
    }
    throw new Error("DateTime must be a string or integer");
  },
});

/**
 * Combined Resolvers
 *
 * Merges all resolver modules into a single resolver map.
 * Order matters for field resolver precedence.
 */
export const resolvers = {
  // Scalar types
  DateTime: DateTimeScalar,

  // Queries
  Query: {
    // Auth queries (me)
    ...authResolvers.Query,

    // User queries
    ...userResolvers.Query,

    // Doctor queries
    ...doctorResolvers.Query,

    // Patient queries
    ...patientResolvers.Query,

    // Appointment queries
    ...appointmentResolvers.Query,

    // Admin queries
    ...adminResolvers.Query,
  },

  // Mutations
  Mutation: {
    // Auth mutations (register, login, logout)
    ...authResolvers.Mutation,

    // Guest user mutations (createGuestUser)
    ...guestResolvers.Mutation,

    // Patient mutations
    ...patientResolvers.Mutation,

    // Appointment mutations
    ...appointmentResolvers.Mutation,

    // Cloudinary mutations
    ...cloudinaryResolvers.Mutation,
  },

  // Field resolvers
  User: authResolvers.User,

  Patient: patientResolvers.Patient,

  Appointment: appointmentResolvers.Appointment,
};
