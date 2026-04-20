import { PrismaClient } from "@prisma/client";

// Evita múltiplas instâncias do PrismaClient em desenvolvimento (hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-exportar tipos do Prisma para uso nos outros packages
export type {
  Clinic,
  ClinicSettings,
  Specialty,
  Doctor,
  Availability,
  Appointment,
  Insurance,
  ClinicInsurance,
  ChatSession,
  ChatMessage,
  User,
  Account,
  Session,
  VerificationToken,
} from "@prisma/client";

export {
  Plan,
  AppointmentStatus,
  MessageRole,
  UserRole,
} from "@prisma/client";
