import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define schema for validation
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("4000")
    .transform((val) => parseInt(val, 10)),
  HOST: z.string().default("localhost"),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default("noreply@carepulse.com"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

// Parse and validate
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

// Type export
export type Env = z.infer<typeof envSchema>;

// Helper functions
export const isDevelopment = () => env.NODE_ENV === "development";
export const isProduction = () => env.NODE_ENV === "production";
export const isTest = () => env.NODE_ENV === "test";
