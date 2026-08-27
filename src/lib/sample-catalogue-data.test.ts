import { describe, expect, it } from "vitest";
import { sampleListings } from "../../scripts/sample-catalogue-data";
import { assessListingQuality } from "./property-quality";

describe("sample catalogue data", () => {
  it("keeps twelve unique, fully localized, clearly labelled demo records", () => {
    expect(sampleListings).toHaveLength(12);
    expect(new Set(sampleListings.map((listing) => listing.reference)).size).toBe(12);

    for (const listing of sampleListings) {
      expect(listing.reference.startsWith("DEMO-")).toBe(true);
      expect(listing.title).toContain("Annonce exemple");
      expect(listing.titleEn).toContain("Sample listing");
      expect(listing.titleAr).toContain("عقار نموذجي");
      expect(listing.status).toBe("PUBLISHED");
      expect(listing.imageUrls).toHaveLength(1);
      expect(listing.amenityIds.length).toBeGreaterThanOrEqual(4);

      expect(assessListingQuality({ ...listing, cityName: listing.city, mediaCount: listing.imageUrls.length, amenityCount: listing.amenityIds.length })).toMatchObject({
        level: "ready",
        missing: ["galerie plus complète"],
      });
    }
  });
});
