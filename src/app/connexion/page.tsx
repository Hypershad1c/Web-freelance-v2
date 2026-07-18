"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConnexionPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { ...form, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Connexion</h1>
      <p className="mt-2 text-sm text-domify-dark/60">Accédez à vos favoris, rendez-vous et demandes en cours.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        <input
          required
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-domify-primary py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-primary-dark disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-domify-dark/60">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-domify-primary hover:text-domify-gold">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
