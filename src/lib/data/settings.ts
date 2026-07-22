import { prisma } from "@/lib/prisma";
import { SETTINGS_FIELDS } from "@/lib/settings-fields";

export async function getSiteSettings() {
  const rows = await prisma.siteSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return Object.fromEntries(
    SETTINGS_FIELDS.map((field) => [field.key, map.get(field.key) || field.defaultValue])
  ) as Record<(typeof SETTINGS_FIELDS)[number]["key"], string>;
}
