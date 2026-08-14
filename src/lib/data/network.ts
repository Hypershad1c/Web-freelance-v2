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

const publishedPropertyCount = { properties: { where: { status: "PUBLISHED" as const } } };

export async function getCities() {
  return prisma.city.findMany({
    include: { _count: { select: publishedPropertyCount } },
    orderBy: { name: "asc" },
  });
}

export async function getCityBySlug(slug: string) {
  return prisma.city.findUnique({ where: { slug } });
}

export async function getNeighborhoods() {
  return prisma.neighborhood.findMany({
    include: {
      city: true,
      _count: { select: publishedPropertyCount },
    },
    orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
  });
}

export async function getNeighborhoodBySlug(slug: string) {
  return prisma.neighborhood.findUnique({
    where: { slug },
    include: { city: true },
  });
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

export async function getAgents() {
  return prisma.agent.findMany({
    include: {
      agency: true,
      _count: { select: publishedPropertyCount },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAgentBySlug(slug: string) {
  return prisma.agent.findUnique({
    where: { slug },
    include: {
      agency: true,
      availability: { where: { active: true, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 3 },
      properties: { where: { status: "PUBLISHED" }, include: propertyCardInclude, orderBy: { createdAt: "desc" } },
    },
  });
}
