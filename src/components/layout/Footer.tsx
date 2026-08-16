import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Camera, Globe, Mail, MapPin, Phone, Users } from "lucide-react";
import { getSiteSettings } from "@/lib/data/settings";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/get-dictionary";

export async function Footer({ dict }: { locale: Locale; dict: Dictionary }) {
  const settings = await getSiteSettings();

  const navLinks = [
    { label: dict.nav.buy, href: "/proprietes?listingType=VENTE" },
    { label: dict.nav.rent, href: "/proprietes?listingType=LOCATION" },
    { label: dict.nav.agencies, href: "/agences" },
    { label: dict.nav.agents, href: "/agents" },
    { label: dict.nav.blog, href: "/blog" },
    { label: dict.nav.contact, href: "/contact" },
  ];

  const usefulLinks = [
    { label: dict.footer.sellOrRent, href: "/vendre-louer" },
    { label: dict.footer.estimate, href: "/estimation" },
    { label: dict.footer.mapSearch, href: "/carte" },
    { label: dict.footer.neighborhoods, href: "/quartiers" },
    { label: dict.footer.compare, href: "/comparer" },
    { label: dict.footer.mortgageCalculator, href: "/calculateur-credit" },
    { label: dict.footer.investmentCalculator, href: "/calculateur-investissement" },
    { label: dict.footer.partner, href: "/tarifs" },
    { label: dict.footer.faq, href: "/faq" },
    { label: dict.footer.terms, href: "/conditions-generales" },
    { label: dict.footer.privacy, href: "/politique-de-confidentialite" },
  ];

  const socials = [
    { Icon: Globe, url: settings.social_facebook, label: "Facebook" },
    { Icon: Camera, url: settings.social_instagram, label: "Instagram" },
    { Icon: Users, url: settings.social_linkedin, label: "LinkedIn" },
  ].filter((social) => social.url);

  return (
    <footer className="relative overflow-hidden bg-domify-primary-dark text-white/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-domify-soft-gold/90 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -left-32 bottom-[-10rem] h-80 w-80 rounded-full bg-domify-primary/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.1fr_0.8fr_1fr] lg:gap-16">
          <div className="max-w-md">
            <Link href="/" className="group pressable inline-flex rounded-xl" aria-label="Domify — accueil">
              <span className="relative block h-12 w-[136px] overflow-hidden rounded-lg bg-[#132c45] ring-1 ring-domify-soft-gold/60 transition-luxury group-hover:ring-2">
                <Image src="/brand/domify-logo-horizontal.png" alt="Domify" fill sizes="136px" className="object-contain" />
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/62">{dict.footer.tagline}</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {socials.map(({ Icon, url, label }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/75 hover:-translate-y-0.5 hover:border-domify-soft-gold hover:bg-domify-gold hover:text-white">
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <Link href="/vendre-louer" className="pressable mt-8 inline-flex items-center gap-2 rounded-full bg-domify-gold px-5 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 hover:bg-domify-soft-gold hover:text-domify-primary-dark">
              {dict.footer.sellOrRent} <ArrowUpRight size={15} />
            </Link>
          </div>

          <FooterColumn title={dict.footer.navigation} links={navLinks} />
          <FooterColumn title={dict.footer.usefulLinks} links={usefulLinks} />
        </div>

        <div className="grid gap-6 border-b border-white/10 py-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <p className="luxury-eyebrow text-domify-soft-gold">{dict.footer.contact}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-white">Parlons de votre prochain lieu de vie.</p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-white/70 sm:grid-cols-3">
            {settings.contact_phone && <ContactItem icon={<Phone size={15} />} value={settings.contact_phone} />}
            {settings.contact_email && <ContactItem icon={<Mail size={15} />} value={settings.contact_email} />}
            {settings.contact_address && <ContactItem icon={<MapPin size={15} />} value={settings.contact_address} />}
            {!settings.contact_phone && !settings.contact_email && !settings.contact_address && <p className="sm:col-span-3">Utilisez le formulaire Domify pour nous parler de votre projet immobilier.</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Domify. {dict.footer.rights}</span>
          <span className="font-medium tracking-[0.12em] text-white/35">FIND YOUR PERFECT PLACE</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h4 className="luxury-eyebrow text-domify-soft-gold">{title}</h4>
      <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="group pressable inline-flex items-center rounded-md text-white/68 hover:text-white">
              <span className="mr-0 inline-block h-px w-0 bg-domify-soft-gold transition-[width,margin] duration-300 group-hover:mr-2 group-hover:w-3" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactItem({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <div className="flex items-start gap-2.5"><span className="mt-0.5 shrink-0 text-domify-soft-gold">{icon}</span><span>{value}</span></div>;
}
