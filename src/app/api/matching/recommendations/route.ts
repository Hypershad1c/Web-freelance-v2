import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const savedSearches = await prisma.crmSavedSearch.findMany({
    where: { userId: session.user.id, active: true },
    select: { id: true, name: true, listingType: true, minPrice: true, maxPrice: true, bedrooms: true, cityId: true, propertyTypeId: true },
  });
  if (savedSearches.length === 0) return NextResponse.json({ recommendations: [], matchedSearchCount: 0 });

  const candidates = await prisma.property.findMany({
    where: { status: "PUBLISHED", approvalStatus: "APPROVED" },
    include: {
      city: { select: { name: true, slug: true } },
      propertyType: { select: { name: true, slug: true } },
      media: { where: { type: "image", workflowStatus: "APPROVED" }, orderBy: { order: "asc" }, take: 1, select: { url: true, alt: true } },
    },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 80,
  });

  const recommendations = candidates.map((property) => {
    const matches = savedSearches.map((search) => {
      const checks = [
        !search.listingType || property.listingType === search.listingType,
        !search.minPrice || property.price >= search.minPrice,
        !search.maxPrice || property.price <= search.maxPrice,
        !search.bedrooms || property.bedrooms >= search.bedrooms,
        !search.cityId || property.cityId === search.cityId,
        !search.propertyTypeId || property.propertyTypeId === search.propertyTypeId,
      ];
      const matched = checks.filter(Boolean).length;
      return { search, matched, total: checks.length };
    }).filter((match) => match.matched >= Math.max(3, match.total - 1)).sort((a, b) => b.matched - a.matched);
    if (matches.length === 0) return null;
    const best = matches[0];
    return {
      property: {
        id: property.id,
        title: property.title,
        reference: property.reference,
        price: property.price,
        surfaceArea: property.surfaceArea,
        bedrooms: property.bedrooms,
        listingType: property.listingType,
        city: property.city,
        propertyType: property.propertyType,
        media: property.media,
      },
      score: Math.round((best.matched / best.total) * 100),
      matchedSearch: best.search.name,
      matchedSearchId: best.search.id,
    };
  }).filter((recommendation): recommendation is NonNullable<typeof recommendation> => Boolean(recommendation)).sort((a, b) => b.score - a.score).slice(0, 12);

  return NextResponse.json({ recommendations, matchedSearchCount: savedSearches.length });
}
