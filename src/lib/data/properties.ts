import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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
  return prisma.property.findMany({
    where: { status: "PUBLISHED", featured: true },
    include: publishedInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
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

// Separate from getPropertyById on purpose: this write is only ever meant to
// fire once per real page render (see the detail page component), never from
// generateMetadata or admin queries — otherwise crawlers/social previews and
// admin list views would silently inflate the count.
export async function incrementPropertyViews(id: string) {
  await prisma.property.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
  });
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
