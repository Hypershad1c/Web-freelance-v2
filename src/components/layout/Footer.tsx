import Link from "next/link";
import Image from "next/image";
import { Globe, Camera, Users, Phone, Mail, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/data/settings";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/get-dictionary";

export async function Footer({ dict }: { locale: Locale; dict: Dictionary }) {
  const settings = await getSiteSettings();

  const navLinks = [
    { label: dict.nav.buy, href: "/proprietes?type=vente" },
    { label: dict.nav.rent, href: "/proprietes?type=location" },
    { label: dict.nav.agencies, href: "/agences" },
    { label: dict.nav.blog, href: "/blog" },
    { label: dict.nav.contact, href: "/contact" },
  ];

  const usefulLinks = [
    { label: dict.footer.sellOrRent, href: "/vendre-louer" },
    { label: dict.footer.estimate, href: "/estimation" },
    { label: dict.footer.mapSearch, href: "/carte" },
    { label: dict.footer.compare, href: "/comparer" },
    { label: dict.footer.mortgageCalculator, href: "/calculateur-credit" },
    { label: dict.footer.investmentCalculator, href: "/calculateur-investissement" },
    { label: dict.footer.partner, href: "/contact" },
    { label: dict.footer.faq, href: "/faq" },
    { label: dict.footer.terms, href: "/conditions-generales" },
    { label: dict.footer.privacy, href: "/politique-de-confidentialite" },
  ];

  return (
    <footer className="relative overflow-hidden bg-domify-primary-dark text-white/80">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-domify-soft-gold/80 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -left-32 bottom-[-8rem] h-64 w-64 rounded-full bg-domify-primary/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.25fr_0.75fr_1fr_1fr] lg:gap-12 lg:px-8 lg:py-20">
        <div className="max-w-sm">
          <Link href="/" className="group pressable flex items-center gap-3 rounded-full">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-domify-soft-gold/60 transition-luxury group-hover:ring-2">
              <Image src="/Logo.jpeg" alt="Domify" fill className="object-cover" />
            </span>
            <span className="font-display text-lg font-semibold tracking-[0.18em] text-white">DOMIFY</span>
          </Link>
          <p className="mt-5 text-sm leading-7 text-white/62">{dict.footer.tagline}</p>
          <div className="mt-6 flex gap-2.5">
            {[
              { Icon: Globe, url: settings.social_facebook },
              { Icon: Camera, url: settings.social_instagram },
              { Icon: Users, url: settings.social_linkedin },
            ]
              .filter((social) => social.url)
              .map(({ Icon, url }, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/5 hover:-translate-y-0.5 hover:border-domify-soft-gold hover:bg-domify-gold hover:text-white"
                >
                  <Icon size={16} />
                </a>
              ))}
          </div>
        </div>

        <FooterColumn title={dict.footer.navigation} links={navLinks} />
        <FooterColumn title={dict.footer.usefulLinks} links={usefulLinks} />

        <div>
          <h4 className="luxury-eyebrow text-domify-soft-gold">{dict.footer.contact}</h4>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-white/68">
            <li className="flex items-start gap-3"><Phone className="mt-1 shrink-0 text-domify-soft-gold" size={15} /> <span>{settings.contact_phone}</span></li>
            <li className="flex items-start gap-3"><Mail className="mt-1 shrink-0 text-domify-soft-gold" size={15} /> <span>{settings.contact_email}</span></li>
            <li className="flex items-start gap-3"><MapPin className="mt-1 shrink-0 text-domify-soft-gold" size={15} /> <span>{settings.contact_address}</span></li>
          </ul>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} Domify. {dict.footer.rights}</span>
        <span className="font-medium tracking-[0.12em] text-white/35">FIND YOUR PERFECT PLACE</span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h4 className="luxury-eyebrow text-domify-soft-gold">{title}</h4>
      <ul className="mt-5 space-y-3 text-sm">
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
