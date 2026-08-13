import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined; prismaReady: boolean | null };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function isPrismaReady() {
  if (globalForPrisma.prismaReady !== undefined && globalForPrisma.prismaReady !== null) {
    return globalForPrisma.prismaReady;
  }

  try {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'SiteSetting'
      ) as exists
    `;
    const ready = Array.isArray(result) && result[0]?.exists === true;
    globalForPrisma.prismaReady = Boolean(ready);
    return globalForPrisma.prismaReady;
  } catch {
    globalForPrisma.prismaReady = false;
    return false;
  }
}
