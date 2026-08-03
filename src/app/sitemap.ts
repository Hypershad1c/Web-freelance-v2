import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://domify.ma";

const STATIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/proprietes", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/carte", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/villes", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/agences", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" as const },
  { path: "/a-propos", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/estimation", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/vendre-louer", priority: 0.6, changeFrequency: "monthly" as const },
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

  return staticEntries;
}
