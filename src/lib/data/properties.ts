import { Prisma } from "@prisma/client";
import { prisma, isPrismaReady } from "@/lib/prisma";

// Every public-facing query is scoped to PUBLISHED properties only — drafts and
// archived listings never leak onto the public site, regardless of filters.
const publishedInclude = {
  city: true,
  neighborhood: true,
  propertyType: true,
  agency: true,
  agent: true,
  amenities: true,
  media: { orderBy: { order: "asc" as const } },
};

export type PropertyWithRelations = Prisma.PropertyGetPayload<{ include: typeof publishedInclude }>;

export async function getFeaturedProperties(take = 4) {
  if (!(await isPrismaReady())) {
    return [];
  }

  try {
    return await prisma.property.findMany({
      where: { status: "PUBLISHED", featured: true },
      include: publishedInclude,
      orderBy: { createdAt: "desc" },
      take,
    });
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") {
      return [];
    }
    throw error;
  }
}

export type PropertyFilters = {
  city?: string; // city slug
  listingType?: "VENTE" | "LOCATION";
  propertyType?: string; // property type slug
  priceMax?: number;
  sort?: "recent" | "price-asc" | "price-desc";
};

export async function getProperties(filters: PropertyFilters = {}) {
  const where: Prisma.PropertyWhereInput = {
    status: "PUBLISHED",
    ...(filters.city ? { city: { slug: filters.city } } : {}),
    ...(filters.listingType ? { listingType: filters.listingType } : {}),
    ...(filters.propertyType ? { propertyType: { slug: filters.propertyType } } : {}),
    ...(filters.priceMax ? { price: { lte: filters.priceMax } } : {}),
  };

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    filters.sort === "price-asc"
      ? { price: "asc" }
      : filters.sort === "price-desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  return prisma.property.findMany({ where, include: publishedInclude, orderBy });
}

export async function getPropertyById(id: string) {
  return prisma.property.findFirst({
    where: { id, status: "PUBLISHED" },
    include: publishedInclude,
  });
}

// Fire-and-forget from the detail page — deliberately not awaited there so a slow
// write never delays rendering. Kept as its own function (rather than bundled into
// getPropertyById) so admin/API reads of a property never inflate the count.
export async function incrementPropertyViews(id: string) {
  try {
    await prisma.property.update({ where: { id }, data: { viewsCount: { increment: 1 } } });
  } catch {
    // Non-critical — a missed view count is not worth surfacing an error for.
  }
}

export async function getSimilarProperties(property: PropertyWithRelations, take = 3) {
  return prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: property.id },
      cityId: property.cityId,
    },
    include: publishedInclude,
    take,
  });
}

export async function getCitiesWithCounts() {
  return prisma.city.findMany({
    include: { _count: { select: { properties: { where: { status: "PUBLISHED" } } } } },
    orderBy: { name: "asc" },
  });
}

export async function getPropertyTypes() {
  return prisma.propertyType.findMany({ orderBy: { name: "asc" } });
}
