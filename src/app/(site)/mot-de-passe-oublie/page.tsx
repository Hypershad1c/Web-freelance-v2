"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    // Always show the same confirmation, regardless of whether the account
    // exists — the API deliberately never reveals that either.
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-domify-dark/60">
        Indiquez votre email, nous vous enverrons un lien de réinitialisation.
      </p>

      {sent ? (
        <p className="mt-8 rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark/70">
          Si un compte existe avec cette adresse, un email vient de vous être envoyé avec les instructions.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-domify-primary py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-primary-dark disabled:opacity-60"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-domify-dark/60">
        <Link href="/connexion" className="font-semibold text-domify-primary hover:text-domify-gold">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
