"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type CompareContextValue = {
  compareIds: string[];
  isComparing: (propertyId: string) => boolean;
  toggleCompare: (propertyId: string) => void;
  clearCompare: () => void;
  maxReached: boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);
const STORAGE_KEY = "domify_compare";
const MAX_COMPARE = 4;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setCompareIds(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds, hydrated]);

  const toggleCompare = useCallback((propertyId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(propertyId)) return prev.filter((id) => id !== propertyId);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, propertyId];
    });
  }, []);

  const isComparing = useCallback((propertyId: string) => compareIds.includes(propertyId), [compareIds]);
  const clearCompare = useCallback(() => setCompareIds([]), []);

  return (
    <CompareContext.Provider
      value={{ compareIds, isComparing, toggleCompare, clearCompare, maxReached: compareIds.length >= MAX_COMPARE }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within a CompareProvider");
  return ctx;
}
