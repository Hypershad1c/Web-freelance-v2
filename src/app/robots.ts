import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://domify.ma";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/compte",
        "/favoris",
        "/comparer",
        "/connexion",
        "/inscription",
        "/mot-de-passe-oublie",
        "/reinitialiser-mot-de-passe",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
