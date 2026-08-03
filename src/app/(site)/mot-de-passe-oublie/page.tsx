"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Intentionally silent — we always show the same success state either way,
      // to avoid leaking whether an account exists for this email.
    }
    setSending(false);
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-domify-dark/60">
        Entrez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>

      {sent ? (
        <div className="mt-8 rounded-2xl bg-domify-warm-white p-6 text-center">
          <CheckCircle2 className="mx-auto text-domify-gold" size={32} />
          <p className="mt-3 text-sm text-domify-dark">
            Si un compte existe pour cet email, un lien de réinitialisation vient d&apos;être envoyé.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-domify-dark/30" size={16} />
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/10 py-3 pl-11 pr-4 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-domify-primary py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-primary-dark disabled:opacity-60"
          >
            {sending ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-domify-dark/60">
        <Link href="/connexion" className="font-semibold text-domify-primary hover:text-domify-gold">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
