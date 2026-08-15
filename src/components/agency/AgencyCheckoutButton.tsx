"use client";

import { useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";

export function AgencyCheckoutButton({ plan, featured = false }: { plan: "STARTER" | "PRO" | "PREMIUM"; featured?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/paytabs/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const data = await response.json();
      if (response.status === 401) {
        window.location.href = `/connexion?callbackUrl=${encodeURIComponent(`/tarifs?plan=${plan}`)}`;
        return;
      }
      if (!response.ok) throw new Error(data.error || "Le paiement en ligne n’est pas disponible.");
      if (!data.redirectUrl) throw new Error("La page de paiement n’a pas pu être créée.");
      window.location.href = data.redirectUrl;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de démarrer le paiement.");
      setLoading(false);
    }
  }

  return <div><button type="button" onClick={() => void startCheckout()} disabled={loading} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${featured ? "bg-domify-gold text-white hover:bg-domify-soft-gold hover:text-domify-primary-dark" : "bg-domify-warm-white text-domify-primary hover:bg-domify-gold/10"}`}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <LockKeyhole size={15} />} {loading ? "Ouverture du paiement…" : "Commencer l’abonnement"}</button>{error && <p role="alert" className="mt-2 text-xs leading-5 text-red-700">{error}</p>}</div>;
}
