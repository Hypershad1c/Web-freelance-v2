"use client";

import { useState, useTransition } from "react";
import { Globe2 } from "lucide-react";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/locales";
import { setLocale } from "@/lib/actions/locale";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSelect(locale: Locale) {
    setOpen(false);
    startTransition(() => {
      setLocale(locale);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={pending}
        className="flex items-center gap-1.5 text-sm font-medium text-domify-dark/70 hover:text-domify-primary disabled:opacity-50"
        aria-label="Changer de langue"
      >
        <Globe2 size={16} />
        <span className="uppercase">{current}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white p-1.5 shadow-luxury">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              onClick={() => handleSelect(locale)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-luxury hover:bg-domify-warm-white ${
                locale === current ? "font-semibold text-domify-primary" : "text-domify-dark/80"
              }`}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
