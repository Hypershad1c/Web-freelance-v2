"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Merci de réessayer.");
    }
    setSending(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-domify-dark sm:text-4xl">Contactez-nous</h1>
        <p className="mt-2 text-domify-dark/60">Une question, un projet ? Notre équipe vous répond rapidement.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ContactInfo icon={Phone} label="Téléphone" value="+212 6 00 00 00 00" />
          <ContactInfo icon={Mail} label="Email" value="contact@domify.ma" />
          <ContactInfo icon={MapPin} label="Adresse" value="123, Bd Mohammed V, Casablanca, Maroc" />
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-luxury">
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="text-domify-gold" size={36} />
              <p className="mt-4 font-display text-lg font-semibold text-domify-dark">Message envoyé !</p>
              <p className="mt-1 text-sm text-domify-dark/60">Nous vous répondrons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input required placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
                <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-black/10 px-4 py-3 text-sm" />
              </div>
              <input placeholder="Sujet" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" />
              <textarea required rows={5} placeholder="Votre message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="rounded-xl bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
              >
                {sending ? "Envoi..." : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactInfo({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-sm font-medium text-domify-dark">{label}</p>
        <p className="text-sm text-domify-dark/60">{value}</p>
      </div>
    </div>
  );
}
