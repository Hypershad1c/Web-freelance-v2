import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  if (ids.length === 0) return NextResponse.json([]);

  const properties = await prisma.property.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    include: {
      city: true,
      neighborhood: true,
      propertyType: true,
      agency: true,
      agent: true,
      amenities: true,
      media: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(properties);
}
