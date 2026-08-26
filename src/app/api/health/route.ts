import { NextResponse } from "next/server";
import { createHealthSnapshot, type HealthSnapshot } from "@/lib/health";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CACHE_WINDOW_MS = 15_000;
let cached: { expiresAt: number; snapshot: HealthSnapshot } | null = null;

async function databaseIsAvailable() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Health check timeout")), 2_000); }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function GET() {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.snapshot, { status: cached.snapshot.status === "healthy" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  }

  const snapshot = createHealthSnapshot(await databaseIsAvailable());
  cached = { snapshot, expiresAt: now + CACHE_WINDOW_MS };
  return NextResponse.json(snapshot, { status: snapshot.status === "healthy" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
