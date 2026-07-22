"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const PropertySchema = z.object({
  reference: z.string().min(2, "Référence requise"),
  title: z.string().min(3, "Titre requis"),
  slug: z.string().min(3, "Slug requis"),
  description: z.string().min(10, "Description requise"),
  listingType: z.enum(["VENTE", "LOCATION"]),
  status: z.enum(["DRAFT", "PUBLISHED", "UNDER_OFFER", "SOLD", "ARCHIVED"]),
  price: z.coerce.number().int().positive("Le prix doit être positif"),
  surfaceArea: z.coerce.number().positive("La surface doit être positive"),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  floors: z.coerce.number().int().optional().nullable(),
  yearBuilt: z.coerce.number().int().optional().nullable(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  featured: z.coerce.boolean().default(false),
  cityId: z.string().min(1, "Ville requise"),
  neighborhoodId: z.string().optional(),
  propertyTypeId: z.string().min(1, "Type de bien requis"),
  agencyId: z.string().optional(),
  agentId: z.string().optional(),
  amenityIds: z.array(z.string()).default([]),
  imageUrls: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type PropertyFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
    throw new Error("Non autorisé");
  }
}

function parseFormData(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  return {
    reference: formData.get("reference"),
    title,
    slug: slugify(rawSlug || title),
    description: formData.get("description"),
    listingType: formData.get("listingType"),
    status: formData.get("status"),
    price: formData.get("price"),
    surfaceArea: formData.get("surfaceArea"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    floors: formData.get("floors") || undefined,
    yearBuilt: formData.get("yearBuilt") || undefined,
    address: formData.get("address") || undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    featured: formData.get("featured") === "on",
    cityId: formData.get("cityId"),
    neighborhoodId: formData.get("neighborhoodId") || undefined,
    propertyTypeId: formData.get("propertyTypeId"),
    agencyId: formData.get("agencyId") || undefined,
    agentId: formData.get("agentId") || undefined,
    amenityIds: formData.getAll("amenityIds") as string[],
    imageUrls: formData.get("imageUrls") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  };
}

function parseImageUrls(raw?: string) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function createProperty(_prev: PropertyFormState, formData: FormData): Promise<PropertyFormState> {
  await requireAdmin();

  const parsed = PropertySchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Merci de corriger les erreurs ci-dessous." };
  }

  const { amenityIds, imageUrls, ...data } = parsed.data;
  const urls = parseImageUrls(imageUrls);

  let property;
  try {
    property = await prisma.property.create({
      data: {
        ...data,
        neighborhoodId: data.neighborhoodId || null,
        agencyId: data.agencyId || null,
        agentId: data.agentId || null,
        amenities: { connect: amenityIds.map((id) => ({ id })) },
        media: {
          create: urls.map((url, order) => ({ url, order, type: "image" })),
        },
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Cette référence ou ce slug existe déjà." };
    }
    throw e;
  }

  revalidatePath("/admin/properties");
  revalidatePath("/proprietes");
  revalidatePath("/");
  redirect(`/admin/properties/${property.id}`);
}

export async function updateProperty(
  id: string,
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireAdmin();

  const parsed = PropertySchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "Merci de corriger les erreurs ci-dessous." };
  }

  const { amenityIds, imageUrls, ...data } = parsed.data;
  const urls = parseImageUrls(imageUrls);

  await prisma.property.update({
    where: { id },
    data: {
      ...data,
      neighborhoodId: data.neighborhoodId || null,
      agencyId: data.agencyId || null,
      agentId: data.agentId || null,
      amenities: { set: amenityIds.map((amenityId) => ({ id: amenityId })) },
    },
  });

  // Replace this property's image media with the submitted URL list, in order.
  await prisma.media.deleteMany({ where: { propertyId: id, type: "image" } });
  if (urls.length > 0) {
    await prisma.media.createMany({
      data: urls.map((url, order) => ({ url, order, type: "image", propertyId: id })),
    });
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${id}`);
  revalidatePath("/proprietes");
  revalidatePath(`/proprietes/${id}`);
  revalidatePath("/");
  return { message: "Bien mis à jour avec succès." };
}

export async function deleteProperty(id: string) {
  await requireAdmin();
  await prisma.property.delete({ where: { id } });
  revalidatePath("/admin/properties");
}
