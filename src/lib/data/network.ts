import { prisma } from "@/lib/prisma";

const propertyCardInclude = {
  city: true,
  neighborhood: true,
  propertyType: true,
  agency: true,
  agent: true,
  amenities: true,
  media: { orderBy: { order: "asc" as const } },
};

export async function getCities() {
  return prisma.city.findMany({
    include: { _count: { select: { properties: { where: { status: "PUBLISHED" } } } } },
    orderBy: { name: "asc" },
  });
}

export async function getCityBySlug(slug: string) {
  return prisma.city.findUnique({ where: { slug } });
}

export async function getAgencies() {
  return prisma.agency.findMany({
    include: { _count: { select: { agents: true, properties: { where: { status: "PUBLISHED" } } } } },
    orderBy: { name: "asc" },
  });
}

export async function getAgencyBySlug(slug: string) {
  return prisma.agency.findUnique({
    where: { slug },
    include: {
      agents: true,
      properties: { where: { status: "PUBLISHED" }, include: propertyCardInclude, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getAgentBySlug(slug: string) {
  return prisma.agent.findUnique({
    where: { slug },
    include: {
      agency: true,
      properties: { where: { status: "PUBLISHED" }, include: propertyCardInclude, orderBy: { createdAt: "desc" } },
    },
  });
}
