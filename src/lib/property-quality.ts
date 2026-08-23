export type ListingQualityInput = {
  title: string;
  description: string;
  titleEn?: string | null;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: number;
  surfaceArea: number;
  bedrooms: number;
  bathrooms: number;
  address?: string | null;
  cityName?: string | null;
  neighborhoodName?: string | null;
  mediaCount: number;
  amenityCount: number;
};

export type ListingQuality = {
  score: number;
  level: "ready" | "improve" | "incomplete";
  missing: string[];
};

export function assessListingQuality(property: ListingQualityInput): ListingQuality {
  let score = 0;
  const missing: string[] = [];
  const hasText = (value?: string | null, minimum = 1) => Boolean(value && value.trim().length >= minimum);

  if (hasText(property.title, 8)) score += 8; else missing.push("titre précis");
  if (hasText(property.description, 120)) score += 16; else missing.push("description détaillée");
  if (property.price > 0) score += 14; else missing.push("prix");
  if (property.surfaceArea > 0) score += 10; else missing.push("surface");
  if (property.bedrooms > 0 || property.bathrooms > 0) score += 6; else missing.push("configuration des pièces");
  if (hasText(property.address) && (hasText(property.cityName) || hasText(property.neighborhoodName))) score += 10; else missing.push("adresse et localisation");

  if (property.mediaCount >= 5) score += 16;
  else if (property.mediaCount >= 3) score += 11;
  else if (property.mediaCount >= 1) { score += 5; missing.push("galerie plus complète"); }
  else missing.push("photos");

  if (property.amenityCount >= 4) score += 10;
  else if (property.amenityCount >= 2) score += 6;
  else missing.push("équipements");

  const hasEnglish = hasText(property.titleEn, 8) && hasText(property.descriptionEn, 60);
  const hasArabic = hasText(property.titleAr, 4) && hasText(property.descriptionAr, 40);
  if (hasEnglish && hasArabic) score += 10;
  else if (hasEnglish || hasArabic) { score += 5; missing.push(hasEnglish ? "traduction arabe" : "traduction anglaise"); }
  else missing.push("traductions anglaise et arabe");

  const level = score >= 80 ? "ready" : score >= 55 ? "improve" : "incomplete";
  return { score, level, missing };
}
