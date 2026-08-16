import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COLUMNS = [
  "reference",
  "title",
  "titleEn",
  "titleAr",
  "slug",
  "description",
  "descriptionEn",
  "descriptionAr",
  "listingType",
  "status",
  "price",
  "surfaceArea",
  "bedrooms",
  "bathrooms",
  "floors",
  "yearBuilt",
  "address",
  "latitude",
  "longitude",
  "featured",
  "city",
  "propertyType",
  "agency",
  "agent",
  "amenities",
  "imageUrls",
  "seoTitle",
  "seoTitleEn",
  "seoTitleAr",
  "seoDescription",
  "seoDescriptionEn",
  "seoDescriptionAr",
] as const;

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const properties = await prisma.property.findMany({
    include: {
      city: { select: { name: true } },
      propertyType: { select: { name: true } },
      agency: { select: { name: true } },
      agent: { select: { name: true } },
      amenities: { select: { name: true } },
      media: { where: { type: "image" }, orderBy: { order: "asc" }, select: { url: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = properties.map((property) => [
    property.reference,
    property.title,
    property.titleEn ?? "",
    property.titleAr ?? "",
    property.slug,
    property.description,
    property.descriptionEn ?? "",
    property.descriptionAr ?? "",
    property.listingType,
    property.status,
    property.price,
    property.surfaceArea,
    property.bedrooms,
    property.bathrooms,
    property.floors ?? "",
    property.yearBuilt ?? "",
    property.address ?? "",
    property.latitude ?? "",
    property.longitude ?? "",
    property.featured ? "true" : "false",
    property.city.name,
    property.propertyType.name,
    property.agency?.name ?? "",
    property.agent?.name ?? "",
    property.amenities.map((amenity) => amenity.name).join("|"),
    property.media.map((media) => media.url).join("|"),
    property.seoTitle ?? "",
    property.seoTitleEn ?? "",
    property.seoTitleAr ?? "",
    property.seoDescription ?? "",
    property.seoDescriptionEn ?? "",
    property.seoDescriptionAr ?? "",
  ]);

  const csv = [COLUMNS, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const filename = `domify-proprietes-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function escapeCsv(value: string | number) {
  const text = String(value).replace(/"/g, '""');
  return /[",\n\r]/.test(text) ? `"${text}"` : text;
}
