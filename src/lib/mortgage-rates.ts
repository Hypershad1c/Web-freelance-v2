export type MortgageRateProfile = {
  slug: string;
  name: string;
  nominalRatePercent: number;
  tegPercent: number;
  sourceReferenceRatePercent: number | null;
  monthlyPaymentMad: number | null;
  confidence: "medium" | "low";
};

export const MORTGAGE_RATES_LAST_VERIFIED = "20 avril 2026";
export const MORTGAGE_RATES_SOURCE_LABEL = "Comparatif indicatif Crédit.ma";
export const MORTGAGE_RATES_SOURCE_URL = "https://credit.ma/comparer?type=mortgage&montant=500000&duree=20&profil=salarie";
export const MORTGAGE_RATES_MARKET_SOURCE_URL = "https://medias24.com/2026/06/09/credit-immobilier-des-taux-a-4-mais-des-ecarts-importants-selon-les-profils-1695745/";

export const MORTGAGE_BANK_RATES: MortgageRateProfile[] = [
  {
    slug: "market-average",
    name: "Moyenne du marché — Afdal",
    nominalRatePercent: 4.64,
    tegPercent: 5.49,
    sourceReferenceRatePercent: null,
    monthlyPaymentMad: null,
    confidence: "medium",
  },
  {
    slug: "bank-of-africa",
    name: "Bank of Africa",
    nominalRatePercent: 4.5,
    tegPercent: 5.38,
    sourceReferenceRatePercent: 4.35,
    monthlyPaymentMad: 3163,
    confidence: "medium",
  },
  {
    slug: "bmci",
    name: "BMCI",
    nominalRatePercent: 4.6,
    tegPercent: 5.49,
    sourceReferenceRatePercent: 4.4,
    monthlyPaymentMad: 3190,
    confidence: "medium",
  },
  {
    slug: "attijariwafa-bank",
    name: "Attijariwafa bank",
    nominalRatePercent: 4.75,
    tegPercent: 5.66,
    sourceReferenceRatePercent: 4.15,
    monthlyPaymentMad: 3231,
    confidence: "medium",
  },
  {
    slug: "cih-bank",
    name: "CIH Bank",
    nominalRatePercent: 4.75,
    tegPercent: 5.66,
    sourceReferenceRatePercent: 4.1,
    monthlyPaymentMad: 3231,
    confidence: "medium",
  },
  {
    slug: "credit-du-maroc",
    name: "Crédit du Maroc",
    nominalRatePercent: 4.75,
    tegPercent: 5.66,
    sourceReferenceRatePercent: 4.3,
    monthlyPaymentMad: 3231,
    confidence: "medium",
  },
  {
    slug: "banque-populaire",
    name: "Banque Populaire / BCP",
    nominalRatePercent: 4.9,
    tegPercent: 5.82,
    sourceReferenceRatePercent: 4.15,
    monthlyPaymentMad: 3272,
    confidence: "medium",
  },
  {
    slug: "saham-bank",
    name: "Saham Bank",
    nominalRatePercent: 4.9,
    tegPercent: 5.82,
    sourceReferenceRatePercent: 4.3,
    monthlyPaymentMad: 3272,
    confidence: "medium",
  },
  {
    slug: "cfg-bank",
    name: "CFG Bank",
    nominalRatePercent: 4.9,
    tegPercent: 5.82,
    sourceReferenceRatePercent: null,
    monthlyPaymentMad: 3272,
    confidence: "low",
  },
  {
    slug: "umnia-bank",
    name: "Umnia Bank",
    nominalRatePercent: 5.1,
    tegPercent: 6.04,
    sourceReferenceRatePercent: 4.6,
    monthlyPaymentMad: 3327,
    confidence: "medium",
  },
  {
    slug: "bank-assafa",
    name: "Bank Assafa",
    nominalRatePercent: 5.2,
    tegPercent: 6.15,
    sourceReferenceRatePercent: 4.8,
    monthlyPaymentMad: 3355,
    confidence: "medium",
  },
  {
    slug: "al-akhdar-bank",
    name: "Al Akhdar Bank",
    nominalRatePercent: 5.3,
    tegPercent: 6.26,
    sourceReferenceRatePercent: 4.9,
    monthlyPaymentMad: 3383,
    confidence: "medium",
  },
  {
    slug: "bank-al-karam",
    name: "Bank Al Karam",
    nominalRatePercent: 5.4,
    tegPercent: 6.37,
    sourceReferenceRatePercent: 5,
    monthlyPaymentMad: 3411,
    confidence: "medium",
  },
];
