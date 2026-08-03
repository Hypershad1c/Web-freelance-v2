import { prisma } from "@/lib/prisma";

export async function getPublishedPosts(categorySlug?: string) {
  return prisma.blogPost.findMany({
    where: {
      published: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, published: true },
    include: { category: true },
  });
}

export async function getRecentPosts(take = 3, excludeId?: string) {
  return prisma.blogPost.findMany({
    where: { published: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getBlogCategories() {
  return prisma.blogCategory.findMany({
    include: { _count: { select: { posts: { where: { published: true } } } } },
    orderBy: { name: "asc" },
  });
}
