"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error?.password?.[0] || data.error || "Une erreur est survenue.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/connexion"), 2000);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-domify-dark/60">Choisissez un nouveau mot de passe pour votre compte.</p>

      {done ? (
        <p className="mt-8 rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark/70">
          Mot de passe mis à jour. Redirection vers la connexion...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            required
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-domify-primary py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-primary-dark disabled:opacity-60"
          >
            {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
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
