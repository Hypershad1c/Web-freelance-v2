"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { Turnstile } from "@/components/Turnstile";

const PLANS = ["Starter", "Pro", "Premium", "Entreprise"] as const;

export function AgencyPlanInterestForm() {
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("Pro");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), email: data.get("email"), subject: `Intérêt agence — Offre ${plan}`, body: `Agence : ${data.get("agencyName")}\nTéléphone : ${data.get("phone") || "Non renseigné"}\nOffre souhaitée : ${plan}\nMessage : ${data.get("body")}`, turnstileToken }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Impossible d’envoyer votre demande.");
      setStatus("sent");
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible d’envoyer votre demande.");
      setStatus("error");
    }
  }

  if (status === "sent") return <div className="rounded-2xl bg-emerald-50 p-6 text-emerald-900"><CheckCircle2 size={22} className="text-emerald-600" /><h3 className="mt-3 font-display text-2xl font-semibold">Votre demande est bien reçue.</h3><p className="mt-2 text-sm leading-6 text-emerald-800/75">Un conseiller Domify vous contactera pour présenter les offres, les limites et les prochaines étapes.</p><button type="button" onClick={() => setStatus("idle")} className="mt-4 text-sm font-semibold text-emerald-700 underline underline-offset-4">Envoyer une autre demande</button></div>;

  return <form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><input name="name" required minLength={2} placeholder="Votre nom" className="domify-select" /><input name="agencyName" required minLength={2} placeholder="Nom de l’agence" className="domify-select" /><input name="email" required type="email" placeholder="Email professionnel" className="domify-select" /><input name="phone" type="tel" placeholder="Téléphone" className="domify-select" /></div><div><p className="mb-2 text-sm font-semibold text-domify-dark">Offre souhaitée</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{PLANS.map((item) => <button type="button" key={item} onClick={() => setPlan(item)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${plan === item ? "border-domify-gold bg-domify-gold/10 text-domify-primary" : "border-domify-dark/10 text-domify-dark/60 hover:border-domify-gold/40"}`}>{item}</button>)}</div></div><textarea name="body" rows={4} placeholder="Parlez-nous de votre portefeuille et de vos objectifs" className="domify-select resize-none" /><Turnstile action="contact" onTokenChange={setTurnstileToken} />{status === "error" && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button disabled={status === "sending"} className="pressable inline-flex w-full items-center justify-center gap-2 rounded-xl bg-domify-primary px-5 py-3 text-sm font-semibold text-white hover:bg-domify-primary-dark disabled:opacity-50">{status === "sending" ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />} Demander une présentation</button></form>;
}
