import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaReady: boolean | null;
  prismaReadyCheck: Promise<boolean> | undefined;
};

// Vercel can run several route handlers concurrently. The default `pg` pool size
// is too high for the production database when every serverless instance creates
// its own pool, which can cause otherwise read-only endpoints to fail under a
// short burst. Keep one reusable connection per warm instance instead.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;

export async function isPrismaReady() {
  if (globalForPrisma.prismaReady === true) return true;
  if (globalForPrisma.prismaReadyCheck) return globalForPrisma.prismaReadyCheck;

  const check = (async () => {
    try {
      const result = await prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = current_schema() AND table_name = 'SiteSetting'
        ) as exists
      `;
      const ready = Array.isArray(result) && result[0]?.exists === true;
      if (ready) globalForPrisma.prismaReady = true;
      return ready;
    } catch {
      // A saturated connection pool can recover shortly after the request. Do not cache a false value.
      return false;
    } finally {
      globalForPrisma.prismaReadyCheck = undefined;
    }
  })();

  globalForPrisma.prismaReadyCheck = check;
  return check;
}
