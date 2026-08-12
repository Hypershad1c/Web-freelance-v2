"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";

export function SellRentFloatingButton() {
  const pathname = usePathname();

  // Don't show it ON the page it links to, or floating over the admin back-office.
  if (pathname === "/vendre-louer" || pathname.startsWith("/admin")) return null;

  return (
    <Link
      href="/vendre-louer"
      className="sell-rent-floating fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-domify-gold px-4 py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark hover:shadow-luxury-hover sm:right-6"
    >
      <Home size={16} />
      <span className="hidden sm:inline">Vendre / Louer mon bien</span>
      <span className="sm:hidden">Vendre / Louer</span>
    </Link>
  );
}
