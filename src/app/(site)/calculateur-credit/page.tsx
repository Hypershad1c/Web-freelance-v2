"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, TrendingUp } from "lucide-react";
import { formatMAD } from "@/lib/utils";

export default function MortgageCalculatorPage() {
  const [price, setPrice] = useState(2000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(4.5);
  const [years, setYears] = useState(20);

  const result = useMemo(() => {
    const downPayment = (price * downPaymentPct) / 100;
    const principal = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;

    const monthlyPayment =
      monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - principal;

    return { downPayment, principal, monthlyPayment, totalPaid, totalInterest };
  }, [price, downPaymentPct, rate, years]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
          <Calculator size={20} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-domify-dark sm:text-4xl">Calculateur de crédit immobilier</h1>
        <p className="mt-2 text-domify-dark/60">Estimez votre mensualité de prêt immobilier en quelques secondes.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-luxury">
          <SliderField
            label="Prix du bien"
            value={price}
            onChange={setPrice}
            min={200000}
            max={20000000}
            step={50000}
            format={(v) => formatMAD(v)}
          />
          <SliderField
            label="Apport personnel"
            value={downPaymentPct}
            onChange={setDownPaymentPct}
            min={0}
            max={80}
            step={1}
            format={(v) => `${v}% (${formatMAD((price * v) / 100)})`}
          />
          <SliderField
            label="Taux d'intérêt annuel"
            value={rate}
            onChange={setRate}
            min={1}
            max={10}
            step={0.1}
            format={(v) => `${v.toFixed(1)}%`}
          />
          <SliderField
            label="Durée du prêt"
            value={years}
            onChange={setYears}
            min={5}
            max={30}
            step={1}
            format={(v) => `${v} ans`}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-domify-primary-dark p-8 text-white">
            <p className="text-sm text-white/70">Mensualité estimée</p>
            <p className="mt-2 font-display text-4xl font-bold">{formatMAD(Math.round(result.monthlyPayment))}</p>
            <p className="mt-1 text-sm text-white/50">par mois, sur {years} ans</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Montant emprunté" value={formatMAD(Math.round(result.principal))} />
            <StatCard label="Apport" value={formatMAD(Math.round(result.downPayment))} />
            <StatCard label="Coût total des intérêts" value={formatMAD(Math.round(result.totalInterest))} />
            <StatCard label="Coût total du crédit" value={formatMAD(Math.round(result.totalPaid))} />
          </div>

          <Link
            href="/estimation"
            className="flex items-center justify-center gap-2 rounded-2xl bg-domify-gold py-4 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark"
          >
            <TrendingUp size={16} /> Être accompagné par un conseiller Domify
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-domify-dark/40">
        Cette estimation est indicative et ne constitue pas une offre de prêt. Contactez votre banque ou un
        courtier pour une simulation personnalisée.
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
