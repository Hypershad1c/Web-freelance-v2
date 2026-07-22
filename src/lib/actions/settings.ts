"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SETTINGS_FIELDS } from "@/lib/settings-fields";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Non autorisé — réservé aux administrateurs.");
  }
}

export type SettingsFormState = { message?: string };

export async function updateSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireAdmin();

  await Promise.all(
    SETTINGS_FIELDS.map((field) => {
      const value = String(formData.get(field.key) ?? "");
      return prisma.siteSetting.upsert({
        where: { key: field.key },
        update: { value },
        create: { key: field.key, value },
      });
    })
  );

  revalidatePath("/admin/settings");
  return { message: "Paramètres enregistrés." };
}
