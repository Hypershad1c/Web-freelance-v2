"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type FavoritesContextValue = {
  favoriteIds: string[];
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const STORAGE_KEY = "domify_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Load from localStorage on mount (guest favorites)
  useEffect(() => {
    if (status === "authenticated") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setFavoriteIds(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    }
  }, [status]);

  // Load from the API once authenticated
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data: { propertyId: string }[]) => setFavoriteIds(data.map((f) => f.propertyId)))
      .catch(() => {
        // API/DB not reachable in this environment — favorites simply won't persist.
      });
  }, [status]);

  const toggleFavorite = useCallback(
    async (propertyId: string) => {
      const isCurrentlyFavorite = favoriteIds.includes(propertyId);
      const next = isCurrentlyFavorite
        ? favoriteIds.filter((id) => id !== propertyId)
        : [...favoriteIds, propertyId];
      setFavoriteIds(next);

      if (status === "authenticated") {
        try {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId }),
          });
        } catch {
          // best-effort; local state already updated optimistically
        }
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    },
    [favoriteIds, status]
  );

  const isFavorite = useCallback((propertyId: string) => favoriteIds.includes(propertyId), [favoriteIds]);

  // Bind session var so it's referenced (avoids unused warning if extended later)
  void session;

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
