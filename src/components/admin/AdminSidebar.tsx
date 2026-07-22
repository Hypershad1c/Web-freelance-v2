"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };
type NavSection = { title: string; items: NavItem[] };
type Role = "ADMIN" | "EDITOR" | "AGENT" | "USER";

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
      { label: "Messages", href: "/admin/messages", icon: Mail },
    ],
  },
  {
    title: "Système",
    items: [
      { label: "SEO", href: "/admin/seo", icon: Search },
      { label: "Analytique", href: "/admin/analytics", icon: BarChart3 },
      { label: "Paramètres", href: "/admin/settings", icon: Settings },
    ],
  },
];

// Editors manage content but never accounts/roles — those two items are dropped.
const EDITOR_HIDDEN_HREFS = new Set(["/admin/users", "/admin/roles"]);
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

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const sections = getSections(role);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-black/5 bg-domify-primary-dark text-white lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-2 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-domify-gold text-white">
          <Building2 size={16} />
        </span>
        <span className="font-display text-lg font-semibold">Domify Admin</span>
      </div>

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

      <Link
        href="/"
        className="flex items-center gap-2 border-t border-white/10 px-6 py-4 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft size={15} /> Retour au site
      </Link>
    </aside>
  );
}
