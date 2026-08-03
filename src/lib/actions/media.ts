"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
    throw new Error("Non autorisé");
  }
}

const RegisterMediaSchema = z.object({
  url: z.string().url("URL invalide"),
  cloudinaryId: z.string().optional(),
  alt: z.string().optional(),
});

// Called client-side right after a direct-to-Cloudinary upload succeeds, to persist
// a Media row for the global library (not attached to any property yet).
export async function registerUploadedMedia(input: { url: string; cloudinaryId?: string; alt?: string }) {
  await requireAdmin();
  const parsed = RegisterMediaSchema.parse(input);
  const media = await prisma.media.create({ data: { ...parsed, type: "image" } });
  revalidatePath("/admin/media");
  return media;
}

export async function deleteMedia(id: string) {
  await requireAdmin();
  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}
