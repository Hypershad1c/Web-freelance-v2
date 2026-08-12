"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { saveConsent, readConsent, type ConsentChoice } from "@/lib/consent";

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);

  useEffect(() => setChoice(readConsent()), []);
  if (choice) return null;

  function choose(next: ConsentChoice) {
    saveConsent(next);
    setChoice(next);
  }

  return (
    <section className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white p-5 shadow-2xl sm:bottom-6 sm:flex sm:items-center sm:gap-6 sm:p-6" role="dialog" aria-label="Préférences de confidentialité">
      <div className="flex-1">
        <p className="font-display text-lg font-semibold text-domify-dark">Votre confidentialité compte</p>
        <p className="mt-1.5 text-sm leading-6 text-domify-dark/65">Nous utilisons des cookies nécessaires au fonctionnement du site. Avec votre accord, nous mesurons également les visites afin d&apos;améliorer Domify. Consultez notre <Link href="/politique-de-confidentialite" className="font-semibold text-domify-primary underline underline-offset-2">politique de confidentialité</Link>.</p>
      </div>
      <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0 sm:flex-col">
        <button type="button" onClick={() => choose("accepted")} className="rounded-xl bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white transition-luxury hover:bg-domify-primary-dark">Accepter</button>
        <button type="button" onClick={() => choose("rejected")} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-domify-dark/70 transition-luxury hover:bg-domify-warm-white">Refuser</button>
      </div>
    </section>
  );
}
