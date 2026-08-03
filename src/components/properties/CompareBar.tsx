"use client";

import Link from "next/link";
import { Scale, X } from "lucide-react";
import { useCompare } from "@/lib/compare-context";

export function CompareBar() {
  const { compareIds, clearCompare } = useCompare();

  if (compareIds.length < 2) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-domify-dark">
          <Scale size={16} className="text-domify-primary" />
          <span className="font-medium">{compareIds.length} bien(s) sélectionné(s) pour comparaison</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearCompare} className="flex items-center gap-1 text-xs font-medium text-domify-dark/50 hover:text-domify-dark">
            <X size={13} /> Effacer
          </button>
          <Link
            href="/comparer"
            className="rounded-full bg-domify-primary px-5 py-2 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-primary-dark"
          >
            Comparer
          </Link>
        </div>
      </div>
    </div>
  );
}
