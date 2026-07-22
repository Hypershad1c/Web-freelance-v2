"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PiggyBank, TrendingUp } from "lucide-react";
import { formatMAD } from "@/lib/utils";

export default function InvestmentCalculatorPage() {
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

    return { grossYield, netYield, cashOnCashReturn, monthlyCashFlow, netAnnualIncome, paybackYears, downPayment };
  }, [price, monthlyRent, monthlyCharges, downPaymentPct]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
          <PiggyBank size={20} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-domify-dark sm:text-4xl">Calculateur d&apos;investissement locatif</h1>
        <p className="mt-2 text-domify-dark/60">Évaluez la rentabilité d&apos;un bien avant d&apos;investir.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-luxury">
          <SliderField label="Prix d'achat" value={price} onChange={setPrice} min={200000} max={20000000} step={50000} format={(v) => formatMAD(v)} />
          <SliderField label="Loyer mensuel estimé" value={monthlyRent} onChange={setMonthlyRent} min={1000} max={100000} step={500} format={(v) => formatMAD(v)} />
          <SliderField label="Charges mensuelles (taxes, syndic, entretien)" value={monthlyCharges} onChange={setMonthlyCharges} min={0} max={20000} step={100} format={(v) => formatMAD(v)} />
          <SliderField label="Apport personnel" value={downPaymentPct} onChange={setDownPaymentPct} min={0} max={100} step={5} format={(v) => `${v}% (${formatMAD((price * v) / 100)})`} />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-domify-primary-dark p-6 text-white">
              <p className="text-xs text-white/70">Rendement brut</p>
              <p className="mt-1 font-display text-2xl font-bold">{result.grossYield.toFixed(2)}%</p>
            </div>
            <div className="rounded-2xl bg-domify-gold p-6 text-white">
              <p className="text-xs text-white/80">Rendement net</p>
              <p className="mt-1 font-display text-2xl font-bold">{result.netYield.toFixed(2)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Cash-flow mensuel" value={formatMAD(Math.round(result.monthlyCashFlow))} />
            <StatCard label="Revenu net annuel" value={formatMAD(Math.round(result.netAnnualIncome))} />
            <StatCard label="Rendement sur apport" value={`${result.cashOnCashReturn.toFixed(1)}%`} />
            <StatCard label="Retour sur investissement" value={result.paybackYears ? `${result.paybackYears.toFixed(1)} ans` : "—"} />
          </div>

          <Link
            href="/proprietes"
            className="flex items-center justify-center gap-2 rounded-2xl bg-domify-gold py-4 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark"
          >
            <TrendingUp size={16} /> Explorer les biens à fort potentiel
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-domify-dark/40">
        Cette estimation est indicative et ne prend pas en compte la fiscalité, les périodes de vacance locative ou
        les coûts de financement. Consultez un conseiller pour une analyse complète.
      </p>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-domify-dark/70">{label}</span>
        <span className="text-sm font-semibold text-domify-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-domify-primary"
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-luxury">
      <p className="text-xs text-domify-dark/50">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-domify-dark">{value}</p>
    </div>
  );
}
