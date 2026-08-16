"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Search, Heart, User, LogOut, LayoutDashboard, UserCircle, ArrowUpRight, Moon, Sun } from "lucide-react";
import { useFavorites } from "@/lib/favorites-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTheme } from "@/components/ThemeProvider";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/get-dictionary";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { favoriteIds } = useFavorites();
  const { resolvedTheme, toggleTheme } = useTheme();

  const nav = [
    { label: dict.nav.buy, href: "/proprietes?listingType=VENTE" },
    { label: dict.nav.rent, href: "/proprietes?listingType=LOCATION" },
    { label: dict.nav.map, href: "/carte" },
    { label: dict.nav.neighborhoods, href: "/quartiers" },
    { label: dict.nav.agencies, href: "/agences" },
    { label: dict.nav.agents, href: "/agents" },
    { label: dict.nav.blog, href: "/blog" },
  ];

  const isActive = (href: string) => pathname === href.split("?")[0] || pathname.startsWith(`${href.split("?")[0]}/`);
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-domify-dark/8 bg-[#fcfbf8]/92 shadow-[0_12px_36px_-30px_rgba(16,47,66,0.7)] backdrop-blur-xl">
      <div className="hidden bg-domify-primary-dark text-white/70 lg:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-[10px] font-semibold uppercase tracking-[0.16em] sm:px-6 lg:px-8">
          <span>Domify · Immobilier d’exception au Maroc</span>
          <span className="text-domify-soft-gold">Find your perfect place</span>
        </div>
      </div>

      <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group pressable shrink-0 rounded-xl" aria-label="Domify — accueil" onClick={closeMenu}>
          <span className="relative block h-11 w-[126px] overflow-hidden rounded-lg bg-[#132c45] ring-1 ring-domify-gold/35 transition-luxury group-hover:ring-domify-gold">
            <Image src="/brand/domify-logo-horizontal.png" alt="Domify" fill sizes="126px" className="object-contain" priority />
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 xl:flex" aria-label="Navigation principale">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link whitespace-nowrap py-3 text-[13px] font-semibold ${isActive(item.href) ? "text-domify-primary after:scale-x-100" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2.5 xl:flex">
          <LanguageSwitcher current={locale} />
          <button type="button" onClick={toggleTheme} aria-label={resolvedTheme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"} title={resolvedTheme === "dark" ? "Mode clair" : "Mode sombre"} className="pressable rounded-full p-2 text-domify-dark/65 hover:bg-domify-warm-white hover:text-domify-primary">
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/proprietes" aria-label={dict.header.search} className="pressable rounded-full p-2 text-domify-dark/65 hover:bg-domify-warm-white hover:text-domify-primary">
            <Search size={18} />
          </Link>
          <Link href="/favoris" aria-label={dict.header.favorites} className="pressable relative rounded-full p-2 text-domify-dark/65 hover:bg-white hover:text-domify-primary">
            <Heart size={18} />
            {favoriteIds.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-domify-gold text-[9px] font-bold text-white">{favoriteIds.length}</span>}
          </Link>

          {session?.user ? (
            <div className="relative">
              <button onClick={() => setAccountOpen((current) => !current)} className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-domify-primary/12 bg-domify-warm-white text-sm font-bold text-domify-primary shadow-[0_8px_18px_-16px_rgba(16,47,66,0.72)] hover:border-domify-gold/50" aria-label={dict.header.account} aria-expanded={accountOpen}>
                {session.user.name?.[0]?.toUpperCase() ?? <User size={16} />}
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 mt-3 w-60 origin-top-right rounded-2xl border border-domify-dark/8 bg-white/98 p-2 shadow-[0_18px_38px_-22px_rgba(16,47,66,0.38)] backdrop-blur-xl"
                  >
                    <p className="truncate px-3 py-2 text-xs font-medium text-domify-dark/48">{session.user.email}</p>
                    <AccountLink href="/compte" icon={<UserCircle size={14} />} label={dict.header.account} onClick={() => setAccountOpen(false)} />
                    {(session.user.role === "ADMIN" || session.user.role === "EDITOR" || session.user.role === "AGENT") && <AccountLink href="/admin" icon={<LayoutDashboard size={14} />} label={dict.header.dashboard} onClick={() => setAccountOpen(false)} />}
                    <button onClick={() => signOut()} className="pressable flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-domify-dark/80 hover:bg-domify-warm-white"><LogOut size={14} /> {dict.header.logout}</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/connexion" className="pressable flex items-center gap-1.5 rounded-full border border-domify-primary/20 bg-white/70 px-4 py-2.5 text-sm font-semibold text-domify-primary hover:-translate-y-0.5 hover:border-domify-primary hover:bg-domify-primary hover:text-white">
              <User size={16} /> {dict.header.login}
            </Link>
          )}

          <Link href="/vendre-louer" className="pressable inline-flex items-center gap-1.5 rounded-full bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(189,145,74,0.95)] hover:-translate-y-0.5 hover:bg-domify-soft-gold hover:text-domify-primary-dark">
            {dict.header.sellMyHome} <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="flex items-center gap-2.5 xl:hidden">
          <LanguageSwitcher current={locale} />
          <button type="button" onClick={toggleTheme} aria-label={resolvedTheme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"} title={resolvedTheme === "dark" ? "Mode clair" : "Mode sombre"} className="pressable rounded-full p-2 text-domify-dark/70 hover:bg-domify-warm-white hover:text-domify-primary">
            {resolvedTheme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link href="/favoris" aria-label={dict.header.favorites} className="relative rounded-full p-2 text-domify-dark/70"><Heart size={19} />{favoriteIds.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-domify-gold text-[9px] font-bold text-white">{favoriteIds.length}</span>}</Link>
          <button onClick={() => setOpen((current) => !current)} aria-label="Menu" aria-expanded={open} className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-domify-dark/10 bg-white/80 text-domify-dark shadow-[0_10px_18px_-16px_rgba(16,47,66,0.7)]">
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} className="border-t border-domify-dark/10 bg-[#fcfbf8]/98 shadow-[0_18px_30px_-24px_rgba(16,47,66,0.5)] backdrop-blur-xl xl:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <nav className="grid gap-1 sm:grid-cols-2" aria-label="Navigation mobile">
                {nav.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-3 py-3 text-sm font-semibold transition-luxury hover:bg-white hover:text-domify-primary ${isActive(item.href) ? "bg-white text-domify-primary" : "text-domify-dark/80"}`} onClick={closeMenu}>{item.label}</Link>)}
                <Link href="/favoris" className="rounded-xl px-3 py-3 text-sm font-semibold text-domify-dark/80 transition-luxury hover:bg-white hover:text-domify-primary" onClick={closeMenu}>{dict.header.favorites} ({favoriteIds.length})</Link>
                {session?.user ? <>
                  <Link href="/compte" className="rounded-xl px-3 py-3 text-sm font-semibold text-domify-dark/80 transition-luxury hover:bg-white hover:text-domify-primary" onClick={closeMenu}>{dict.header.account}</Link>
                  {(session.user.role === "ADMIN" || session.user.role === "EDITOR" || session.user.role === "AGENT") && <Link href="/admin" className="rounded-xl px-3 py-3 text-sm font-semibold text-domify-dark/80 transition-luxury hover:bg-white hover:text-domify-primary" onClick={closeMenu}>{dict.header.dashboard}</Link>}
                  <button onClick={() => signOut()} className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-domify-dark/80 hover:bg-white">{dict.header.logout}</button>
                </> : <Link href="/connexion" className="pressable flex items-center justify-center gap-1.5 rounded-xl border border-domify-primary/30 px-4 py-3 text-center text-sm font-semibold text-domify-primary hover:bg-white" onClick={closeMenu}><User size={16} /> {dict.header.login}</Link>}
                <Link href="/vendre-louer" className="pressable mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-domify-gold px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_24px_-16px_rgba(189,145,74,0.9)]" onClick={closeMenu}>{dict.header.sellMyHome} <ArrowUpRight size={14} /></Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function AccountLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-domify-dark/80 transition-luxury hover:bg-domify-warm-white"><span className="text-domify-primary">{icon}</span>{label}</Link>;
}
