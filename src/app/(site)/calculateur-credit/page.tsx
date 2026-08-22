import { getLocale } from "@/i18n/get-locale";
import { MortgageCalculatorClient } from "./MortgageCalculatorClient";

export default async function MortgageCalculatorPage() {
  const locale = await getLocale();
  return <MortgageCalculatorClient locale={locale} />;
}
