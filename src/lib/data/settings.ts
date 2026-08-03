import { Prisma } from "@prisma/client";
import { prisma, isPrismaReady } from "@/lib/prisma";
import { SETTINGS_FIELDS } from "@/lib/settings-fields";

export async function getSiteSettings() {
  if (!(await isPrismaReady())) {
    return Object.fromEntries(
      SETTINGS_FIELDS.map((field) => [field.key, field.defaultValue])
    ) as Record<(typeof SETTINGS_FIELDS)[number]["key"], string>;
  }

  try {
    const rows = await prisma.siteSetting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));

    return Object.fromEntries(
      SETTINGS_FIELDS.map((field) => [field.key, map.get(field.key) || field.defaultValue])
    ) as Record<(typeof SETTINGS_FIELDS)[number]["key"], string>;
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") {
      return Object.fromEntries(
        SETTINGS_FIELDS.map((field) => [field.key, field.defaultValue])
      ) as Record<(typeof SETTINGS_FIELDS)[number]["key"], string>;
    }
    throw error;
  }
}
