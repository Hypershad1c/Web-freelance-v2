"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, ExternalLink, Info, Landmark, Send, ShieldCheck } from "lucide-react";
import { FinancingLeadForm } from "@/components/financing/FinancingLeadForm";
import { formatMAD } from "@/lib/utils";
import type { Locale } from "@/i18n/locales";
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

const CALCULATOR_COPY = {
  fr: { simulation: "Votre simulation", title: "Crédit immobilier au Maroc", change: "Changer de banque", projectStep: "1. Votre projet", adjust: "Ajustez votre financement", price: "Prix du bien", downPayment: "Apport personnel", rate: "Taux nominal annuel", duration: "Durée du prêt", years: "ans", terms: "Les conditions finales dépendent de votre dossier, de vos garanties et de la politique de la banque. Cette estimation n’est pas une offre de crédit.", with: "Simulation avec", monthly: "Mensualité estimée", perMonth: "par mois, sur", at: "à", principal: "Montant emprunté", contribution: "Apport", interest: "Intérêts estimés", total: "Coût total du crédit", rateReading: "Lecture du taux", indicative: "Taux indicatif de la référence sélectionnée", custom: "Taux personnalisé pour votre simulation", nominal: "nominal", teg: "TEG indicatif associé :", bankTeg: "Le TEG indicatif de", benchmark: "est présenté à titre de repère ; le taux a été ajusté pour cette simulation.", reference: "Taux de référence signalé :", send: "Envoyer mon projet d’achat", market: "Référence marché", footer: "Taux indicatifs, vérifiés le", footerEnd: "Ils sont fournis à titre d’information et peuvent varier selon le profil de l’emprunteur, le montant financé et les conditions de la banque.", chooseStep: "Étape 1 · Votre banque de référence", chooseTitle: "Choisissez la banque qui vous accompagne.", chooseBody: "Sélectionnez une référence pour visualiser votre financement avec sa couleur de marque et son taux indicatif. Vous pourrez ajuster vos paramètres à l’étape suivante.", select: "Choisir", indicativeRate: "Taux nominal indicatif", simulate: "Simuler", selectorNotice: "Les logos présentés permettent d’identifier les références de simulation. Les taux sont indicatifs, non contractuels et ne remplacent pas une proposition de financement. Dernière vérification du catalogue :" },
  en: { simulation: "Your simulation", title: "Moroccan mortgage", change: "Change bank", projectStep: "1. Your project", adjust: "Adjust your financing", price: "Property price", downPayment: "Down payment", rate: "Annual nominal rate", duration: "Loan term", years: "years", terms: "Final terms depend on your file, guarantees, and the bank’s policy. This estimate is not a credit offer.", with: "Simulation with", monthly: "Estimated monthly payment", perMonth: "per month, over", at: "at", principal: "Amount borrowed", contribution: "Down payment", interest: "Estimated interest", total: "Total credit cost", rateReading: "Rate information", indicative: "Indicative rate for the selected reference", custom: "Custom rate for your simulation", nominal: "nominal", teg: "Associated indicative APR:", bankTeg: "The indicative APR of", benchmark: "is provided as a reference; the rate was adjusted for this simulation.", reference: "Reported reference rate:", send: "Send my purchase project", market: "Market reference", footer: "Indicative rates verified on", footerEnd: "They are for information only and may vary based on borrower profile, financed amount, and bank conditions.", chooseStep: "Step 1 · Your reference bank", chooseTitle: "Choose the bank supporting you.", chooseBody: "Select a reference to view your financing with its brand color and indicative rate. You can adjust your settings in the next step.", select: "Choose", indicativeRate: "Indicative nominal rate", simulate: "Simulate", selectorNotice: "The logos identify the simulation references. Rates are indicative, non-contractual, and do not replace a financing proposal. Catalogue last verified:" },
  ar: { simulation: "محاكاتك", title: "قرض عقاري في المغرب", change: "غيّر البنك", projectStep: "١. مشروعك", adjust: "عدّل تمويلك", price: "سعر العقار", downPayment: "الدفعة المقدمة", rate: "سعر الفائدة الاسمي السنوي", duration: "مدة القرض", years: "سنة", terms: "تعتمد الشروط النهائية على ملفك وضماناتك وسياسة البنك. هذه المحاكاة ليست عرضاً ائتمانياً.", with: "محاكاة مع", monthly: "القسط الشهري التقديري", perMonth: "شهرياً، لمدة", at: "بسعر", principal: "المبلغ المقترض", contribution: "الدفعة المقدمة", interest: "الفوائد التقديرية", total: "إجمالي تكلفة القرض", rateReading: "تفاصيل السعر", indicative: "سعر استرشادي للبنك المختار", custom: "سعر مخصص لمحاكاتك", nominal: "اسمي", teg: "معدل الفائدة الإجمالي الاسترشادي:", bankTeg: "معدل الفائدة الإجمالي الاسترشادي لبنك", benchmark: "للاسترشاد؛ تم تعديل السعر لهذه المحاكاة.", reference: "سعر المرجع المعلن:", send: "أرسل مشروع الشراء", market: "مرجع السوق", footer: "أسعار استرشادية تم التحقق منها في", footerEnd: "تُقدم للمعلومة فقط وقد تختلف حسب ملف المقترض، والمبلغ الممول، وشروط البنك.", chooseStep: "الخطوة ١ · البنك المرجعي", chooseTitle: "اختر البنك الذي يرافقك.", chooseBody: "اختر بنكاً مرجعياً لمعاينة تمويلك بألوان هويته وسعره الاسترشادي. يمكنك تعديل إعداداتك في الخطوة التالية.", select: "اختر", indicativeRate: "سعر اسمي استرشادي", simulate: "احسب", selectorNotice: "تساعد الشعارات على تحديد بنوك المحاكاة. الأسعار استرشادية وغير تعاقدية ولا تحل محل عرض تمويل. آخر تحقق من الدليل:" },
} as const;

