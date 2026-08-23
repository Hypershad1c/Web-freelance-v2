"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PiggyBank, TrendingUp } from "lucide-react";
import { formatMAD } from "@/lib/utils";
import type { Locale } from "@/i18n/locales";

const INVESTMENT_COPY = {
  fr: { title: "Calculateur d’investissement locatif", subtitle: "Évaluez la rentabilité d’un bien avant d’investir.", price: "Prix d’achat", rent: "Loyer mensuel estimé", charges: "Charges mensuelles (taxes, syndic, entretien)", downPayment: "Apport personnel", gross: "Rendement brut", net: "Rendement net", cashFlow: "Cash-flow mensuel", annualIncome: "Revenu net annuel", cashReturn: "Rendement sur apport", payback: "Retour sur investissement", years: "ans", explore: "Explorer les biens à fort potentiel", disclaimer: "Cette estimation est indicative et ne prend pas en compte la fiscalité, les périodes de vacance locative ou les coûts de financement. Consultez un conseiller pour une analyse complète." },
  en: { title: "Rental investment calculator", subtitle: "Assess a property’s profitability before investing.", price: "Purchase price", rent: "Estimated monthly rent", charges: "Monthly charges (taxes, service fees, maintenance)", downPayment: "Down payment", gross: "Gross yield", net: "Net yield", cashFlow: "Monthly cash flow", annualIncome: "Annual net income", cashReturn: "Return on down payment", payback: "Payback period", years: "years", explore: "Explore high-potential properties", disclaimer: "This estimate is indicative and does not account for taxes, vacancy periods, or financing costs. Consult an advisor for a complete analysis." },
  ar: { title: "حاسبة الاستثمار الإيجاري", subtitle: "قيّم ربحية العقار قبل الاستثمار.", price: "سعر الشراء", rent: "الإيجار الشهري المقدر", charges: "المصاريف الشهرية (ضرائب ورسوم وصيانة)", downPayment: "الدفعة الأولى", gross: "العائد الإجمالي", net: "العائد الصافي", cashFlow: "التدفق النقدي الشهري", annualIncome: "الدخل الصافي السنوي", cashReturn: "العائد على الدفعة الأولى", payback: "فترة استرداد الاستثمار", years: "سنة", explore: "استكشف العقارات ذات الإمكانات العالية", disclaimer: "هذا التقدير استرشادي ولا يأخذ في الحسبان الضرائب أو فترات الشغور أو تكاليف التمويل. استشر مستشاراً لإجراء تحليل كامل." },
} as const;

export function InvestmentCalculatorClient({ locale }: { locale: Locale }) {
  const copy = INVESTMENT_COPY[locale];
  const isRtl = locale === "ar";
  const [price, setPrice] = useState(1500000);
  const [monthlyRent, setMonthlyRent] = useState(8000);
  const [monthlyCharges, setMonthlyCharges] = useState(800);
  const [downPaymentPct, setDownPaymentPct] = useState(20);

  const result = useMemo(() => {
    const annualRent = monthlyRent * 12;
    const annualCharges = monthlyCharges * 12;
    const netAnnualIncome = annualRent - annualCharges;
    const grossYield = (annualRent / price) * 100;
    const netYield = (netAnnualIncome / price) * 100;
    const downPayment = (price * downPaymentPct) / 100;
    const cashOnCashReturn = downPayment > 0 ? (netAnnualIncome / downPayment) * 100 : 0;
    const monthlyCashFlow = monthlyRent - monthlyCharges;
    const paybackYears = netAnnualIncome > 0 ? price / netAnnualIncome : null;
    return { grossYield, netYield, cashOnCashReturn, monthlyCashFlow, netAnnualIncome, paybackYears };
  }, [price, monthlyRent, monthlyCharges, downPaymentPct]);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 ${isRtl ? "text-right" : ""}`}>
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold"><PiggyBank size={20} /></span>
        <h1 className="mt-4 font-display text-3xl font-bold text-domify-dark sm:text-4xl">{copy.title}</h1>
        <p className="mt-2 text-domify-dark/60">{copy.subtitle}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-luxury">
          <SliderField label={copy.price} value={price} onChange={setPrice} min={200000} max={20000000} step={50000} format={formatMAD} />
          <SliderField label={copy.rent} value={monthlyRent} onChange={setMonthlyRent} min={1000} max={100000} step={500} format={formatMAD} />
          <SliderField label={copy.charges} value={monthlyCharges} onChange={setMonthlyCharges} min={0} max={20000} step={100} format={formatMAD} />
          <SliderField label={copy.downPayment} value={downPaymentPct} onChange={setDownPaymentPct} min={0} max={100} step={5} format={(value) => `${value}% (${formatMAD((price * value) / 100)})`} />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard tone="primary" label={copy.gross} value={`${result.grossYield.toFixed(2)}%`} />
            <MetricCard tone="gold" label={copy.net} value={`${result.netYield.toFixed(2)}%`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label={copy.cashFlow} value={formatMAD(Math.round(result.monthlyCashFlow))} />
            <StatCard label={copy.annualIncome} value={formatMAD(Math.round(result.netAnnualIncome))} />
            <StatCard label={copy.cashReturn} value={`${result.cashOnCashReturn.toFixed(1)}%`} />
            <StatCard label={copy.payback} value={result.paybackYears ? `${result.paybackYears.toFixed(1)} ${copy.years}` : "—"} />
          </div>
          <Link href="/proprietes" className="flex items-center justify-center gap-2 rounded-2xl bg-domify-gold py-4 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark"><TrendingUp size={16} /> {copy.explore}</Link>
        </div>
      </div>

      <p className="mt-8 text-center text-xs leading-5 text-domify-dark/40">{copy.disclaimer}</p>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, format }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number; step: number; format: (value: number) => string }) {
  return <div><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-medium text-domify-dark/70">{label}</span><bdi className="text-sm font-semibold text-domify-primary">{format(value)}</bdi></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-domify-primary" /></div>;
}

function MetricCard({ tone, label, value }: { tone: "primary" | "gold"; label: string; value: string }) {
  return <div className={`rounded-2xl p-6 text-white ${tone === "primary" ? "bg-domify-primary-dark" : "bg-domify-gold"}`}><p className="text-xs text-white/75">{label}</p><bdi className="mt-1 block font-display text-2xl font-bold">{value}</bdi></div>;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white p-5 shadow-luxury"><p className="text-xs text-domify-dark/50">{label}</p><bdi className="mt-1 block font-display text-lg font-semibold text-domify-dark">{value}</bdi></div>;
}
