import { describe, expect, it } from "vitest";
import { assessListingQuality } from "./property-quality";

const completeListing = {
  title: "Villa contemporaine avec vue sur mer",
  description: "Une villa lumineuse avec un vaste séjour, des prestations soignées, une piscine et un jardin. Sa localisation facilite les déplacements tout en offrant un cadre de vie calme et recherché.",
  titleEn: "Contemporary villa with sea view",
  descriptionEn: "A light-filled villa with a generous living area, refined finishes, pool and garden in a calm, sought-after location.",
  titleAr: "فيلا عصرية بإطلالة على البحر",
  descriptionAr: "فيلا مشرقة بمساحات واسعة وتجهيزات راقية ومسبح وحديقة في موقع هادئ ومطلوب يوفر جودة حياة مميزة.",
  price: 7_500_000,
  surfaceArea: 520,
  bedrooms: 5,
  bathrooms: 4,
  address: "Souissi, Rabat",
  cityName: "Rabat",
  neighborhoodName: "Souissi",
  mediaCount: 6,
  amenityCount: 5,
};

describe("assessListingQuality", () => {
  it("marks a complete multilingual listing ready for publication", () => {
    const result = assessListingQuality(completeListing);
    expect(result.score).toBe(100);
    expect(result.level).toBe("ready");
    expect(result.missing).toEqual([]);
  });

  it("identifies actionable gaps for an incomplete listing", () => {
    const result = assessListingQuality({ ...completeListing, description: "Court", price: 0, address: null, mediaCount: 0, amenityCount: 0, titleAr: null, descriptionAr: null });
    expect(result.level).toBe("incomplete");
    expect(result.missing).toEqual(expect.arrayContaining(["description détaillée", "prix", "adresse et localisation", "photos", "équipements", "traduction arabe"]));
  });
});
