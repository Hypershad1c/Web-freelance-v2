import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [cities, neighborhoods, propertyTypes, existingSamples] = await Promise.all([
    prisma.city.findMany({ select: { id: true, name: true, slug: true }, orderBy: { order: "asc" } }),
    prisma.neighborhood.findMany({ select: { name: true, slug: true, city: { select: { slug: true } } }, orderBy: { name: "asc" } }),
    prisma.propertyType.findMany({ select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.property.count({ where: { reference: { startsWith: "DEMO-" } } }),
  ]);

  console.log(JSON.stringify({ cities, neighborhoods, propertyTypes, existingSamples }, null, 2));
}

main().finally(() => prisma.$disconnect());
