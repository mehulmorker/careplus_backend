import { PrismaClient } from "@prisma/client";
import { isDevelopment } from "./environment";

// Singleton pattern for Prisma Client
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: isDevelopment() ? ["query", "error", "warn"] : ["error"],
  });

if (isDevelopment()) {
  global.prisma = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log("📤 Database disconnected");
};

