"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SETTINGS_FIELDS } from "@/lib/settings-fields";
import { isValidContactEmail, normalizeContactPhone, normalizeExternalUrl } from "@/lib/settings-validation";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Non autorisé — réservé aux administrateurs.");
  }
}

export type SettingsFormState = { message?: string; errors?: Record<string, string> };

export async function updateSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  try {
    await requireAdmin();
  } catch {
    return { errors: { form: "Votre session ne permet pas de modifier les paramètres. Rechargez la page et reconnectez-vous si nécessaire." } };
  }

  const values = Object.fromEntries(SETTINGS_FIELDS.map((field) => [field.key, String(formData.get(field.key) ?? "").trim()])) as Record<(typeof SETTINGS_FIELDS)[number]["key"], string>;
  const errors: Record<string, string> = {};

  if (!values.site_name) errors.site_name = "Le nom du site est requis.";
  if (values.site_name.length > 80) errors.site_name = "Le nom du site ne peut pas dépasser 80 caractères.";
  if (values.site_tagline.length > 160) errors.site_tagline = "Le slogan ne peut pas dépasser 160 caractères.";
  if (values.contact_email && !isValidContactEmail(values.contact_email)) errors.contact_email = "Saisissez une adresse email valide, par exemple contact@domify.ma.";

  for (const key of ["social_facebook", "social_instagram", "social_linkedin"] as const) {
    if (values[key] && !normalizeExternalUrl(values[key])) errors[key] = "Saisissez un lien web valide, par exemple https://www.instagram.com/domify.";
  }

  if (Object.keys(errors).length) return { errors };

  values.contact_phone = normalizeContactPhone(values.contact_phone);
  values.whatsapp_number = normalizeContactPhone(values.whatsapp_number);
  values.social_facebook = normalizeExternalUrl(values.social_facebook);
  values.social_instagram = normalizeExternalUrl(values.social_instagram);
  values.social_linkedin = normalizeExternalUrl(values.social_linkedin);

  try {
    await Promise.all(
      SETTINGS_FIELDS.map((field) => {
        const value = values[field.key];
        return prisma.siteSetting.upsert({
          where: { key: field.key },
          update: { value },
          create: { key: field.key, value },
        });
      })
    );
  } catch (error) {
    console.error("[settings] Failed to save settings:", error);
    return { errors: { form: "Les paramètres n’ont pas pu être enregistrés pour le moment. Aucun changement n’a été confirmé ; réessayez dans un instant." } };
  }

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  return { message: "Paramètres enregistrés en toute sécurité. Les liens valides sont désormais utilisés sur le site." };
}
