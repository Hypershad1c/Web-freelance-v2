import { prisma } from "@/lib/prisma";

export async function getSeoOverride(path: string) {
  return prisma.seoEntry.findUnique({ where: { path } });
}
