import { Prisma } from "@prisma/client";
import { prisma, isPrismaReady } from "@/lib/prisma";

export async function getSeoOverride(path: string) {
  if (!(await isPrismaReady())) {
    return null;
  }

  try {
    return await prisma.seoEntry.findUnique({ where: { path } });
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") {
      return null;
    }
    throw error;
  }
}
