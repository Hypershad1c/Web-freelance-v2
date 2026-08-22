export type FinancingLeadDetails = {
  bankName: string;
  price: number;
  downPayment: number;
  principal: number;
  nominalRate: number;
  years: number;
  monthlyPayment: number;
  propertyType: string;
  city: string;
  timeline: string;
  notes?: string;
};

const currency = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 });

export function buildFinancingLeadMessage(details: FinancingLeadDetails) {
  return [
    "Demande de financement immobilier — Achat uniquement",
    `Banque de référence : ${details.bankName}`,
    `Prix du bien envisagé : ${currency.format(details.price)} MAD`,
    `Apport personnel : ${currency.format(details.downPayment)} MAD`,
    `Montant à financer : ${currency.format(details.principal)} MAD`,
    `Simulation : ${details.years} ans à ${details.nominalRate.toFixed(2).replace(".", ",")} %`,
    `Mensualité estimée : ${currency.format(details.monthlyPayment)} MAD`,
    `Type de bien recherché : ${details.propertyType}`,
    `Ville recherchée : ${details.city}`,
    `Échéance d’achat : ${details.timeline}`,
    details.notes?.trim() ? `Précisions : ${details.notes.trim()}` : null,
  ].filter(Boolean).join("\n");
}
