"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, ExternalLink, Info, Landmark, ShieldCheck, TrendingUp } from "lucide-react";
import { formatMAD } from "@/lib/utils";
import {
  MORTGAGE_BANK_RATES,
  MORTGAGE_RATES_LAST_VERIFIED,
  MORTGAGE_RATES_MARKET_SOURCE_URL,
  MORTGAGE_RATES_SOURCE_LABEL,
  MORTGAGE_RATES_SOURCE_URL,
  type MortgageRateProfile,
} from "@/lib/mortgage-rates";

type JourneyStep = "choose-bank" | "simulation";

const DEFAULT_BANK = MORTGAGE_BANK_RATES[0]!;

export default function MortgageCalculatorPage() {
  const [step, setStep] = useState<JourneyStep>("choose-bank");
  const [price, setPrice] = useState(2000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [selectedBankSlug, setSelectedBankSlug] = useState(DEFAULT_BANK.slug);
  const [rate, setRate] = useState(DEFAULT_BANK.nominalRatePercent);
  const [years, setYears] = useState(20);

  const selectedBank = useMemo(
    () => MORTGAGE_BANK_RATES.find((bank) => bank.slug === selectedBankSlug) ?? DEFAULT_BANK,
    [selectedBankSlug]
  );

  const result = useMemo(() => {
    const downPayment = (price * downPaymentPct) / 100;
    const principal = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;
    const monthlyPayment = monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPaid = monthlyPayment * months;

    return { downPayment, principal, monthlyPayment, totalPaid, totalInterest: totalPaid - principal };
  }, [downPaymentPct, price, rate, years]);

  const usesBankRate = rate === selectedBank.nominalRatePercent;

  function chooseBank(bank: MortgageRateProfile) {
    setSelectedBankSlug(bank.slug);
    setRate(bank.nominalRatePercent);
    setStep("simulation");
  }

  if (step === "choose-bank") return <BankSelection onChoose={chooseBank} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-7 flex flex-col gap-5 rounded-[2rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(16,47,66,0.55)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: selectedBank.brandColorLight, color: selectedBank.brandColor }}><Calculator size={22} /></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-domify-dark/45">Votre simulation</p><h1 className="mt-1 font-display text-2xl font-semibold text-domify-dark sm:text-3xl">Crédit immobilier au Maroc</h1></div>
        </div>
        <button type="button" onClick={() => setStep("choose-bank")} className="pressable inline-flex items-center justify-center gap-2 rounded-full border border-domify-dark/12 bg-domify-warm-white px-4 py-2.5 text-sm font-semibold text-domify-dark transition-luxury hover:border-domify-dark/25 hover:bg-white"><ArrowLeft size={16} /> Changer de banque</button>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)] lg:items-start">
        <section className="rounded-[2rem] border border-domify-dark/7 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(16,47,66,0.55)] sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-domify-dark/7 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-domify-gold">1. Votre projet</p><h2 className="mt-1 font-display text-2xl font-semibold text-domify-dark">Ajustez votre financement</h2></div><Landmark size={22} className="shrink-0 text-domify-primary/45" /></div>
          <div className="mt-7 space-y-7">
            <SliderField label="Prix du bien" value={price} onChange={setPrice} min={200000} max={20000000} step={50000} color={selectedBank.brandColor} format={formatMAD} />
            <SliderField label="Apport personnel" value={downPaymentPct} onChange={setDownPaymentPct} min={0} max={80} step={1} color={selectedBank.brandColor} format={(value) => `${value} % · ${formatMAD((price * value) / 100)}`} />
            <SliderField label="Taux nominal annuel" value={rate} onChange={setRate} min={1} max={10} step={0.05} color={selectedBank.brandColor} format={(value) => `${value.toFixed(2).replace(".", ",")} %`} />
            <SliderField label="Durée du prêt" value={years} onChange={setYears} min={5} max={30} step={1} color={selectedBank.brandColor} format={(value) => `${value} ans`} />
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl p-4 text-xs leading-5" style={{ backgroundColor: selectedBank.brandColorLight, color: selectedBank.brandColor }}><Info size={16} className="mt-0.5 shrink-0" /><p className="text-domify-dark/68">Les conditions finales dépendent de votre dossier, de vos garanties et de la politique de la banque. Cette estimation n’est pas une offre de crédit.</p></div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-domify-dark/8 bg-white shadow-[0_24px_60px_-38px_rgba(16,47,66,0.55)]">
          <div className="p-5 sm:p-7" style={{ backgroundColor: selectedBank.brandColor }}>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">Simulation avec</p><h2 className="mt-2 text-2xl font-semibold text-white">{selectedBank.name}</h2></div><div className="w-[132px] rounded-2xl bg-white/95 p-2 shadow-[0_12px_24px_-18px_rgba(0,0,0,0.55)]"><BankLogo bank={selectedBank} compact /></div></div>
            <div className="mt-9"><p className="text-sm text-white/70">Mensualité estimée</p><p className="mt-2 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{formatMAD(Math.round(result.monthlyPayment))}</p><p className="mt-2 text-sm text-white/70">par mois, sur {years} ans à {rate.toFixed(2).replace(".", ",")} %</p></div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-3 sm:gap-4"><StatCard label="Montant emprunté" value={formatMAD(Math.round(result.principal))} color={selectedBank.brandColor} /><StatCard label="Apport" value={formatMAD(Math.round(result.downPayment))} color={selectedBank.brandColor} /><StatCard label="Intérêts estimés" value={formatMAD(Math.round(result.totalInterest))} color={selectedBank.brandColor} /><StatCard label="Coût total du crédit" value={formatMAD(Math.round(result.totalPaid))} color={selectedBank.brandColor} /></div>
            <div className="mt-5 rounded-2xl border border-domify-dark/7 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: selectedBank.brandColor }}>Lecture du taux</p><p className="mt-1 text-sm font-semibold text-domify-dark">{usesBankRate ? "Taux indicatif de la référence sélectionnée" : "Taux personnalisé pour votre simulation"}</p></div><span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: selectedBank.brandColorLight, color: selectedBank.brandColor }}>{rate.toFixed(2).replace(".", ",")} % nominal</span></div><div className="mt-4 space-y-1.5 text-xs leading-5 text-domify-dark/60">{usesBankRate ? <p>TEG indicatif associé : <strong className="font-semibold text-domify-dark/80">{selectedBank.tegPercent.toFixed(2).replace(".", ",")} %</strong>.</p> : <p>Le TEG indicatif de {selectedBank.name} est présenté à titre de repère ; le taux a été ajusté pour cette simulation.</p>}{selectedBank.sourceReferenceRatePercent ? <p>Taux de référence signalé : {selectedBank.sourceReferenceRatePercent.toFixed(2).replace(".", ",")} %.</p> : null}</div></div>
            <Link href="/estimation" className="pressable mt-5 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-[0_16px_30px_-20px_rgba(16,47,66,0.7)] transition-luxury hover:-translate-y-0.5" style={{ backgroundColor: selectedBank.brandColor }}><TrendingUp size={17} /> Obtenir l’estimation de mon bien <ArrowRight size={16} /></Link>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold"><a href={MORTGAGE_RATES_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-domify-primary hover:text-domify-gold">{MORTGAGE_RATES_SOURCE_LABEL} <ExternalLink size={13} /></a><a href={MORTGAGE_RATES_MARKET_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-domify-primary hover:text-domify-gold">Référence marché <ExternalLink size={13} /></a></div>
          </div>
        </section>
      </div>
      <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-5 text-domify-dark/45">Taux indicatifs, vérifiés le {MORTGAGE_RATES_LAST_VERIFIED}. Ils sont fournis à titre d’information et peuvent varier selon le profil de l’emprunteur, le montant financé et les conditions de la banque.</p>
    </div>
  );
}

