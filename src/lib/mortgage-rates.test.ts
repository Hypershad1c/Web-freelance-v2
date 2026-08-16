import { describe, expect, it } from "vitest";
import { MORTGAGE_BANK_RATES, MORTGAGE_RATES_LAST_VERIFIED } from "@/lib/mortgage-rates";

describe("mortgage rate catalog", () => {
  it("includes the market reference and the main Moroccan banks", () => {
    const slugs = new Set(MORTGAGE_BANK_RATES.map((bank) => bank.slug));

    expect(slugs).toEqual(new Set([
      "market-average",
      "bank-of-africa",
      "bmci",
      "attijariwafa-bank",
      "cih-bank",
      "credit-du-maroc",
      "banque-populaire",
      "saham-bank",
      "cfg-bank",
      "umnia-bank",
      "bank-assafa",
      "al-akhdar-bank",
      "bank-al-karam",
    ]));
    expect(MORTGAGE_RATES_LAST_VERIFIED).toBe("20 avril 2026");
  });

  it("keeps TEG at or above the nominal rate for every catalog entry", () => {
    for (const bank of MORTGAGE_BANK_RATES) {
      expect(bank.nominalRatePercent).toBeGreaterThan(0);
      expect(bank.tegPercent).toBeGreaterThanOrEqual(bank.nominalRatePercent);
    }
  });
});
