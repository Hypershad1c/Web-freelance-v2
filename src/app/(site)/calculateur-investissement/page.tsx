import { getLocale } from "@/i18n/get-locale";
import { InvestmentCalculatorClient } from "./InvestmentCalculatorClient";

export default async function InvestmentCalculatorPage() {
  const locale = await getLocale();
  return <InvestmentCalculatorClient locale={locale} />;
}
