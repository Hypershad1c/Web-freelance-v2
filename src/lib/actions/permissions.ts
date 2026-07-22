"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Non autorisé — réservé aux administrateurs.");
  }
}

export type SimpleFormState = { message?: string; errors?: Record<string, string[]> };

const PermissionSchema = z.object({
  key: z
    .string()
    .min(3, "Clé requise")
    .regex(/^[a-z0-9]+(\.[a-z0-9]+)*$/, "Format attendu : module.action (ex. properties.publish)"),
  label: z.string().min(3, "Libellé requis"),
});

export async function createPermission(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = PermissionSchema.safeParse({
    key: String(formData.get("key") ?? "").trim().toLowerCase(),
    label: formData.get("label"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.permission.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Une permission avec cette clé existe déjà." };
    }
    throw e;
  }
  revalidatePath("/admin/roles");
  return { message: "Permission ajoutée." };
}

export async function deletePermission(id: string) {
  await requireAdmin();
  await prisma.permission.delete({ where: { id } });
  revalidatePath("/admin/roles");
}
