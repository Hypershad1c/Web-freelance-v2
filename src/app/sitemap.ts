import type { MetadataRoute } from "next";
import { prisma, isPrismaReady } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL || "https://web-freelance-v2.vercel.app";

const STATIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/proprietes", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/carte", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/villes", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/quartiers", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/agences", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/agents", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" as const },
  { path: "/a-propos", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/estimation", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/vendre-louer", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/tarifs", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/calculateur-credit", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/calculateur-investissement", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/conditions-generales", priority: 0.1, changeFrequency: "yearly" as const },
  { path: "/politique-de-confidentialite", priority: 0.1, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  if (!(await isPrismaReady())) return staticEntries;

  try {
    const [cities, neighborhoods, agencies, agents, properties, posts] = await Promise.all([
      prisma.city.findMany({ select: { slug: true } }),
      prisma.neighborhood.findMany({ select: { slug: true } }),
      prisma.agency.findMany({ select: { slug: true, createdAt: true } }),
      prisma.agent.findMany({ select: { slug: true, createdAt: true } }),
      prisma.property.findMany({ where: { status: "PUBLISHED" }, select: { id: true, updatedAt: true } }),
      prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]);

    return [
      ...staticEntries,
      ...cities.map((city) => ({ url: `${BASE_URL}/villes/${city.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...neighborhoods.map((neighborhood) => ({ url: `${BASE_URL}/quartiers/${neighborhood.slug}`, changeFrequency: "weekly" as const, priority: 0.55 })),
      ...agencies.map((agency) => ({ url: `${BASE_URL}/agences/${agency.slug}`, lastModified: agency.createdAt, changeFrequency: "weekly" as const, priority: 0.5 })),
      ...agents.map((agent) => ({ url: `${BASE_URL}/agents/${agent.slug}`, lastModified: agent.createdAt, changeFrequency: "weekly" as const, priority: 0.5 })),
      ...properties.map((property) => ({ url: `${BASE_URL}/proprietes/${property.id}`, lastModified: property.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...posts.map((post) => ({ url: `${BASE_URL}/blog/${post.slug}`, lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
  } catch {
    return staticEntries;
  }
}
