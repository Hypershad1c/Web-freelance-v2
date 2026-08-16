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

export async function getFeaturedProperties() {
  if (!(await isPrismaReady())) {
    return [];
  }

  try {
    return await prisma.property.findMany({
      where: { status: "PUBLISHED", featured: true },
      include: publishedInclude,
      // Every published listing marked as featured must appear on the homepage.
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") {
      return [];
    }
    throw error;
  }
}

// The homepage is editorially led: every published listing selected in the admin
// appears in the homepage collection. Unmarked inventory is intentionally excluded
// so the admin `featured` checkbox is the single source of truth for this section.
export async function getHomepageProperties() {
  return getFeaturedProperties();
}

export type PropertyFilters = {
  city?: string; // city slug
  neighborhood?: string; // neighborhood slug
  listingType?: "VENTE" | "LOCATION";
  propertyType?: string; // property type slug
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  surfaceMin?: number;
  amenity?: string;
  reference?: string;
  sort?: "recent" | "price-asc" | "price-desc";
};

export async function getProperties(filters: PropertyFilters = {}) {
  const where: Prisma.PropertyWhereInput = {
    status: "PUBLISHED",
    ...(filters.city ? { city: { slug: filters.city } } : {}),
    ...(filters.neighborhood ? { neighborhood: { slug: filters.neighborhood } } : {}),
    ...(filters.listingType ? { listingType: filters.listingType } : {}),
    ...(filters.propertyType ? { propertyType: { slug: filters.propertyType } } : {}),
    ...(typeof filters.priceMin === "number" && filters.priceMin > 0 ? { price: { gte: filters.priceMin } } : {}),
    ...(typeof filters.priceMax === "number" && filters.priceMax > 0 ? { price: { lte: filters.priceMax } } : {}),
    ...(typeof filters.bedrooms === "number" && filters.bedrooms > 0 ? { bedrooms: { gte: filters.bedrooms } } : {}),
    ...(typeof filters.surfaceMin === "number" && filters.surfaceMin > 0 ? { surfaceArea: { gte: filters.surfaceMin } } : {}),
    ...(filters.amenity ? { amenities: { some: { slug: filters.amenity } } } : {}),
    ...(filters.reference ? { reference: { contains: filters.reference, mode: "insensitive" } } : {}),
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
  if (!(await isPrismaReady())) return [];

  try {
    return await prisma.city.findMany({
      include: { _count: { select: { properties: { where: { status: "PUBLISHED" } } } } },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") return [];
    throw error;
  }
}

export async function getPropertyTypes() {
  if (!(await isPrismaReady())) return [];

  try {
    return await prisma.propertyType.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") return [];
    throw error;
  }
}

export async function getNeighborhoods() {
  if (!(await isPrismaReady())) return [];

  try {
    return await prisma.neighborhood.findMany({
      select: { slug: true, name: true, city: { select: { name: true } } },
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
    });
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") return [];
    throw error;
  }
}

export async function getAmenities() {
  if (!(await isPrismaReady())) return [];

  try {
    return await prisma.amenity.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } });
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2021") return [];
    throw error;
  }
}
