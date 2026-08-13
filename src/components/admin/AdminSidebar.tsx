"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  UserCog,
  Image as ImageIcon,
  Newspaper,
  MessageSquareQuote,
  CalendarClock,
  Inbox,
  Mail,
  Search,
  BarChart3,
  Settings,
  Tag,
  Sparkles,
  ShieldCheck,
  ClipboardCheck,
  ScrollText,
  ArrowLeft,
  Menu,
  X,
  Handshake,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };
type NavSection = { title: string; items: NavItem[] };
export type Role = "ADMIN" | "EDITOR" | "AGENT" | "USER";

const STAFF_SECTIONS: NavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [{ label: "Tableau de bord", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Propriétés", href: "/admin/properties", icon: Building2 },
      { label: "Villes", href: "/admin/cities", icon: MapPin },
      { label: "Quartiers", href: "/admin/neighborhoods", icon: MapPin },
      { label: "Types de biens", href: "/admin/property-types", icon: Tag },
      { label: "Équipements", href: "/admin/amenities", icon: Sparkles },
      { label: "Médiathèque", href: "/admin/media", icon: ImageIcon },
    ],
  },
  {
    title: "Réseau",
    items: [
      { label: "Agences", href: "/admin/agencies", icon: Building2 },
      { label: "Agents", href: "/admin/agents", icon: UserCog },
      { label: "Performance des agents", href: "/admin/agent-performance", icon: BarChart3 },
      { label: "Utilisateurs", href: "/admin/users", icon: Users },
      { label: "Rôles & permissions", href: "/admin/roles", icon: ShieldCheck },
    ],
  },
  {
    title: "Contenu",
    items: [
      { label: "Blog", href: "/admin/blog", icon: Newspaper },
      { label: "Témoignages", href: "/admin/testimonials", icon: MessageSquareQuote },
    ],
  },
  {
    title: "Activité",
    items: [
      { label: "CRM", href: "/admin/crm", icon: Handshake },
      { label: "Opérations CRM", href: "/admin/crm/operations", icon: SlidersHorizontal },
      { label: "Rendez-vous", href: "/admin/appointments", icon: CalendarClock },
      { label: "Leads", href: "/admin/leads", icon: Inbox },
      { label: "Validations", href: "/admin/approvals", icon: ClipboardCheck },
      { label: "Messages", href: "/admin/messages", icon: Mail },
    ],
  },
  {
    title: "Système",
    items: [
      { label: "SEO", href: "/admin/seo", icon: Search },
      { label: "Analytique", href: "/admin/analytics", icon: BarChart3 },
      { label: "Journal d’audit", href: "/admin/audit-log", icon: ScrollText },
      { label: "Paramètres", href: "/admin/settings", icon: Settings },
    ],
  },
];

const EDITOR_HIDDEN_HREFS = new Set(["/admin/users", "/admin/roles", "/admin/approvals", "/admin/audit-log", "/admin/agent-performance"]);
const ADMIN_ONLY_SECTIONS = new Set(["Système"]);

const AGENT_SECTIONS: NavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [{ label: "Mon tableau de bord", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Mon activité",
    items: [
      { label: "Mes propriétés", href: "/admin/properties", icon: Building2 },
      { label: "Mon CRM", href: "/admin/crm", icon: Handshake },
      { label: "Mes rendez-vous", href: "/admin/appointments", icon: CalendarClock },
      { label: "Mes leads", href: "/admin/leads", icon: Inbox },
    ],
  },
];

function getSections(role: Role): NavSection[] {
  if (role === "AGENT") return AGENT_SECTIONS;

  return STAFF_SECTIONS.filter((section) => role === "ADMIN" || !ADMIN_ONLY_SECTIONS.has(section.title))
    .map((section) => ({
      ...section,
      items: role === "ADMIN" ? section.items : section.items.filter((item) => !EDITOR_HIDDEN_HREFS.has(item.href)),
    }))
    .filter((section) => section.items.length > 0);
}

function SidebarBrand() {
  return (
    <div className="relative flex h-24 items-center gap-3 overflow-hidden border-b border-white/10 px-6">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full border border-domify-soft-gold/20" />
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-domify-gold text-white shadow-[0_10px_24px_-14px_rgba(232,203,145,0.95)]">
        <Building2 size={18} />
      </span>
      <div className="relative min-w-0">
        <p className="font-display text-lg font-semibold tracking-wide text-white">Domify Admin</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/44">Back office</p>
      </div>
    </div>
  );
}

function SidebarNav({ sections, pathname, onNavigate }: { sections: NavSection[]; pathname: string; onNavigate?: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">{section.title}</p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-luxury focus-visible:outline-white",
                    active ? "bg-white/[0.12] text-white shadow-[0_12px_24px_-20px_rgba(0,0,0,0.9)]" : "text-white/68 hover:bg-white/[0.07] hover:text-white"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="domify-admin-nav-active"
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-domify-soft-gold"
                    />
                  )}
                  <item.icon size={16} strokeWidth={active ? 2.15 : 1.8} className="relative shrink-0" />
                  <span className="relative truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function ReturnToSite({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="pressable m-4 mt-0 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/66 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
    >
      <ArrowLeft size={15} /> Retour au site
    </Link>
  );
}

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const sections = getSections(role);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <aside className="hidden w-72 shrink-0 bg-[linear-gradient(180deg,#12384c_0%,#102f42_54%,#0c2636_100%)] text-white lg:flex lg:flex-col">
        <SidebarBrand />
        <SidebarNav sections={sections} pathname={pathname} />
        <ReturnToSite />
      </aside>

      <div className="flex h-[70px] w-full items-center justify-between border-b border-domify-dark/8 bg-domify-primary-dark px-4 text-white shadow-[0_10px_28px_-24px_rgba(16,47,66,0.9)] lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-domify-gold text-white">
            <Building2 size={15} />
          </span>
          <div>
            <p className="font-display text-base font-semibold leading-none">Domify Admin</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/44">Back office</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" aria-expanded={mobileOpen} className="pressable flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/[0.07]">
          <Menu size={20} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.button
              type="button"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              aria-label="Fermer le menu"
              className="absolute inset-0 bg-domify-primary-dark/48 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={reduceMotion ? false : { x: "-104%" }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: "-104%" }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[87vw] flex-col bg-[linear-gradient(180deg,#12384c_0%,#102f42_54%,#0c2636_100%)] text-white shadow-2xl"
            >
              <div className="flex h-24 items-center justify-between border-b border-white/10 px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-domify-gold text-white">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold">Domify Admin</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/44">Back office</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" className="pressable flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                  <X size={18} />
                </button>
              </div>
              <SidebarNav sections={sections} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <ReturnToSite onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
