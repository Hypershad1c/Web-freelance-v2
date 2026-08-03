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

export type SimpleFormState = { message?: string; errors?: Record<string, string[]> };

// ---------- Amenities ----------

const AmenitySchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  icon: z.string().optional(),
});

export async function createAmenity(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  const parsed = AmenitySchema.safeParse({
    name,
    slug: slugify(rawSlug || name),
    icon: formData.get("icon") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.amenity.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Un équipement avec ce slug existe déjà." };
    }
    throw e;
  }
  revalidatePath("/admin/amenities");
  revalidatePath("/admin/properties");
  return { message: "Équipement ajouté." };
}

export async function deleteAmenity(id: string) {
  await requireAdmin();
  await prisma.amenity.delete({ where: { id } });
  revalidatePath("/admin/amenities");
  revalidatePath("/admin/properties");
}

// ---------- Property Types ----------

const PropertyTypeSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  icon: z.string().optional(),
});

export async function createPropertyType(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  const parsed = PropertyTypeSchema.safeParse({
    name,
    slug: slugify(rawSlug || name),
    icon: formData.get("icon") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.propertyType.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Un type de bien avec ce slug existe déjà." };
    }
    throw e;
  }
  revalidatePath("/admin/property-types");
  revalidatePath("/admin/properties");
  return { message: "Type de bien ajouté." };
}

export async function deletePropertyType(id: string) {
  await requireAdmin();
  await prisma.propertyType.delete({ where: { id } });
  revalidatePath("/admin/property-types");
  revalidatePath("/admin/properties");
}
