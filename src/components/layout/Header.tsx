"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Search, Heart, User, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { useFavorites } from "@/lib/favorites-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/get-dictionary";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { data: session } = useSession();
  const { favoriteIds } = useFavorites();

  const NAV = [
    { label: dict.nav.buy, href: "/proprietes?listingType=VENTE" },
    { label: dict.nav.rent, href: "/proprietes?listingType=LOCATION" },
    { label: dict.nav.map, href: "/carte" },
    { label: dict.nav.neighborhoods, href: "/quartiers" },
    { label: dict.nav.agencies, href: "/agences" },
    { label: dict.nav.blog, href: "/blog" },
    { label: dict.nav.about, href: "/a-propos" },
    { label: dict.nav.contact, href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-domify-dark/10 bg-[#fcfbf8]/88 shadow-[0_8px_30px_-26px_rgba(16,47,66,0.65)] backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group pressable flex items-center gap-2.5 rounded-full">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-domify-gold/35 transition-luxury group-hover:ring-domify-gold">
            <Image src="/Logo.jpeg" alt="Domify" fill className="object-cover" />
          </span>
          <span className="font-display text-lg font-semibold tracking-[0.16em] text-domify-dark">
            DOMIFY
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link py-3 text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <LanguageSwitcher current={locale} />
          <button aria-label={dict.header.search} className="pressable rounded-full p-1 text-domify-dark/70 hover:text-domify-primary">
            <Search size={19} />
          </button>
          <Link href="/favoris" aria-label={dict.header.favorites} className="pressable relative rounded-full p-1 text-domify-dark/70 hover:text-domify-primary">
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
                className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-domify-primary/10 bg-domify-warm-white text-domify-primary shadow-[0_8px_18px_-16px_rgba(16,47,66,0.72)] hover:border-domify-gold/40"
                aria-label={dict.header.account}
              >
                {session.user.name?.[0]?.toUpperCase() ?? <User size={16} />}
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-domify-dark/8 bg-white/96 p-2 shadow-[0_18px_38px_-22px_rgba(16,47,66,0.38)] backdrop-blur-xl"
                  >
                    <p className="truncate px-3 py-2 text-xs font-medium text-domify-dark/48">{session.user.email}</p>
                    <Link
                      href="/compte"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-domify-dark/80 transition-luxury hover:bg-domify-warm-white"
                    >
                      <UserCircle size={14} /> {dict.header.account}
                    </Link>
                    {(session.user.role === "ADMIN" || session.user.role === "EDITOR" || session.user.role === "AGENT") && (
                      <Link
                        href="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-domify-dark/80 transition-luxury hover:bg-domify-warm-white"
                      >
                        <LayoutDashboard size={14} /> {dict.header.dashboard}
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="pressable flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-domify-dark/80 hover:bg-domify-warm-white"
                    >
                      <LogOut size={14} /> {dict.header.logout}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/connexion"
              className="pressable flex items-center gap-1.5 rounded-full border border-domify-primary/20 bg-white/65 px-4 py-2 text-sm font-semibold text-domify-primary hover:-translate-y-0.5 hover:border-domify-primary hover:bg-domify-primary hover:text-white"
            >
              <User size={16} /> {dict.header.login}
            </Link>
          )}

          <Link
            href="/vendre-louer"
            className="pressable rounded-full bg-domify-gold px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(189,145,74,0.95)] hover:-translate-y-0.5 hover:bg-domify-soft-gold hover:text-domify-primary-dark"
          >
            {dict.header.sellMyHome}
          </Link>
        </div>

        <div className="flex items-center gap-2.5 xl:hidden">
          <LanguageSwitcher current={locale} />
          <button onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-domify-dark/10 bg-white/80 text-domify-dark shadow-[0_10px_18px_-16px_rgba(16,47,66,0.7)]">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="border-t border-domify-dark/10 bg-[#fcfbf8]/98 shadow-[0_18px_30px_-24px_rgba(16,47,66,0.5)] backdrop-blur-xl xl:hidden"
          >
            <div className="px-4 py-4">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl px-3 py-3 text-sm font-medium text-domify-dark/80 transition-luxury hover:bg-white hover:text-domify-primary" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/favoris" className="rounded-xl px-3 py-3 text-sm font-medium text-domify-dark/80 transition-luxury hover:bg-white hover:text-domify-primary" onClick={() => setOpen(false)}>
              {dict.header.favorites} ({favoriteIds.length})
            </Link>
            {session?.user ? (
              <>
                <Link href="/compte" className="rounded-xl px-3 py-3 text-sm font-medium text-domify-dark/80 transition-luxury hover:bg-white hover:text-domify-primary" onClick={() => setOpen(false)}>
                  {dict.header.account}
                </Link>
                {(session.user.role === "ADMIN" || session.user.role === "EDITOR" || session.user.role === "AGENT") && (
                  <Link href="/admin" className="rounded-xl px-3 py-3 text-sm font-medium text-domify-dark/80 transition-luxury hover:bg-white hover:text-domify-primary" onClick={() => setOpen(false)}>
                    {dict.header.dashboard}
                  </Link>
                )}
                <button onClick={() => signOut()} className="text-left text-sm font-medium text-domify-dark/80">
                  {dict.header.logout}
                </button>
              </>
            ) : (
              <Link
                href="/connexion"
                className="pressable flex items-center justify-center gap-1.5 rounded-xl border border-domify-primary/30 px-4 py-3 text-center text-sm font-semibold text-domify-primary hover:bg-white"
                onClick={() => setOpen(false)}
              >
                <User size={16} /> {dict.header.login}
              </Link>
            )}
            <Link
              href="/vendre-louer"
              className="pressable mt-3 rounded-xl bg-domify-gold px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(189,145,74,0.9)]"
              onClick={() => setOpen(false)}
            >
              {dict.header.sellMyHome}
            </Link>
          </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
