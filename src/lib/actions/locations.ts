"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
    throw new Error("Non autorisé");
  }
}

const CitySchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  description: z.string().optional(),
  image: z.string().optional(),
});

export type SimpleFormState = { message?: string; errors?: Record<string, string[]> };

export async function createCity(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const rawName = String(formData.get("name") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");

  const parsed = CitySchema.safeParse({
    name: rawName,
    slug: slugify(rawSlug || rawName),
    description: formData.get("description") || undefined,
    image: formData.get("image") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.city.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Une ville avec ce slug existe déjà." };
    }
    throw e;
  }
  revalidatePath("/admin/cities");
  revalidatePath("/villes");
  return { message: "Ville ajoutée." };
}

export async function deleteCity(id: string) {
  await requireAdmin();
  await prisma.city.delete({ where: { id } });
  revalidatePath("/admin/cities");
  revalidatePath("/villes");
}

const NeighborhoodSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  cityId: z.string().min(1, "Ville requise — sélectionnez une ville dans la liste"),
  description: z.string().optional(),
});

export async function createNeighborhood(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const rawName = String(formData.get("name") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");

  const parsed = NeighborhoodSchema.safeParse({
    name: rawName,
    slug: slugify(rawSlug || rawName),
    cityId: formData.get("cityId"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.neighborhood.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Un quartier avec ce slug existe déjà." };
    }
    throw e;
  }
  revalidatePath("/admin/neighborhoods");
  return { message: "Quartier ajouté." };
}

export async function deleteNeighborhood(id: string) {
  await requireAdmin();
  await prisma.neighborhood.delete({ where: { id } });
  revalidatePath("/admin/neighborhoods");
}
