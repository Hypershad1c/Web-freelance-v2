"use client";

import { useState } from "react";
import { CheckCircle2, Home, Users, ShieldCheck } from "lucide-react";
import { HoneypotField } from "@/components/HoneypotField";
import { Turnstile } from "@/components/Turnstile";

const PROPERTY_TYPES = ["Appartement", "Villa", "Duplex", "Terrain", "Riad", "Bureau"];

export default function SellOrRentPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState(""); // anti-bot — real users never fill this
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    transactionType: "Vente",
    propertyType: PROPERTY_TYPES[0],
    city: "",
    surfaceArea: "",
    desiredPrice: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return; // bot — silently drop, no feedback that reveals the trap
    setSending(true);
    setError(null);

    const message = [
      `Demande de ${form.transactionType.toLowerCase()} — ${form.propertyType}`,
      form.city && `Ville : ${form.city}`,
      form.surfaceArea && `Surface : ${form.surfaceArea} m²`,
      form.desiredPrice && `Prix souhaité : ${form.desiredPrice} MAD`,
      form.notes && `Notes : ${form.notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message,
          source: "sell_or_rent",
          website: honeypot,
          turnstileToken,
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Merci de réessayer.");
    }
    setSending(false);
  }

  return (
    <div>
      <section className="bg-domify-primary-dark py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Vendez ou louez votre bien avec Domify</h1>
          <p className="mt-3 text-white/70">
            Confiez votre maison, villa ou appartement à notre réseau d&apos;agences partenaires et touchez des
            milliers d&apos;acheteurs et de locataires qualifiés.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <Benefit icon={Users} title="Un réseau qualifié" desc="Votre bien est proposé à notre réseau d'agences et d'acheteurs/locataires vérifiés." />
            <Benefit icon={Home} title="Estimation incluse" desc="Notre équipe évalue votre bien gratuitement pour fixer le juste prix." />
            <Benefit icon={ShieldCheck} title="Accompagnement complet" desc="De la mise en ligne à la signature, un conseiller vous accompagne à chaque étape." />
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-luxury">
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="text-domify-gold" size={36} />
                <p className="mt-4 font-display text-lg font-semibold text-domify-dark">Demande envoyée !</p>
                <p className="mt-1 text-sm text-domify-dark/60">
                  Un conseiller Domify vous recontactera sous 48h pour discuter de votre bien.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field — hidden from real users via CSS, bots fill every field they find */}
                <HoneypotField value={honeypot} onChange={setHoneypot} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input required placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                  <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                  <select value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm">
                    <option value="Vente">Je veux vendre</option>
                    <option value="Location">Je veux louer</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm">
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input placeholder="Surface (m²)" value={form.surfaceArea} onChange={(e) => setForm({ ...form, surfaceArea: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                  <input placeholder="Prix souhaité (MAD)" value={form.desiredPrice} onChange={(e) => setForm({ ...form, desiredPrice: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                </div>
                <textarea rows={3} placeholder="Décrivez votre bien (optionnel)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" />
                <Turnstile action="lead" onTokenChange={setTurnstileToken} />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)}
                  className="w-full rounded-xl bg-domify-gold py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
                >
                  {sending ? "Envoi..." : "Soumettre mon bien"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon: Icon, title, desc }: { icon: typeof Home; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
        <Icon size={18} />
      </span>
      <div>
        <p className="font-display text-base font-semibold text-domify-dark">{title}</p>
        <p className="mt-0.5 text-sm text-domify-dark/60">{desc}</p>
      </div>
    </div>
  );
}