export function MortgageCalculatorClient({ locale }: { locale: Locale }) {
  const copy = CALCULATOR_COPY[locale];
  const isRtl = locale === "ar";
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

  if (step === "choose-bank") return <BankSelection onChoose={chooseBank} locale={locale} />;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 ${isRtl ? "text-right" : ""}`}>
      <div className="mb-7 flex flex-col gap-5 rounded-[2rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(16,47,66,0.55)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: selectedBank.brandColorLight, color: selectedBank.brandColor }}><Calculator size={22} /></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-domify-dark/45">{copy.simulation}</p><h1 className="mt-1 font-display text-2xl font-semibold text-domify-dark sm:text-3xl">{copy.title}</h1></div>
        </div>
        <button type="button" onClick={() => setStep("choose-bank")} className="pressable inline-flex items-center justify-center gap-2 rounded-full border border-domify-dark/12 bg-domify-warm-white px-4 py-2.5 text-sm font-semibold text-domify-dark transition-luxury hover:border-domify-dark/25 hover:bg-white">{isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {copy.change}</button>
      </div>

      <div className={`grid gap-7 lg:items-start ${isRtl ? "lg:grid-cols-[minmax(360px,1.08fr)_minmax(0,0.92fr)]" : "lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)]"}`}>
        <section className="rounded-[2rem] border border-domify-dark/7 bg-white p-5 shadow-[0_18px_48px_-36px_rgba(16,47,66,0.55)] sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-domify-dark/7 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-domify-gold">{copy.projectStep}</p><h2 className="mt-1 font-display text-2xl font-semibold text-domify-dark">{copy.adjust}</h2></div><Landmark size={22} className="shrink-0 text-domify-primary/45" /></div>
          <div className="mt-7 space-y-7">
            <SliderField label={copy.price} value={price} onChange={setPrice} min={200000} max={20000000} step={50000} color={selectedBank.brandColor} format={formatMAD} />
            <SliderField label={copy.downPayment} value={downPaymentPct} onChange={setDownPaymentPct} min={0} max={80} step={1} color={selectedBank.brandColor} format={(value) => `${value} % · ${formatMAD((price * value) / 100)}`} />
            <SliderField label={copy.rate} value={rate} onChange={setRate} min={1} max={10} step={0.05} color={selectedBank.brandColor} format={(value) => `${value.toFixed(2).replace(".", ",")} %`} />
            <SliderField label={copy.duration} value={years} onChange={setYears} min={5} max={30} step={1} color={selectedBank.brandColor} format={(value) => `${value} ${copy.years}`} />
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl p-4 text-xs leading-5" style={{ backgroundColor: selectedBank.brandColorLight, color: selectedBank.brandColor }}><Info size={16} className="mt-0.5 shrink-0" /><p className="text-domify-dark/68">{copy.terms}</p></div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-domify-dark/8 bg-white shadow-[0_24px_60px_-38px_rgba(16,47,66,0.55)]">
          <div className="p-5 sm:p-7" style={{ backgroundColor: selectedBank.brandColor }}>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">{copy.with}</p><h2 className="mt-2 text-2xl font-semibold text-white"><bdi>{selectedBank.name}</bdi></h2></div><div className="w-[132px] rounded-2xl bg-white/95 p-2 shadow-[0_12px_24px_-18px_rgba(0,0,0,0.55)]"><BankLogo bank={selectedBank} compact /></div></div>
            <div className="mt-9"><p className="text-sm text-white/70">{copy.monthly}</p><p className="mt-2 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl"><bdi>{formatMAD(Math.round(result.monthlyPayment))}</bdi></p><p className="mt-2 text-sm text-white/70">{copy.perMonth} <bdi>{years} {copy.years} {copy.at} {rate.toFixed(2).replace(".", ",")} %</bdi></p></div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-3 sm:gap-4"><StatCard label={copy.principal} value={formatMAD(Math.round(result.principal))} color={selectedBank.brandColor} /><StatCard label={copy.contribution} value={formatMAD(Math.round(result.downPayment))} color={selectedBank.brandColor} /><StatCard label={copy.interest} value={formatMAD(Math.round(result.totalInterest))} color={selectedBank.brandColor} /><StatCard label={copy.total} value={formatMAD(Math.round(result.totalPaid))} color={selectedBank.brandColor} /></div>
            <div className="mt-5 rounded-2xl border border-domify-dark/7 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: selectedBank.brandColor }}>{copy.rateReading}</p><p className="mt-1 text-sm font-semibold text-domify-dark">{usesBankRate ? copy.indicative : copy.custom}</p></div><span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: selectedBank.brandColorLight, color: selectedBank.brandColor }}><bdi>{rate.toFixed(2).replace(".", ",")} % {copy.nominal}</bdi></span></div><div className="mt-4 space-y-1.5 text-xs leading-5 text-domify-dark/60">{usesBankRate ? <p>{copy.teg} <strong className="font-semibold text-domify-dark/80"><bdi>{selectedBank.tegPercent.toFixed(2).replace(".", ",")} %</bdi></strong>.</p> : <p>{copy.bankTeg} <bdi>{selectedBank.name}</bdi> {copy.benchmark}</p>}{selectedBank.sourceReferenceRatePercent ? <p>{copy.reference} <bdi>{selectedBank.sourceReferenceRatePercent.toFixed(2).replace(".", ",")} %</bdi>.</p> : null}</div></div>
            <button type="button" onClick={() => document.getElementById("financing-enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="pressable mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-[0_16px_30px_-20px_rgba(16,47,66,0.7)] transition-luxury hover:-translate-y-0.5" style={{ backgroundColor: selectedBank.brandColor }}><Send size={17} /> {copy.send} {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}</button>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold"><a href={MORTGAGE_RATES_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-domify-primary hover:text-domify-gold">{MORTGAGE_RATES_SOURCE_LABEL} <ExternalLink size={13} /></a><a href={MORTGAGE_RATES_MARKET_SOURCE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-domify-primary hover:text-domify-gold">{copy.market} <ExternalLink size={13} /></a></div>
          </div>
        </section>
      </div>
      <FinancingLeadForm bankName={selectedBank.name} brandColor={selectedBank.brandColor} price={price} downPayment={result.downPayment} principal={result.principal} nominalRate={rate} years={years} monthlyPayment={Math.round(result.monthlyPayment)} locale={locale} />
      <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-5 text-domify-dark/45">{copy.footer} <bdi>{MORTGAGE_RATES_LAST_VERIFIED}</bdi>. {copy.footerEnd}</p>
    </div>
  );
}

function BankSelection({ onChoose, locale }: { onChoose: (bank: MortgageRateProfile) => void; locale: Locale }) {
  const copy = CALCULATOR_COPY[locale];
  const isRtl = locale === "ar";
  return <div dir={isRtl ? "rtl" : "ltr"} className={`relative isolate overflow-hidden px-4 py-10 sm:px-6 lg:min-h-[calc(100vh-110px)] lg:px-8 lg:py-14 ${isRtl ? "text-right" : ""}`}><div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_12%_4%,rgba(189,145,74,0.20),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(16,47,66,0.12),transparent_34%)]" /><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-3xl text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-domify-primary text-domify-soft-gold shadow-[0_18px_30px_-20px_rgba(16,47,66,0.95)]"><Landmark size={24} /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-domify-gold">{copy.chooseStep}</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-domify-dark sm:text-5xl">{copy.chooseTitle}</h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-domify-dark/62">{copy.chooseBody}</p></div><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{MORTGAGE_BANK_RATES.map((bank) => <button key={bank.slug} type="button" onClick={() => onChoose(bank)} className={`pressable group min-h-[170px] rounded-[1.5rem] border border-domify-dark/8 bg-white p-4 shadow-[0_16px_34px_-30px_rgba(16,47,66,0.48)] transition-luxury hover:-translate-y-1 hover:border-transparent hover:shadow-[0_20px_36px_-26px_rgba(16,47,66,0.42)] ${isRtl ? "text-right" : "text-left"}`} aria-label={`${copy.select} ${bank.name}`}><div className="flex h-[72px] items-center rounded-2xl px-3" style={{ backgroundColor: bank.brandColorLight }}><BankLogo bank={bank} /></div><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-sm font-bold text-domify-dark"><bdi>{bank.name}</bdi></p><p className="mt-1 text-xs text-domify-dark/55">{copy.indicativeRate}</p></div><span className="shrink-0 text-lg font-bold" style={{ color: bank.brandColor }}><bdi>{bank.nominalRatePercent.toFixed(2).replace(".", ",")} %</bdi></span></div><div className="mt-3 flex items-center gap-1.5 text-xs font-bold" style={{ color: bank.brandColor }}><CheckCircle2 size={14} /> {copy.simulate} {isRtl ? <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" /> : <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />}</div></button>)}</div><div className="mx-auto mt-8 flex max-w-4xl items-start gap-3 rounded-2xl border border-domify-dark/7 bg-white/80 p-4 text-xs leading-5 text-domify-dark/58 shadow-[0_16px_34px_-30px_rgba(16,47,66,0.25)] backdrop-blur"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-domify-primary" /><p>{copy.selectorNotice} <bdi>{MORTGAGE_RATES_LAST_VERIFIED}</bdi>.</p></div></div></div>;
}

function BankLogo({ bank, compact = false }: { bank: MortgageRateProfile; compact?: boolean }) {
  return <Image src={bank.logoPath} alt={`Logo ${bank.name}`} width={compact ? 132 : 220} height={compact ? 48 : 64} className="h-full w-full object-contain object-center" />;
}

function SliderField({ label, value, onChange, min, max, step, color, format }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number; step: number; color: string; format: (value: number) => string }) {
  return <div><div className="mb-2.5 flex items-baseline justify-between gap-4"><span className="text-sm font-semibold text-domify-dark/75">{label}</span><span className="text-right text-sm font-bold" style={{ color }}>{format(value)}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full cursor-pointer" style={{ accentColor: color }} /></div>;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="rounded-2xl border border-domify-dark/7 bg-domify-warm-white/55 p-3.5 sm:p-4"><p className="text-[11px] leading-4 text-domify-dark/52">{label}</p><p className="mt-1.5 font-display text-base font-semibold leading-5 text-domify-dark sm:text-lg">{value}</p><span className="mt-3 block h-1 w-7 rounded-full" style={{ backgroundColor: color }} /></div>;
}
