"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// ---------- Categories ----------

const CategorySchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
});

export async function createBlogCategory(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  const parsed = CategorySchema.safeParse({ name, slug: slugify(rawSlug || name) });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.blogCategory.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Une catégorie avec ce slug existe déjà." };
    }
    throw e;
  }
  revalidatePath("/admin/blog");
  return { message: "Catégorie ajoutée." };
}

export async function deleteBlogCategory(id: string) {
  await requireAdmin();
  await prisma.blogCategory.delete({ where: { id } });
  revalidatePath("/admin/blog");
}

// ---------- Posts ----------

const PostSchema = z.object({
  title: z.string().min(3, "Titre requis"),
  slug: z.string().min(3, "Slug requis"),
  excerpt: z.string().optional(),
  content: z.string().min(20, "Le contenu doit contenir au moins 20 caractères"),
  coverImage: z.string().optional(),
  published: z.coerce.boolean().default(false),
  categoryId: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

function parsePostForm(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  return {
    title,
    slug: slugify(rawSlug || title),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    coverImage: formData.get("coverImage") || undefined,
    published: formData.get("published") === "on",
    categoryId: formData.get("categoryId") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  };
}

export async function createPost(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = PostSchema.safeParse(parsePostForm(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  let post;
  try {
    post = await prisma.blogPost.create({
      data: { ...parsed.data, categoryId: parsed.data.categoryId || null },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Un article avec ce slug existe déjà." };
    }
    throw e;
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect(`/admin/blog/${post.id}`);
}

export async function updatePost(id: string, _prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = PostSchema.safeParse(parsePostForm(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await prisma.blogPost.update({
    where: { id },
    data: { ...parsed.data, categoryId: parsed.data.categoryId || null },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${parsed.data.slug}`);
  return { message: "Article mis à jour." };
}

export async function deletePost(id: string) {
  await requireAdmin();
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
