"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
      setDone(true);
      setTimeout(() => router.push("/connexion"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
    setSending(false);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-domify-dark/60">Choisissez un nouveau mot de passe pour votre compte.</p>

      {done ? (
        <div className="mt-8 rounded-2xl bg-domify-warm-white p-6 text-center">
          <CheckCircle2 className="mx-auto text-domify-gold" size={32} />
          <p className="mt-3 text-sm text-domify-dark">Mot de passe mis à jour ! Redirection vers la connexion...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            required
            type="password"
            placeholder="Nouveau mot de passe (8 caractères min.)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-domify-primary py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-primary-dark disabled:opacity-60"
          >
            {sending ? "Enregistrement..." : "Réinitialiser mon mot de passe"}
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
