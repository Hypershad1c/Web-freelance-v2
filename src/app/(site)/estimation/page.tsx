"use client";

import { useState } from "react";
import { CheckCircle2, TrendingUp, ShieldCheck, Clock } from "lucide-react";

const PROPERTY_TYPES = ["Appartement", "Villa", "Duplex", "Terrain", "Riad", "Bureau"];

export default function EstimationPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: PROPERTY_TYPES[0],
    city: "",
    surfaceArea: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    const message = [
      `Demande d'estimation — ${form.propertyType}`,
      form.city && `Ville : ${form.city}`,
      form.surfaceArea && `Surface : ${form.surfaceArea} m²`,
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
          source: "estimation",
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
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Estimez la valeur de votre bien</h1>
          <p className="mt-3 text-white/70">
            Obtenez une estimation gratuite et personnalisée par l&apos;un de nos experts, sous 48h.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <Benefit icon={TrendingUp} title="Estimation précise" desc="Basée sur les transactions récentes et la connaissance fine du marché local." />
            <Benefit icon={ShieldCheck} title="Sans engagement" desc="Une estimation gratuite, sans obligation de vendre ou de louer avec Domify." />
            <Benefit icon={Clock} title="Réponse rapide" desc="Un de nos experts vous recontacte sous 48h avec votre estimation détaillée." />
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-luxury">
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="text-domify-gold" size={36} />
                <p className="mt-4 font-display text-lg font-semibold text-domify-dark">Demande envoyée !</p>
                <p className="mt-1 text-sm text-domify-dark/60">
                  Un expert Domify vous recontactera sous 48h avec votre estimation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input required placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                  <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                  <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm">
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                  <input placeholder="Surface (m²)" value={form.surfaceArea} onChange={(e) => setForm({ ...form, surfaceArea: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                </div>
                <textarea rows={3} placeholder="Détails complémentaires (optionnel)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-domify-gold py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
                >
                  {sending ? "Envoi..." : "Obtenir mon estimation gratuite"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Benefit({ icon: Icon, title, desc }: { icon: typeof TrendingUp; title: string; desc: string }) {
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
