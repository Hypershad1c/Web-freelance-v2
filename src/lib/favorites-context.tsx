"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { recordClientAnalyticsEvent } from "@/lib/client-analytics";

export type FavoriteCollectionSummary = { id: string; name: string; color?: string | null; _count?: { favorites: number } };

type FavoritesContextValue = {
  favoriteIds: string[];
  collections: FavoriteCollectionSummary[];
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<void>;
  createCollection: (name: string, propertyId?: string) => Promise<FavoriteCollectionSummary | null>;
  moveFavoriteToCollection: (propertyId: string, collectionId: string | null) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "domify_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<FavoriteCollectionSummary[]>([]);

  useEffect(() => {
    if (status === "authenticated") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setFavoriteIds(JSON.parse(stored));
    } catch {
      // Ignore malformed guest storage.
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([fetch("/api/favorites"), fetch("/api/favorite-collections")])
      .then(async ([favoritesResponse, collectionsResponse]) => {
        const favorites = (await favoritesResponse.json()) as { propertyId: string }[];
        const collectionData = (await collectionsResponse.json()) as { collections?: FavoriteCollectionSummary[] };
        setFavoriteIds(favorites.map((favorite) => favorite.propertyId));
        setCollections(collectionData.collections ?? []);
      })
      .catch(() => {
        // API/DB not reachable — preserve optimistic client behavior.
      });
  }, [status]);

  const toggleFavorite = useCallback(async (propertyId: string) => {
    const isCurrentlyFavorite = favoriteIds.includes(propertyId);
    const next = isCurrentlyFavorite ? favoriteIds.filter((id) => id !== propertyId) : [...favoriteIds, propertyId];
    setFavoriteIds(next);
    if (!isCurrentlyFavorite) recordClientAnalyticsEvent("favorite", { propertyId, meta: { action: "add" } });

    if (status === "authenticated") {
      try {
        await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId }) });
      } catch {
        // Keep the optimistic state; a later refresh reconciles it.
      }
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, [favoriteIds, status]);

  const createCollection = useCallback(async (name: string, propertyId?: string) => {
    if (status !== "authenticated") return null;
    const response = await fetch("/api/favorite-collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, propertyId }) });
    if (!response.ok) return null;
    const collection = (await response.json()) as FavoriteCollectionSummary;
    setCollections((current) => [collection, ...current]);
    return collection;
  }, [status]);

  const moveFavoriteToCollection = useCallback(async (propertyId: string, collectionId: string | null) => {
    if (status !== "authenticated") return;
    await fetch("/api/favorite-collections", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId, collectionId }) });
  }, [status]);

  const isFavorite = useCallback((propertyId: string) => favoriteIds.includes(propertyId), [favoriteIds]);

  void session;
  return <FavoritesContext.Provider value={{ favoriteIds, collections, isFavorite, toggleFavorite, createCollection, moveFavoriteToCollection }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
