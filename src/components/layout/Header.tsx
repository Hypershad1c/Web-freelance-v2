"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Search, Building2, Heart, User, LogOut } from "lucide-react";
import { useFavorites } from "@/lib/favorites-context";

const NAV = [
  { label: "Acheter", href: "/proprietes?type=vente" },
  { label: "Louer", href: "/proprietes?type=location" },
  { label: "Projets", href: "/projets" },
  { label: "Agences", href: "/agences" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session } = useSession();
  const { favoriteIds } = useFavorites();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-domify-primary text-white">
            <Building2 size={18} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-domify-dark">
            DOMIFY
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-domify-dark/80 transition-luxury hover:text-domify-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <button aria-label="Rechercher" className="text-domify-dark/70 hover:text-domify-primary transition-luxury">
            <Search size={19} />
          </button>
          <Link href="/favoris" aria-label="Favoris" className="relative text-domify-dark/70 hover:text-domify-primary transition-luxury">
            <Heart size={19} />
            {favoriteIds.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-domify-gold text-[10px] font-bold text-white">
                {favoriteIds.length}
              </span>
            )}
          </Link>

          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-domify-warm-white text-domify-primary"
                aria-label="Mon compte"
              >
                {session.user.name?.[0]?.toUpperCase() ?? <User size={16} />}
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-2 shadow-luxury">
                  <p className="truncate px-3 py-2 text-xs text-domify-dark/50">{session.user.email}</p>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-domify-dark/80 hover:bg-domify-warm-white"
                  >
                    <LogOut size={14} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/connexion" aria-label="Mon compte" className="text-domify-dark/70 hover:text-domify-primary transition-luxury">
              <User size={19} />
            </Link>
          )}

          <Link
            href="/estimation"
            className="rounded-full bg-domify-gold px-5 py-2.5 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark"
          >
            Estimer mon bien
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-domify-dark/80" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/favoris" className="text-sm font-medium text-domify-dark/80" onClick={() => setOpen(false)}>
              Favoris ({favoriteIds.length})
            </Link>
            {session?.user ? (
              <button onClick={() => signOut()} className="text-left text-sm font-medium text-domify-dark/80">
                Se déconnecter
              </button>
            ) : (
              <Link href="/connexion" className="text-sm font-medium text-domify-dark/80" onClick={() => setOpen(false)}>
                Connexion
              </Link>
            )}
            <Link
              href="/estimation"
              className="mt-2 rounded-full bg-domify-gold px-5 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Estimer mon bien
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
