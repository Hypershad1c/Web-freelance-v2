"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };
type NavSection = { title: string; items: NavItem[] };
export type Role = "ADMIN" | "EDITOR" | "AGENT" | "USER";

// Admin & Editor share the full back-office nav, minus a couple of Admin-only
// items filtered out below. Agent gets a deliberately small, activity-focused nav
// scoped to what a single agent needs day to day.
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

// Editors manage content but never accounts/roles — those two items are dropped.
const EDITOR_HIDDEN_HREFS = new Set(["/admin/users", "/admin/roles", "/admin/approvals", "/admin/audit-log", "/admin/agent-performance"]);
// Système (SEO/Analytics/Settings) stays Admin-only for now.
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
      items:
        role === "ADMIN"
          ? section.items
          : section.items.filter((item) => !EDITOR_HIDDEN_HREFS.has(item.href)),
    }))
    .filter((section) => section.items.length > 0);
}

function SidebarBrand() {
  return (
    <div className="flex h-20 items-center gap-2 px-6">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-domify-gold text-white">
        <Building2 size={16} />
      </span>
      <span className="font-display text-lg font-semibold">Domify Admin</span>
    </div>
  );
}

function SidebarNav({ sections, pathname, onNavigate }: { sections: NavSection[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-luxury",
                    active ? "bg-domify-gold text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const sections = getSections(role);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close the mobile drawer whenever the route changes (tapping a link).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-black/5 bg-domify-primary-dark text-white lg:flex lg:flex-col">
        <SidebarBrand />
        <SidebarNav sections={sections} pathname={pathname} />
        <Link
          href="/"
          className="flex items-center gap-2 border-t border-white/10 px-6 py-4 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft size={15} /> Retour au site
        </Link>
      </aside>

      {/* Mobile topbar + hamburger trigger */}
      <div className="flex h-16 w-full items-center justify-between border-b border-black/5 bg-domify-primary-dark px-4 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-domify-gold text-white">
            <Building2 size={14} />
          </span>
          <span className="font-display text-base font-semibold">Domify Admin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" className="p-1">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-domify-primary-dark text-white shadow-xl"
            >
              <div className="flex h-20 items-center justify-between px-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-domify-gold text-white">
                    <Building2 size={16} />
                  </span>
                  <span className="font-display text-lg font-semibold">Domify Admin</span>
                </div>
                <button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu">
                  <X size={20} />
                </button>
              </div>
              <SidebarNav sections={sections} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <Link
                href="/"
                className="flex items-center gap-2 border-t border-white/10 px-6 py-4 text-sm text-white/60 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <ArrowLeft size={15} /> Retour au site
              </Link>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
