"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { HoneypotField } from "@/components/HoneypotField";
import { Turnstile } from "@/components/Turnstile";
import { getClientAnalyticsAttribution } from "@/lib/client-analytics";
import { buildFinancingLeadMessage } from "@/lib/financing-lead";

type FinancingLeadFormProps = {
  bankName: string;
  brandColor: string;
  price: number;
  downPayment: number;
  principal: number;
  nominalRate: number;
  years: number;
  monthlyPayment: number;
};

const PROPERTY_TYPES = ["Appartement", "Villa", "Duplex", "Terrain", "Riad", "Bureau"];
const PURCHASE_TIMELINES = ["Dès que possible", "Sous 3 mois", "Sous 6 mois", "Je prépare mon achat"];

export function FinancingLeadForm({
  bankName,
  brandColor,
  price,
  downPayment,
  principal,
  nominalRate,
  years,
  monthlyPayment,
}: FinancingLeadFormProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: PROPERTY_TYPES[0],
    city: "",
    timeline: PURCHASE_TIMELINES[1],
    notes: "",
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (honeypot) return;

    setSending(true);
    setError(null);
    try {
      const attribution = getClientAnalyticsAttribution();
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: buildFinancingLeadMessage({
            bankName,
            price,
            downPayment,
            principal,
            nominalRate,
            years,
            monthlyPayment,
            propertyType: form.propertyType,
            city: form.city,
            timeline: form.timeline,
            notes: form.notes,
          }),
          source: "mortgage_calculator_purchase",
          utmSource: attribution.source,
          utmMedium: attribution.medium,
          utmCampaign: attribution.campaign,
          referrer: attribution.referrer,
          website: honeypot,
          turnstileToken,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "La demande n’a pas pu être envoyée.");
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La demande n’a pas pu être envoyée. Merci de réessayer.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="financing-enquiry" className="mt-9 overflow-hidden rounded-[2rem] border border-domify-dark/8 bg-white shadow-[0_24px_60px_-38px_rgba(16,47,66,0.48)]">
      <div className="p-5 text-white sm:p-7" style={{ backgroundColor: brandColor }}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">Étape 2 · Demande acheteur</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Envoyez votre projet de financement.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">Votre sélection {bankName} et les paramètres de votre simulation seront transmis à l’équipe Domify afin de vous accompagner dans votre achat.</p>
      </div>
      <div className="p-5 sm:p-8">
        {sent ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={32} /></span>
            <h3 className="mt-6 font-display text-2xl font-semibold text-domify-dark">Votre demande acheteur est envoyée.</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-domify-dark/62">Un conseiller Domify vous recontactera pour examiner votre projet d’achat et les possibilités de financement associées à votre banque de référence.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <HoneypotField value={honeypot} onChange={setHoneypot} />
            <fieldset className="space-y-3">
              <legend className="font-display text-xl font-semibold text-domify-dark">Vos coordonnées</legend>
              <input required placeholder="Nom complet" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="domify-select w-full" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="domify-select w-full" />
              <input required type="tel" placeholder="Téléphone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="domify-select w-full" />
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="font-display text-xl font-semibold text-domify-dark">Votre achat</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value })} className="domify-select"><option value="" disabled>Type de bien</option>{PROPERTY_TYPES.map((propertyType) => <option key={propertyType} value={propertyType}>{propertyType}</option>)}</select>
                <input required placeholder="Ville recherchée" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="domify-select" />
                <select value={form.timeline} onChange={(event) => setForm({ ...form, timeline: event.target.value })} className="domify-select sm:col-span-2">{PURCHASE_TIMELINES.map((timeline) => <option key={timeline} value={timeline}>{timeline}</option>)}</select>
                <textarea rows={3} placeholder="Précisions sur votre achat (facultatif)" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="rounded-xl border border-domify-dark/10 px-4 py-3 text-sm sm:col-span-2" />
              </div>
            </fieldset>
            <div className="lg:col-span-2">
              <Turnstile action="lead" onTokenChange={setTurnstileToken} />
              {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={sending || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)} className="pressable mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold text-white shadow-[0_18px_30px_-20px_rgba(16,47,66,0.78)] transition-luxury disabled:cursor-wait disabled:opacity-60" style={{ backgroundColor: brandColor }}><Send size={17} /> {sending ? "Envoi de votre demande..." : "Envoyer ma demande de financement"}</button>
              <p className="mt-3 text-center text-xs leading-5 text-domify-dark/48">Ce parcours concerne uniquement un projet d’achat. La simulation est indicative et ne constitue pas une offre de crédit.</p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
