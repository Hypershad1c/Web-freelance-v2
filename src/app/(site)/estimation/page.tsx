"use client";

import { useState } from "react";
import { CheckCircle2, CircleGauge, Clock3, ShieldCheck, TrendingUp } from "lucide-react";
import { HoneypotField } from "@/components/HoneypotField";
import { Turnstile } from "@/components/Turnstile";

const PROPERTY_TYPES = ["Appartement", "Villa", "Duplex", "Terrain", "Riad", "Bureau"];
const TIMELINES = [
  { value: "ASAP", label: "Dès que possible" },
  { value: "THREE_MONTHS", label: "Sous 3 mois" },
  { value: "SIX_MONTHS", label: "Sous 6 mois" },
  { value: "EXPLORING", label: "Je prépare mon projet" },
];

export default function EstimationPage() {
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
    neighborhood: "",
    transactionType: "VENTE",
    surfaceArea: "",
    bedrooms: "",
    desiredPrice: "",
    timeline: "THREE_MONTHS",
    notes: "",
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (honeypot) return;
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          surfaceArea: form.surfaceArea || undefined,
          bedrooms: form.bedrooms || undefined,
          desiredPrice: form.desiredPrice || undefined,
          website: honeypot,
          turnstileToken,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Une erreur est survenue.");
      }
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue. Merci de réessayer.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_85%_0%,rgba(232,203,145,0.14),transparent_24rem)] bg-[#fbfaf7]">
      <section className="relative overflow-hidden border-b border-white/10 bg-domify-primary-dark py-20 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full border border-domify-soft-gold/25" />
        <div className="pointer-events-none absolute bottom-0 left-[12%] h-40 w-40 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="luxury-eyebrow text-domify-soft-gold">Parcours propriétaire</p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">Votre estimation, enfin actionnable.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/72">Partagez les informations essentielles. Un conseiller Domify étudie votre projet et ouvre un dossier vendeur suivi avec vous.</p>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
        <aside className="space-y-5 lg:pt-6">
          <p className="luxury-eyebrow text-domify-gold">Ce que vous obtenez</p>
          <h2 className="font-display text-3xl font-semibold text-domify-dark">Un accompagnement, pas une estimation automatique.</h2>
          <Benefit icon={CircleGauge} title="Lecture du marché local" desc="Un expert rapproche votre bien des transactions et des opportunités comparables." />
          <Benefit icon={TrendingUp} title="Dossier vendeur dédié" desc="Votre projet est centralisé, suivi et prêt pour les prochaines étapes." />
          <Benefit icon={Clock3} title="Retour sous 48h" desc="Nous vous recontactons rapidement pour préciser votre stratégie de vente ou location." />
          <Benefit icon={ShieldCheck} title="Sans engagement" desc="L’estimation est gratuite et confidentielle, sans obligation de mandat." />
        </aside>

        <section className="rounded-[1.9rem] border border-domify-dark/8 bg-white/95 p-5 shadow-[0_28px_62px_-40px_rgba(16,47,66,0.52)] sm:p-9">
          {sent ? (
            <div className="flex min-h-96 flex-col items-center justify-center px-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={32} /></span>
              <p className="mt-6 font-display text-2xl font-semibold text-domify-dark">Votre dossier vendeur est ouvert.</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-domify-dark/62">Merci pour ces informations. Un expert Domify vous recontactera sous 48h pour affiner votre estimation et définir la meilleure suite pour votre bien.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-7">
              <HoneypotField value={honeypot} onChange={setHoneypot} />
              <fieldset>
                <legend className="font-display text-xl font-semibold text-domify-dark">1. Vos coordonnées</legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input required placeholder="Nom complet" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="domify-select" />
                  <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="domify-select" />
                  <input placeholder="Téléphone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="domify-select sm:col-span-2" />
                </div>
              </fieldset>

              <fieldset className="border-t border-domify-dark/8 pt-6">
                <legend className="font-display text-xl font-semibold text-domify-dark">2. Votre bien</legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <select value={form.transactionType} onChange={(event) => setForm({ ...form, transactionType: event.target.value })} className="domify-select"><option value="VENTE">Je souhaite vendre</option><option value="LOCATION">Je souhaite louer</option></select>
                  <select value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value })} className="domify-select">{PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                  <input required placeholder="Ville" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="domify-select" />
                  <input placeholder="Quartier (facultatif)" value={form.neighborhood} onChange={(event) => setForm({ ...form, neighborhood: event.target.value })} className="domify-select" />
                  <input type="number" min="1" placeholder="Surface (m²)" value={form.surfaceArea} onChange={(event) => setForm({ ...form, surfaceArea: event.target.value })} className="domify-select" />
                  <input type="number" min="0" placeholder="Chambres" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} className="domify-select" />
                </div>
              </fieldset>

              <fieldset className="border-t border-domify-dark/8 pt-6">
                <legend className="font-display text-xl font-semibold text-domify-dark">3. Votre projet</legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input type="number" min="0" placeholder="Valeur souhaitée (MAD, facultatif)" value={form.desiredPrice} onChange={(event) => setForm({ ...form, desiredPrice: event.target.value })} className="domify-select sm:col-span-2" />
                  <select value={form.timeline} onChange={(event) => setForm({ ...form, timeline: event.target.value })} className="domify-select sm:col-span-2">{TIMELINES.map((timeline) => <option key={timeline.value} value={timeline.value}>{timeline.label}</option>)}</select>
                  <textarea rows={3} placeholder="Décrivez votre bien ou vos attentes (facultatif)" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="rounded-xl border border-domify-dark/10 px-4 py-3 text-sm sm:col-span-2" />
                </div>
              </fieldset>

              <Turnstile action="valuation" onTokenChange={setTurnstileToken} />
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={sending || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)} className="pressable w-full rounded-xl bg-domify-gold px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_30px_-20px_rgba(199,157,64,0.9)] transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:cursor-wait disabled:opacity-60">
                {sending ? "Ouverture de votre dossier..." : "Obtenir mon estimation personnalisée"}
              </button>
              <p className="text-center text-xs leading-5 text-domify-dark/48">Vos informations sont utilisées uniquement pour étudier votre demande et vous accompagner dans votre projet immobilier.</p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function Benefit({ icon: Icon, title, desc }: { icon: typeof TrendingUp; title: string; desc: string }) {
  return <article className="flex gap-4 rounded-2xl border border-domify-dark/7 bg-white/75 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold"><Icon size={18} /></span><div><h3 className="font-semibold text-domify-dark">{title}</h3><p className="mt-1 text-sm leading-6 text-domify-dark/60">{desc}</p></div></article>;
}
