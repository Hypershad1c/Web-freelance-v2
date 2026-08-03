"use client";

import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/lib/favorites-context";
import { CompareProvider } from "@/lib/compare-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FavoritesProvider>
        <CompareProvider>{children}</CompareProvider>
      </FavoritesProvider>
    </SessionProvider>
  );
}
