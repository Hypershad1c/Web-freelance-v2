"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-[#fcfbf8] px-6 text-[#152d3b]">
        <main className="max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#bd914a]">Domify</p>
          <h1 className="mt-4 font-serif text-3xl font-semibold">Une erreur inattendue est survenue</h1>
          <p className="mt-3 text-sm leading-6 text-[#60717a]">Notre équipe a été prévenue. Vous pouvez réessayer ou revenir à l&apos;accueil.</p>
          <div className="mt-7 flex justify-center gap-3">
            <button type="button" onClick={reset} className="rounded-xl bg-[#1d536d] px-4 py-2.5 text-sm font-semibold text-white">Réessayer</button>
            <Link href="/" className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-[#152d3b]">Accueil</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
