import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { sampleListings } from "./sample-catalogue-data";

const amenityNameById: Record<string, string> = {
  cmscgde0m000aucvibq7a7f9i: "Climatisation",
  cmscgddfu0009ucvi1nn2u1dc: "Domotique",
  cmscgdczp0008ucvirlm59hcf: "Garage 2 voitures",
  cmscgdcjj0007ucvitpkjzgxb: "Jardin privatif",
  cmscgdc3b0006ucvi7taz5k3g: "Piscine",
  cmscgdf0t000cucviv5qn8bqb: "Salle de sport",
  cmscgdeki000bucvig7rmr5rs: "Sécurité 24/7",
  cmscgdfh4000ducvit5x77itp: "Vue mer",
};

const columns = [
  "reference", "title", "titleEn", "titleAr", "slug", "description", "descriptionEn", "descriptionAr",
  "listingType", "status", "price", "surfaceArea", "bedrooms", "bathrooms", "floors", "yearBuilt",
  "address", "latitude", "longitude", "featured", "city", "propertyType", "agency", "agent", "amenities",
  "imageUrls", "seoTitle", "seoTitleEn", "seoTitleAr", "seoDescription", "seoDescriptionEn", "seoDescriptionAr",
] as const;

const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const rows = sampleListings.map((listing) => ({
  ...listing,
  agency: "",
  agent: "",
  amenities: listing.amenityIds.map((id) => amenityNameById[id]).join("|"),
  imageUrls: listing.imageUrls.join("|"),
}));

const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => quote(row[column])).join(","))].join("\n");
const outputPath = resolve(process.cwd(), "tmp", "domify-sample-catalogue.csv");
writeFileSync(outputPath, `\uFEFF${csv}\n`, "utf8");
console.log(outputPath);
