"use client";

import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/lib/favorites-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </SessionProvider>
  );
}
