"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(232,203,145,0.22),transparent_20rem),#fcfbf8] px-6 text-[#152d3b]">
        <main className="max-w-md rounded-[1.8rem] border border-black/5 bg-white/90 p-8 text-center shadow-[0_28px_70px_-42px_rgba(16,47,66,0.6)] backdrop-blur sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8ead0] text-[#a77421]"><ShieldAlert size={23} /></span>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#bd914a]">Domify</p>
          <h1 className="mt-4 font-serif text-3xl font-semibold">Une erreur inattendue est survenue</h1>
          <p className="mt-3 text-sm leading-6 text-[#60717a]">Notre équipe a été prévenue. Vous pouvez réessayer ou revenir à l&apos;accueil.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-[#1d536d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#153f54] active:scale-[0.97]"><RefreshCw size={15} /> Réessayer</button>
            <Link href="/" className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-[#152d3b]">Accueil</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