function BankSelection({ onChoose }: { onChoose: (bank: MortgageRateProfile) => void }) {
  return <div className="relative isolate overflow-hidden px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-110px)] lg:px-8 lg:py-14"><div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_12%_4%,rgba(189,145,74,0.20),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(16,47,66,0.12),transparent_34%)]" /><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-3xl text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-domify-primary text-domify-soft-gold shadow-[0_18px_30px_-20px_rgba(16,47,66,0.95)]"><Landmark size={24} /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-domify-gold">Étape 1 · Votre banque de référence</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-domify-dark sm:text-5xl">Choisissez la banque qui vous accompagne.</h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-domify-dark/62">Sélectionnez une référence pour visualiser votre financement avec sa couleur de marque et son taux indicatif. Vous pourrez ajuster vos paramètres à l’étape suivante.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{MORTGAGE_BANK_RATES.map((bank) => <button key={bank.slug} type="button" onClick={() => onChoose(bank)} className="pressable group min-h-[170px] rounded-[1.5rem] border border-domify-dark/8 bg-white p-4 text-left shadow-[0_16px_34px_-30px_rgba(16,47,66,0.48)] transition-luxury hover:-translate-y-1 hover:border-transparent hover:shadow-[0_20px_36px_-26px_rgba(16,47,66,0.42)]" aria-label={`Choisir ${bank.name}`}><div className="flex h-[72px] items-center rounded-2xl px-3" style={{ backgroundColor: bank.brandColorLight }}><BankLogo bank={bank} /></div><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-sm font-bold text-domify-dark">{bank.name}</p><p className="mt-1 text-xs text-domify-dark/55">Taux nominal indicatif</p></div><span className="shrink-0 text-lg font-bold" style={{ color: bank.brandColor }}>{bank.nominalRatePercent.toFixed(2).replace(".", ",")} %</span></div><div className="mt-3 flex items-center gap-1.5 text-xs font-bold" style={{ color: bank.brandColor }}><CheckCircle2 size={14} /> Simuler <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" /></div></button>)}</div><div className="mx-auto mt-8 flex max-w-4xl items-start gap-3 rounded-2xl border border-domify-dark/7 bg-white/80 p-4 text-xs leading-5 text-domify-dark/58 shadow-[0_16px_34px_-30px_rgba(16,47,66,0.25)] backdrop-blur"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-domify-primary" /><p>Les logos présentés permettent d’identifier les références de simulation. Les taux sont indicatifs, non contractuels et ne remplacent pas une proposition de financement. Dernière vérification du catalogue : {MORTGAGE_RATES_LAST_VERIFIED}.</p></div></div></div>;
}

function BankLogo({ bank, compact = false }: { bank: MortgageRateProfile; compact?: boolean }) {
  return <Image src={bank.logoPath} alt={`Logo ${bank.name}`} width={compact ? 132 : 220} height={compact ? 48 : 64} className="h-full w-full object-contain object-left" />;
}

function SliderField({ label, value, onChange, min, max, step, color, format }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number; step: number; color: string; format: (value: number) => string }) {
  return <div><div className="mb-2.5 flex items-baseline justify-between gap-4"><span className="text-sm font-semibold text-domify-dark/75">{label}</span><span className="text-right text-sm font-bold" style={{ color }}>{format(value)}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full cursor-pointer" style={{ accentColor: color }} /></div>;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="rounded-2xl border border-domify-dark/7 bg-domify-warm-white/55 p-3.5 sm:p-4"><p className="text-[11px] leading-4 text-domify-dark/52">{label}</p><p className="mt-1.5 font-display text-base font-semibold leading-5 text-domify-dark sm:text-lg">{value}</p><span className="mt-3 block h-1 w-7 rounded-full" style={{ backgroundColor: color }} /></div>;
}
