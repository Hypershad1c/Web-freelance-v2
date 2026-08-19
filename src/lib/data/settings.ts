import { Prisma } from "@prisma/client";
import { prisma, isPrismaReady } from "@/lib/prisma";
import { SETTINGS_FIELDS } from "@/lib/settings-fields";
import { isValidContactEmail, normalizeContactPhone, normalizeExternalUrl } from "@/lib/settings-validation";

function defaultSettings() {
  return Object.fromEntries(SETTINGS_FIELDS.map((field) => [field.key, field.defaultValue])) as Record<(typeof SETTINGS_FIELDS)[number]["key"], string>;
}

function sanitizeSettings(values: Record<(typeof SETTINGS_FIELDS)[number]["key"], string>) {
  return {
    ...values,
    contact_phone: normalizeContactPhone(values.contact_phone),
    whatsapp_number: normalizeContactPhone(values.whatsapp_number),
    contact_email: isValidContactEmail(values.contact_email) ? values.contact_email.trim() : "",
    social_facebook: normalizeExternalUrl(values.social_facebook),
    social_instagram: normalizeExternalUrl(values.social_instagram),
    social_linkedin: normalizeExternalUrl(values.social_linkedin),
  };
}

export async function getSiteSettings() {
  if (!(await isPrismaReady())) {
    return defaultSettings();
  }

  try {
    const rows = await prisma.siteSetting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));

    return sanitizeSettings(Object.fromEntries(
      SETTINGS_FIELDS.map((field) => [field.key, map.get(field.key) || field.defaultValue])
    ) as Record<(typeof SETTINGS_FIELDS)[number]["key"], string>);
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") {
      return defaultSettings();
    }
    console.error("[settings] Failed to read site settings; using safe defaults:", error);
    return defaultSettings();
  }
}
