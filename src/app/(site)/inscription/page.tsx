"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Turnstile } from "@/components/Turnstile";
import { sanitizeCallbackUrl } from "@/lib/safe-redirect";

export default function InscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, turnstileToken }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Impossible de créer le compte.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Créer un compte</h1>
      <p className="mt-2 text-sm text-domify-dark/60">Sauvegardez vos favoris et suivez vos demandes en un seul endroit.</p>

      <div className="mt-8">
          <GoogleSignInButton callbackUrl={callbackUrl} />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-domify-dark/40">
        <div className="h-px flex-1 bg-black/10" />
        ou avec votre email
        <div className="h-px flex-1 bg-black/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Nom complet"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        <input
          placeholder="Téléphone (optionnel)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        <input
          required
          type="password"
          placeholder="Mot de passe (8 caractères min.)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        <Turnstile action="registration" onTokenChange={setTurnstileToken} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)}
          className="w-full rounded-xl bg-domify-gold py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-domify-dark/60">
        Déjà inscrit ?{" "}
                  <Link href={callbackUrl === "/" ? "/connexion" : `/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-domify-primary hover:text-domify-gold">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
