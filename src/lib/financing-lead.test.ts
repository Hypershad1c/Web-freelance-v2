import { describe, expect, it } from "vitest";
import { buildFinancingLeadMessage } from "@/lib/financing-lead";

describe("buildFinancingLeadMessage", () => {
  it("records the purchase-only financing context and selected bank", () => {
    const message = buildFinancingLeadMessage({
      bankName: "Bank of Africa",
      price: 2000000,
      downPayment: 400000,
      principal: 1600000,
      nominalRate: 4.5,
      years: 20,
      monthlyPayment: 10122,
      propertyType: "Appartement",
      city: "Rabat",
      timeline: "Sous 3 mois",
      notes: "Premier achat",
    });

    expect(message).toContain("Achat uniquement");
    expect(message).toContain("Banque de référence : Bank of Africa");
    expect(message).toContain("Montant à financer : 1.600.000 MAD");
    expect(message).toContain("Ville recherchée : Rabat");
    expect(message).toContain("Précisions : Premier achat");
  });
});
