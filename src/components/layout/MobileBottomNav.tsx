"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Map, PlusCircle, UserRound } from "lucide-react";

const items = [
  { href: "/proprietes", label: "Acheter", icon: Home },
  { href: "/carte", label: "Carte", icon: Map },
  { href: "/vendre-louer", label: "Déposer", icon: PlusCircle, accent: true },
  { href: "/favoris", label: "Favoris", icon: Heart },
  { href: "/compte", label: "Compte", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation mobile" className="pwa-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-domify-dark/10 bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-2 pb-1 pt-2 shadow-[0_-18px_40px_-30px_rgba(16,47,66,0.7)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {items.map(({ href, label, icon: Icon, accent }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={`pressable flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.62rem] font-semibold transition-colors ${accent ? "-mt-5 bg-domify-gold text-white shadow-luxury" : active ? "bg-domify-primary text-white" : "text-domify-dark/55 hover:bg-domify-warm-white hover:text-domify-primary"}`}><Icon size={17} /><span>{label}</span></Link>;
        })}
      </div>
    </nav>
  );
}
