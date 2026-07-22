"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdminOrEditor() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
    throw new Error("Non autorisé");
  }
}

export type SimpleFormState = { message?: string; errors?: Record<string, string[]> };

const SeoEntrySchema = z.object({
  path: z
    .string()
    .min(1, "Chemin requis")
    .regex(/^\//, "Le chemin doit commencer par /")
    .transform((s) => s.replace(/\/+$/, "") || "/"),
  title: z.string().min(3, "Titre requis"),
  description: z.string().min(10, "Description requise (10 caractères min.)"),
  ogImage: z.string().optional(),
});

export async function createSeoEntry(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdminOrEditor();
  const parsed = SeoEntrySchema.safeParse({
    path: formData.get("path"),
    title: formData.get("title"),
    description: formData.get("description"),
    ogImage: formData.get("ogImage") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  let entry;
  try {
    entry = await prisma.seoEntry.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Une entrée SEO existe déjà pour ce chemin." };
    }
    throw e;
  }
  revalidatePath("/admin/seo");
  revalidatePath(parsed.data.path);
  redirect(`/admin/seo/${entry.id}`);
}

export async function updateSeoEntry(id: string, _prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdminOrEditor();
  const parsed = SeoEntrySchema.safeParse({
    path: formData.get("path"),
    title: formData.get("title"),
    description: formData.get("description"),
    ogImage: formData.get("ogImage") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await prisma.seoEntry.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/seo");
  revalidatePath(parsed.data.path);
  return { message: "Entrée SEO mise à jour." };
}

export async function deleteSeoEntry(id: string) {
  await requireAdminOrEditor();
  const entry = await prisma.seoEntry.delete({ where: { id } });
  revalidatePath("/admin/seo");
  revalidatePath(entry.path);
}
