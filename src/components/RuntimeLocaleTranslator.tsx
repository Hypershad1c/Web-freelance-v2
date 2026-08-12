"use client";

import { useEffect } from "react";
import translations from "@/i18n/runtime-translations.json";
import type { Locale } from "@/i18n/locales";

type Translation = { en: string; ar: string };
const translationMap = translations as Record<string, Translation>;

export function RuntimeLocaleTranslator({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (locale === "fr") return;
    const language = locale === "ar" ? "ar" : "en";
    const lookup = (value: string) => translationMap[value]?.[language];

    function translateText(textNode: Text) {
      const parent = textNode.parentElement;
      if (!parent || parent.closest("script, style, code, pre, [data-no-runtime-translation], input, textarea")) return;
      const raw = textNode.textContent ?? "";
      const trimmed = raw.trim();
      const translated = lookup(trimmed);
      if (!translated) return;
      const leading = raw.match(/^\s*/)?.[0] ?? "";
      const trailing = raw.match(/\s*$/)?.[0] ?? "";
      textNode.textContent = `${leading}${translated}${trailing}`;
    }

    function translateElement(element: Element) {
      const attributeTargets = [
        ...(element instanceof HTMLElement ? [element] : []),
        ...Array.from(element.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]")),
      ];
      for (const target of attributeTargets) {
        for (const attribute of ["placeholder", "aria-label", "title"] as const) {
          const raw = target.getAttribute(attribute);
          if (!raw) continue;
          const translated = lookup(raw.trim());
          if (translated) target.setAttribute(attribute, translated);
        }
      }
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) translateText(node as Text);
    }

    translateElement(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
          if (node.nodeType === Node.ELEMENT_NODE) translateElement(node as Element);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}
