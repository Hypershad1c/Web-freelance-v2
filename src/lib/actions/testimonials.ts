"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
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

const TestimonialSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  city: z.string().optional(),
  quote: z.string().min(10, "Le témoignage doit contenir au moins 10 caractères"),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  photo: z.string().optional(),
  published: z.coerce.boolean().default(true),
});

export async function createTestimonial(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdminOrEditor();
  const parsed = TestimonialSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city") || undefined,
    quote: formData.get("quote"),
    rating: formData.get("rating"),
    photo: formData.get("photo") || undefined,
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await prisma.testimonial.create({ data: parsed.data });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { message: "Témoignage ajouté." };
}

export async function toggleTestimonialPublished(id: string, published: boolean) {
  await requireAdminOrEditor();
  await prisma.testimonial.update({ where: { id }, data: { published } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function deleteTestimonial(id: string) {
  await requireAdminOrEditor();
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}
