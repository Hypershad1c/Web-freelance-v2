"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, ExternalLink, Info, TrendingUp } from "lucide-react";
import { formatMAD } from "@/lib/utils";
import {
  MORTGAGE_BANK_RATES,
  MORTGAGE_RATES_LAST_VERIFIED,
  MORTGAGE_RATES_MARKET_SOURCE_URL,
  MORTGAGE_RATES_SOURCE_LABEL,
  MORTGAGE_RATES_SOURCE_URL,
} from "@/lib/mortgage-rates";

const CUSTOM_RATE_SLUG = "custom";

export default function MortgageCalculatorPage() {
  const [price, setPrice] = useState(2000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [selectedBankSlug, setSelectedBankSlug] = useState("market-average");
  const [rate, setRate] = useState(MORTGAGE_BANK_RATES[0]?.nominalRatePercent ?? 4.64);
  const [years, setYears] = useState(20);

  const selectedBank = useMemo(
    () => MORTGAGE_BANK_RATES.find((bank) => bank.slug === selectedBankSlug) ?? null,
    [selectedBankSlug]
  );

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

  function selectBank(slug: string) {
    setSelectedBankSlug(slug);
    const bank = MORTGAGE_BANK_RATES.find((item) => item.slug === slug);
    if (bank) setRate(bank.nominalRatePercent);
  }

  function changeRate(value: number) {
    setSelectedBankSlug(CUSTOM_RATE_SLUG);
    setRate(value);
  }

  const displayedBankName = selectedBank?.name ?? "Taux personnalisé";
  const displayedTeg = selectedBank?.tegPercent;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
          <Calculator size={20} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-domify-dark sm:text-4xl">Calculateur de crédit immobilier</h1>
        <p className="mt-2 text-domify-dark/60">Estimez votre mensualité avec les taux indicatifs des principales banques marocaines.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-luxury">
          <div className="rounded-2xl border border-domify-gold/20 bg-domify-warm-white/65 p-4">
            <label htmlFor="mortgage-bank" className="text-sm font-semibold text-domify-dark">
              Banque ou référence de taux
            </label>
            <select
              id="mortgage-bank"
              value={selectedBankSlug}
              onChange={(event) => selectBank(event.target.value)}
              className="mt-2 w-full rounded-xl border border-domify-dark/10 bg-white px-3 py-3 text-sm font-medium text-domify-dark outline-none transition focus:border-domify-primary focus:ring-2 focus:ring-domify-primary/15"
            >
              {MORTGAGE_BANK_RATES.map((bank) => (
                <option key={bank.slug} value={bank.slug}>
                  {bank.name} — {bank.nominalRatePercent.toFixed(2).replace(".", ",")} %
                </option>
              ))}
              <option value={CUSTOM_RATE_SLUG}>Taux personnalisé</option>
            </select>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <RateMeta label="Taux nominal" value={`${rate.toFixed(2).replace(".", ",")} %`} />
              <RateMeta label="TEG indicatif" value={displayedTeg ? `${displayedTeg.toFixed(2).replace(".", ",")} %` : "—"} />
              <RateMeta label="Vérifié le" value={MORTGAGE_RATES_LAST_VERIFIED} />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-domify-dark/55">
              Référence sélectionnée : <strong className="font-semibold text-domify-dark/75">{displayedBankName}</strong>. Les conditions finales dépendent de votre dossier.
            </p>
          </div>

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
            label="Taux nominal annuel"
            value={rate}
            onChange={changeRate}
            min={1}
            max={10}
            step={0.05}
            format={(v) => `${v.toFixed(2).replace(".", ",")} %`}
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

          <div className="flex items-start gap-3 rounded-xl border border-domify-primary/10 bg-domify-primary/5 p-3 text-xs leading-5 text-domify-dark/60">
            <Info size={16} className="mt-0.5 shrink-0 text-domify-primary" />
            <p>
              Les taux affichés sont indicatifs et non contractuels. La simulation ne remplace pas une offre officielle de banque.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-domify-primary-dark p-8 text-white">
            <p className="text-sm text-white/70">Mensualité estimée</p>
            <p className="mt-2 font-display text-4xl font-bold">{formatMAD(Math.round(result.monthlyPayment))}</p>
            <p className="mt-1 text-sm text-white/50">par mois, sur {years} ans à {rate.toFixed(2).replace(".", ",")} %</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Montant emprunté" value={formatMAD(Math.round(result.principal))} />
            <StatCard label="Apport" value={formatMAD(Math.round(result.downPayment))} />
            <StatCard label="Coût total des intérêts" value={formatMAD(Math.round(result.totalInterest))} />
            <StatCard label="Coût total du crédit" value={formatMAD(Math.round(result.totalPaid))} />
          </div>

          <div className="rounded-2xl border border-black/6 bg-white p-5 shadow-luxury">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-domify-gold">Lecture du taux</p>
                <p className="mt-1 font-display text-lg font-semibold text-domify-dark">{displayedBankName}</p>
              </div>
              <span className="rounded-full bg-domify-warm-white px-3 py-1 text-xs font-semibold text-domify-primary">{rate.toFixed(2).replace(".", ",")} % nominal</span>
            </div>
            <div className="mt-4 space-y-2 text-xs leading-5 text-domify-dark/58">
              {displayedTeg ? <p>TEG indicatif associé : <strong className="font-semibold text-domify-dark/75">{displayedTeg.toFixed(2).replace(".", ",")} %</strong>.</p> : <p>Le TEG n’est pas disponible pour un taux personnalisé.</p>}
              {selectedBank?.sourceReferenceRatePercent ? <p>Taux de référence signalé : {selectedBank.sourceReferenceRatePercent.toFixed(2).replace(".", ",")} %.</p> : null}
              <p>Source : {MORTGAGE_RATES_SOURCE_LABEL}, vérifiée le {MORTGAGE_RATES_LAST_VERIFIED}.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
              <a href={MORTGAGE_RATES_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-domify-primary hover:text-domify-gold">
                Voir la source <ExternalLink size={13} />
              </a>
              <a href={MORTGAGE_RATES_MARKET_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-domify-primary hover:text-domify-gold">
                Référence marché <ExternalLink size={13} />
              </a>
            </div>
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
        Cette estimation est indicative et ne constitue pas une offre de prêt. Contactez votre banque ou un courtier pour une simulation personnalisée.
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

function RateMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.08em] text-domify-dark/45">{label}</p>
      <p className="mt-1 font-semibold text-domify-primary">{value}</p>
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
